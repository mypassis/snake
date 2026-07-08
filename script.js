// ============================================
// NEON SNAKE - Complete Game Engine
// ============================================

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// DOM Elements
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const finalScoreEl = document.getElementById('finalScore');
const finalBestEl = document.getElementById('finalBest');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const hackMenu = document.getElementById('hackMenu');
const hackClose = document.getElementById('hackClose');
const autoPlayToggle = document.getElementById('autoPlayToggle');
const ghostModeToggle = document.getElementById('ghostModeToggle');
const infiniteLivesToggle = document.getElementById('infiniteLivesToggle');
const speedMultiplier = document.getElementById('speedMultiplier');
const speedValue = document.getElementById('speedValue');
const scoreMultiplier = document.getElementById('scoreMultiplier');
const scoreValue = document.getElementById('scoreValue');
const hackUnlockAll = document.getElementById('hackUnlockAll');

// Game Constants
const GRID_SIZE = 20;
let COLS, ROWS, CELL_SIZE;

// Game State
let gameState = 'start'; // start, playing, gameover
let snake = [];
let direction = { x: 1, y: 0 };
let nextDirection = { x: 1, y: 0 };
let food = null;
let specialFood = null;
let score = 0;
let highScore = parseInt(localStorage.getItem('neonSnakeHighScore')) || 0;
let gameLoop = null;
let lastTime = 0;
let accumulator = 0;
let particles = [];
let trailParticles = [];
let foodPulse = 0;
let screenShake = 0;
let comboCount = 0;
let comboTimer = 0;
let unlockAllActive = false;

// Hack Settings
let autoPlay = false;
let ghostMode = false;
let infiniteLives = false;
let speedMult = 1;
let scoreMult = 1;

// Colors
const COLORS = {
    snakeHead: '#06b6d4',
    snakeBody: '#8b5cf6',
    snakeTail: '#d946ef',
    food: '#f472b6',
    specialFood: '#fbbf24',
    grid: 'rgba(148, 163, 184, 0.05)',
    bg: '#1e293b'
};

// Initialize canvas size
function initCanvas() {
    const maxWidth = Math.min(window.innerWidth - 40, 500);
    const maxHeight = window.innerHeight * 0.5;
    
    CELL_SIZE = GRID_SIZE;
    COLS = Math.floor(maxWidth / CELL_SIZE);
    ROWS = Math.floor(Math.min(maxHeight, maxWidth) / CELL_SIZE);
    
    canvas.width = COLS * CELL_SIZE;
    canvas.height = ROWS * CELL_SIZE;
}

// Initialize game
function initGame() {
    initCanvas();
    highScoreEl.textContent = highScore;
    
    // Start position
    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
    
    snake = [
        { x: startX, y: startY },
        { x: startX - 1, y: startY },
        { x: startX - 2, y: startY }
    ];
    
    direction = { x: 1, y: 0 };
    nextDirection = { x: 1, y: 0 };
    score = 0;
    comboCount = 0;
    scoreEl.textContent = '0';
    
    spawnFood();
    specialFood = null;
    particles = [];
    trailParticles = [];
    unlockAllActive = false;
    
    updateHackUI();
}

// Spawn food
function spawnFood() {
    let validPosition = false;
    let x, y;
    
    while (!validPosition) {
        x = Math.floor(Math.random() * COLS);
        y = Math.floor(Math.random() * ROWS);
        
        validPosition = !snake.some(segment => segment.x === x && segment.y === y);
    }
    
    food = {
        x,
        y,
        type: 'normal',
        color: COLORS.food,
        glow: 0
    };
    
    // Chance to spawn special food
    if (Math.random() < 0.15 && !specialFood) {
        spawnSpecialFood();
    }
}

// Spawn special food
function spawnSpecialFood() {
    let validPosition = false;
    let x, y;
    
    while (!validPosition) {
        x = Math.floor(Math.random() * COLS);
        y = Math.floor(Math.random() * ROWS);
        validPosition = !snake.some(segment => segment.x === x && segment.y === y) 
                       && !(food && food.x === x && food.y === y);
    }
    
    const types = [
        { color: '#fbbf24', points: 5, label: '⭐' },
        { color: '#ef4444', points: 3, label: '🔥' },
        { color: '#22c55e', points: 10, label: '💎' }
    ];
    
    const type = types[Math.floor(Math.random() * types.length)];
    
    specialFood = {
        x,
        y,
        ...type,
        lifetime: 300, // frames before disappearing
        glow: 0
    };
}

// Draw grid
function drawGrid() {
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 0.5;
    
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(canvas.width, y * CELL_SIZE);
        ctx.stroke();
    }
}

// Draw snake
function drawSnake() {
    snake.forEach((segment, index) => {
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;
        const progress = index / snake.length;
        
        // Gradient from head to tail
        let color;
        if (index === 0) {
            color = COLORS.snakeHead;
        } else if (index < snake.length / 3) {
            color = lerpColor(COLORS.snakeHead, COLORS.snakeBody, progress * 3);
        } else if (index < snake.length * 2 / 3) {
            color = lerpColor(COLORS.snakeBody, COLORS.snakeTail, (progress - 1/3) * 3);
        } else {
            color = COLORS.snakeTail;
        }
        
        // Glow effect
        ctx.shadowBlur = index === 0 ? 20 : 10;
        ctx.shadowColor = color;
        
        // Draw rounded rectangle
        const padding = 1;
        const radius = 4;
        const rectX = x + padding;
        const rectY = y + padding;
        const rectW = CELL_SIZE - padding * 2;
        const rectH = CELL_SIZE - padding * 2;
        
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(rectX, rectY, rectW, rectH, radius);
        ctx.fill();
        
        // Inner highlight for head
        if (index === 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.roundRect(rectX + 2, rectY + 2, rectW - 4, rectH - 4, radius - 1);
            ctx.fill();
            
            // Eyes
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#fff';
            const eyeSize = 3;
            const eyeOffset = 5;
            
            if (direction.x === 1) {
                ctx.beginPath();
                ctx.arc(x + CELL_SIZE - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + CELL_SIZE - eyeOffset, y + CELL_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            } else if (direction.x === -1) {
                ctx.beginPath();
                ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + eyeOffset, y + CELL_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            } else if (direction.y === -1) {
                ctx.beginPath();
                ctx.arc(x + eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + CELL_SIZE - eyeOffset, y + eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(x + eyeOffset, y + CELL_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + CELL_SIZE - eyeOffset, y + CELL_SIZE - eyeOffset, eyeSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.shadowBlur = 0;
    });
}

// Draw food
function drawFood() {
    if (!food) return;
    
    const x = food.x * CELL_SIZE + CELL_SIZE / 2;
    const y = food.y * CELL_SIZE + CELL_SIZE / 2;
    const pulse = Math.sin(foodPulse) * 0.2 + 1;
    const radius = (CELL_SIZE / 2 - 2) * pulse;
    
    // Outer glow
    ctx.shadowBlur = 25;
    ctx.shadowColor = food.color;
    
    // Main circle
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, '#fff');
    gradient.addColorStop(0.3, food.color);
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Inner circle
    ctx.fillStyle = food.color;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
}

// Draw special food
function drawSpecialFood() {
    if (!specialFood) return;
    
    const x = specialFood.x * CELL_SIZE + CELL_SIZE / 2;
    const y = specialFood.y * CELL_SIZE + CELL_SIZE / 2;
    const pulse = Math.sin(foodPulse * 1.5) * 0.3 + 1;
    const radius = (CELL_SIZE / 2 - 1) * pulse;
    
    // Rotating glow
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(foodPulse * 0.05);
    
    ctx.shadowBlur = 30;
    ctx.shadowColor = specialFood.color;
    
    // Star shape
    ctx.fillStyle = specialFood.color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
    ctx.shadowBlur = 0;
}

// Particle system
function createParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x * CELL_SIZE + CELL_SIZE / 2,
            y: y * CELL_SIZE + CELL_SIZE / 2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1,
            decay: 0.02 + Math.random() * 0.03,
            color,
            size: 2 + Math.random() * 4
        });
    }
}

function createTrailParticle(x, y, color) {
    trailParticles.push({
        x: x * CELL_SIZE + CELL_SIZE / 2,
        y: y * CELL_SIZE + CELL_SIZE / 2,
        life: 1,
        decay: 0.05,
        color,
        size: CELL_SIZE * 0.3
    });
}

function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;
        p.vx *= 0.95;
        p.vy *= 0.95;
        return p.life > 0;
    });
    
    trailParticles = trailParticles.filter(p => {
        p.life -= p.decay;
        return p.life > 0;
    });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    });
    
    trailParticles.forEach(p => {
        ctx.globalAlpha = p.life * 0.5;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 5;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
    });
    
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

// Combo display
function drawCombo() {
    if (comboCount > 1 && comboTimer > 0) {
        const alpha = comboTimer / 60;
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${24 + comboCount * 2}px Inter`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fbbf24';
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#fbbf24';
        ctx.fillText(`${comboCount}x COMBO!`, canvas.width / 2, 40);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

// Update game state
function update() {
    if (gameState !== 'playing') return;
    
    // Update direction from auto-play
    if (autoPlay && gameState === 'playing') {
        autoPlayMove();
    }
    
    direction = { ...nextDirection };
    
    // Calculate new head position
    const head = { ...snake[0] };
    head.x += direction.x;
    head.y += direction.y;
    
    // Wall collision
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
        if (!ghostMode && !infiniteLives) {
            gameOver();
            return;
        } else if (infiniteLives) {
            // Wrap around
            head.x = ((head.x % COLS) + COLS) % COLS;
            head.y = ((head.y % ROWS) + ROWS) % ROWS;
        }
    }
    
    // Self collision
    if (!ghostMode && snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        if (!infiniteLives) {
            gameOver();
            return;
        }
    }
    
    // Add new head
    snake.unshift(head);
    
    // Create trail particle for old head
    if (snake.length > 1) {
        const oldHead = snake[1];
        createTrailParticle(oldHead.x, oldHead.y, COLORS.snakeBody);
    }
    
    // Check food collision
    let ate = false;
    if (food && head.x === food.x && head.y === food.y) {
        const points = Math.floor(1 * scoreMult * (1 + comboCount * 0.1));
        score += points;
        comboCount++;
        comboTimer = 60;
        scoreEl.textContent = score;
        createParticles(food.x, food.y, food.color, 15);
        screenShake = 5;
        spawnFood();
        ate = true;
    }
    
    // Check special food collision
    if (specialFood && head.x === specialFood.x && head.y === specialFood.y) {
        const points = Math.floor(specialFood.points * scoreMult);
        score += points;
        comboCount = 0;
        scoreEl.textContent = score;
        createParticles(specialFood.x, specialFood.y, specialFood.color, 25);
        screenShake = 10;
        specialFood = null;
        ate = true;
    }
    
    // If didn't eat, remove tail
    if (!ate) {
        const tail = snake.pop();
        if (unlockAllActive) {
            createTrailParticle(tail.x, tail.y, COLORS.snakeTail);
        }
    }
    
    // Special food timer
    if (specialFood) {
        specialFood.lifetime--;
        if (specialFood.lifetime <= 0) {
            specialFood = null;
        }
    }
    
    // Combo timer
    if (comboTimer > 0) {
        comboTimer--;
        if (comboTimer <= 0) {
            comboCount = 0;
        }
    }
    
    // Screen shake decay
    if (screenShake > 0) screenShake *= 0.8;
    if (screenShake < 0.5) screenShake = 0;
}

// Auto-play AI
function autoPlayMove() {
    const head = snake[0];
    const target = specialFood || food;
    if (!target) return;
    
    const dx = target.x - head.x;
    const dy = target.y - head.y;
    
    // Get all possible moves
    const moves = [
        { x: 0, y: -1 }, // up
        { x: 0, y: 1 },  // down
        { x: -1, y: 0 }, // left
        { x: 1, y: 0 }   // right
    ];
    
    // Filter out reverse direction
    const validMoves = moves.filter(m => !(m.x === -direction.x && m.y === -direction.y));
    
    // Score each move
    let bestMove = null;
    let bestScore = -Infinity;
    
    validMoves.forEach(move => {
        const newX = head.x + move.x;
        const newY = head.y + move.y;
        let score = 0;
        
        // Check if move leads to food
        const distToFood = Math.abs(newX - target.x) + Math.abs(newY - target.y);
        score = -distToFood;
        
        // Penalty for hitting walls or self
        if (newX < 0 || newX >= COLS || newY < 0 || newY >= ROWS) {
            score -= 1000;
        }
        
        if (snake.some(s => s.x === newX && s.y === newY)) {
            score -= 1000;
        }
        
        // Bonus for being close to center (safer)
        const distFromCenter = Math.abs(newX - COLS / 2) + Math.abs(newY - ROWS / 2);
        score -= distFromCenter * 0.1;
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    });
    
    if (bestMove) {
        nextDirection = bestMove;
    }
}

// Render
function render() {
    // Clear with shake offset
    ctx.save();
    if (screenShake > 0) {
        ctx.translate(
            (Math.random() - 0.5) * screenShake,
            (Math.random() - 0.5) * screenShake
        );
    }
    
    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Grid
    drawGrid();
    
    // Particles (behind everything)
    drawParticles();
    
    // Food
    drawFood();
    drawSpecialFood();
    
    // Snake
    drawSnake();
    
    // Combo
    drawCombo();
    
    ctx.restore();
}

// Game loop
function gameLoopFn(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    
    const baseInterval = 100; // ms per tick
    const adjustedInterval = baseInterval / speedMult;
    
    accumulator += deltaTime;
    
    while (accumulator >= adjustedInterval) {
        foodPulse += 0.1;
        update();
        updateParticles();
        accumulator -= adjustedInterval;
    }
    
    render();
    gameLoop = requestAnimationFrame(gameLoopFn);
}

// Start game
function startGame() {
    initGame();
    gameState = 'playing';
    startOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    lastTime = 0;
    accumulator = 0;
    
    if (gameLoop) cancelAnimationFrame(gameLoop);
    gameLoop = requestAnimationFrame(gameLoopFn);
}

// Game over
function gameOver() {
    gameState = 'gameover';
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('neonSnakeHighScore', highScore);
        highScoreEl.textContent = highScore;
    }
    
    finalScoreEl.textContent = score;
    finalBestEl.textContent = highScore;
    gameOverOverlay.classList.remove('hidden');
    
    // Death particles
    snake.forEach(segment => {
        createParticles(segment.x, segment.y, '#ef4444', 5);
    });
}

// Color interpolation helper
function lerpColor(color1, color2, t) {
    const r1 = parseInt(color1.slice(1, 3), 16);
    const g1 = parseInt(color1.slice(3, 5), 16);
    const b1 = parseInt(color1.slice(5, 7), 16);
    const r2 = parseInt(color2.slice(1, 3), 16);
    const g2 = parseInt(color2.slice(3, 5), 16);
    const b2 = parseInt(color2.slice(5, 7), 16);
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return `rgb(${r}, ${g}, ${b})`;
}

// Input handling
document.addEventListener('keydown', (e) => {
    if (gameState !== 'playing') return;
    
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
            e.preventDefault();
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
            e.preventDefault();
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
            e.preventDefault();
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
            e.preventDefault();
            break;
        case '`':
        case '~':
            toggleHackMenu();
            e.preventDefault();
            break;
    }
});

// Touch/swipe handling
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    e.preventDefault();
}, { passive: false });

canvas.addEventListener('touchend', (e) => {
    if (gameState !== 'playing') return;
    
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    const minSwipe = 30;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > minSwipe) {
            if (dx > 0 && direction.x !== -1) nextDirection = { x: 1, y: 0 };
            else if (dx < 0 && direction.x !== 1) nextDirection = { x: -1, y: 0 };
        }
    } else {
        if (Math.abs(dy) > minSwipe) {
            if (dy > 0 && direction.y !== -1) nextDirection = { x: 0, y: 1 };
            else if (dy < 0 && direction.y !== 1) nextDirection = { x: 0, y: -1 };
        }
    }
    
    e.preventDefault();
}, { passive: false });

// Control buttons
document.querySelectorAll('.control-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (gameState !== 'playing') return;
        
        const dir = btn.dataset.direction;
        switch(dir) {
            case 'up':
                if (direction.y !== 1) nextDirection = { x: 0, y: -1 };
                break;
            case 'down':
                if (direction.y !== -1) nextDirection = { x: 0, y: 1 };
                break;
            case 'left':
                if (direction.x !== 1) nextDirection = { x: -1, y: 0 };
                break;
            case 'right':
                if (direction.x !== -1) nextDirection = { x: 1, y: 0 };
                break;
        }
    });
});

// Hack menu
function toggleHackMenu() {
    hackMenu.classList.toggle('hidden');
    setTimeout(() => {
        hackMenu.classList.toggle('visible');
    }, 10);
}

hackClose.addEventListener('click', () => {
    hackMenu.classList.remove('visible');
    setTimeout(() => {
        hackMenu.classList.add('hidden');
    }, 300);
});

// Hack toggles
autoPlayToggle.addEventListener('change', () => {
    autoPlay = autoPlayToggle.checked;
    updateHackUI();
});

ghostModeToggle.addEventListener('change', () => {
    ghostMode = ghostModeToggle.checked;
    updateHackUI();
});

infiniteLivesToggle.addEventListener('change', () => {
    infiniteLives = infiniteLivesToggle.checked;
    updateHackUI();
});

speedMultiplier.addEventListener('input', () => {
    speedMult = parseFloat(speedMultiplier.value);
    speedValue.textContent = speedMult.toFixed(1) + 'x';
});

scoreMultiplier.addEventListener('input', () => {
    scoreMult = parseInt(scoreMultiplier.value);
    scoreValue.textContent = scoreMult + 'x';
});

hackUnlockAll.addEventListener('click', () => {
    unlockAllActive = !unlockAllActive;
    hackUnlockAll.querySelector('.btn-hack').textContent = unlockAllActive ? 'LOCK ALL FOOD' : 'UNLOCK ALL FOOD';
    hackUnlockAll.querySelector('.btn-hack').style.background = unlockAllActive 
        ? 'linear-gradient(135deg, #22c55e, #10b981)' 
        : 'linear-gradient(135deg, #ef4444, #f97316)';
});

function updateHackUI() {
    document.querySelectorAll('.hack-toggle').forEach(toggle => {
        const checkbox = toggle.querySelector('input[type="checkbox"]');
        if (checkbox.checked) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
        }
    });
}

// Button handlers
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Resize handler
window.addEventListener('resize', () => {
    if (gameState === 'playing') {
        // Save snake positions relative to new grid
        const oldCols = COLS;
        const oldRows = ROWS;
        initCanvas();
        
        // Rescale snake
        snake = snake.map(s => ({
            x: Math.floor((s.x / oldCols) * COLS),
            y: Math.floor((s.y / oldRows) * ROWS)
        }));
        
        // Ensure food is within bounds
        if (food) {
            food.x = Math.min(food.x, COLS - 1);
            food.y = Math.min(food.y, ROWS - 1);
        }
        if (specialFood) {
            specialFood.x = Math.min(specialFood.x, COLS - 1);
            specialFood.y = Math.min(specialFood.y, ROWS - 1);
        }
    } else {
        initCanvas();
    }
});

// Initial render
initCanvas();
render();
