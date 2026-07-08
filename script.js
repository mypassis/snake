// Game State
const state = {
  snake: [],
  direction: 'right',
  nextDirection: 'right',
  food: null,
  score: 0,
  highScore: parseInt(localStorage.getItem('snakeHighScore')) || 0,
  gameOver: false,
  started: false,
  speed: 150,
  gridSize: 20,
  tileCount: 20,
  canvas: null,
  ctx: null,
  animationId: null,
  lastUpdate: 0,
  particles: [],
  foodPulse: 0,
};

// DOM Elements
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');
const finalScoreEl = document.getElementById('finalScore');
const finalBestEl = document.getElementById('finalBest');
const startOverlay = document.getElementById('startOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const controlBtns = document.querySelectorAll('.control-btn');

// Initialize Canvas
function initCanvas() {
  state.canvas = document.getElementById('gameCanvas');
  state.ctx = state.canvas.getContext('2d');
  
  // Set canvas size based on screen
  const maxSize = Math.min(window.innerWidth - 40, window.innerHeight - 300, 400);
  state.canvas.width = maxSize;
  state.canvas.height = maxSize;
  state.tileCount = Math.floor(maxSize / state.gridSize);
}

// Initialize Game
function initGame() {
  state.snake = [
    {x: 5, y: 10},
    {x: 4, y: 10},
    {x: 3, y: 10},
  ];
  state.direction = 'right';
  state.nextDirection = 'right';
  state.score = 0;
  state.gameOver = false;
  state.speed = 150;
  state.particles = [];
  state.food = spawnFood();
  updateScore();
  highScoreEl.textContent = state.highScore;
}

// Spawn Food
function spawnFood() {
  let food;
  do {
    food = {
      x: Math.floor(Math.random() * state.tileCount),
      y: Math.floor(Math.random() * state.tileCount),
    };
  } while (state.snake.some(seg => seg.x === food.x && seg.y === food.y));
  return food;
}

// Create Particles
function createParticles(x, y, color) {
  for (let i = 0; i < 8; i++) {
    state.particles.push({
      x: x * state.gridSize + state.gridSize / 2,
      y: y * state.gridSize + state.gridSize / 2,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 1,
      color,
      size: Math.random() * 3 + 2,
    });
  }
}

// Update Particles
function updateParticles() {
  state.particles = state.particles.filter(p => p.life > 0);
  state.particles.forEach(p => {
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.03;
    p.size *= 0.97;
  });
}

// Draw Particles
function drawParticles() {
  state.particles.forEach(p => {
    state.ctx.save();
    state.ctx.globalAlpha = p.life;
    state.ctx.fillStyle = p.color;
    state.ctx.shadowColor = p.color;
    state.ctx.shadowBlur = 10;
    state.ctx.beginPath();
    state.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    state.ctx.fill();
    state.ctx.restore();
  });
}

// Handle Input
function handleInput(direction) {
  if (state.gameOver || !state.started) return;
  
  const opposites = {up: 'down', down: 'up', left: 'right', right: 'left'};
  if (direction !== opposites[state.direction]) {
    state.nextDirection = direction;
  }
}

// Keyboard Controls
document.addEventListener('keydown', (e) => {
  const keyMap = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right',
  };
  if (keyMap[e.key]) {
    e.preventDefault();
    handleInput(keyMap[e.key]);
  }
});

// Touch Controls
let touchStartX = 0;
let touchStartY = 0;

state.canvas?.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, {passive: true});

state.canvas?.addEventListener('touchend', (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  
  if (Math.abs(dx) > Math.abs(dy)) {
    handleInput(dx > 0 ? 'right' : 'left');
  } else {
    handleInput(dy > 0 ? 'down' : 'up');
  }
}, {passive: true});

// Button Controls
controlBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    handleInput(btn.dataset.direction);
    btn.style.transform = 'scale(0.95)';
    setTimeout(() => btn.style.transform = '', 100);
  });
  
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInput(btn.dataset.direction);
  }, {passive: false});
});

// Game Update
function update() {
  if (state.gameOver || !state.started) return;
  
  state.direction = state.nextDirection;
  const head = {...state.snake[0]};
  
  switch(state.direction) {
    case 'up': head.y--; break;
    case 'down': head.y++; break;
    case 'left': head.x--; break;
    case 'right': head.x++; break;
  }
  
  // Wall Collision
  if (head.x < 0 || head.x >= state.tileCount || head.y < 0 || head.y >= state.tileCount) {
    endGame();
    return;
  }
  
  // Self Collision
  if (state.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
    endGame();
    return;
  }
  
  state.snake.unshift(head);
  
  // Eat Food
  if (state.food && head.x === state.food.x && head.y === state.food.y) {
    state.score += 10;
    createParticles(state.food.x, state.food.y, '#f472b6');
    state.food = spawnFood();
    
    // Increase speed slightly
    if (state.speed > 80) {
      state.speed -= 2;
    }
    
    updateScore();
  } else {
    state.snake.pop();
  }
}

// Draw Game
function draw(timestamp) {
  const ctx = state.ctx;
  const tileSize = state.canvas.width / state.tileCount;
  
  // Clear with dark background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, state.canvas.width, state.canvas.height);
  
  // Draw subtle grid
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= state.tileCount; i++) {
    ctx.beginPath();
    ctx.moveTo(i * tileSize, 0);
    ctx.lineTo(i * tileSize, state.canvas.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * tileSize);
    ctx.lineTo(state.canvas.width, i * tileSize);
    ctx.stroke();
  }
  
  // Draw Snake
  state.snake.forEach((seg, i) => {
    const alpha = 1 - (i / state.snake.length) * 0.5;
    const hue = i < 3 ? 270 : 220;
    
    ctx.fillStyle = `hsla(${hue}, 80%, 65%, ${alpha})`;
    ctx.shadowColor = `hsla(${hue}, 80%, 65%, 0.8)`;
    ctx.shadowBlur = 15;
    
    const padding = 2;
    ctx.beginPath();
    ctx.roundRect(
      seg.x * tileSize + padding,
      seg.y * tileSize + padding,
      tileSize - padding * 2,
      tileSize - padding * 2,
      6
    );
    ctx.fill();
  });
  
  ctx.shadowBlur = 0;
  
  // Draw Food
  if (state.food) {
    state.foodPulse = (Math.sin(Date.now() / 200) + 1) / 2;
    
    const pulseSize = tileSize * (0.15 + state.foodPulse * 0.1);
    
    // Outer glow
    ctx.fillStyle = 'rgba(244, 114, 182, 0.3)';
    ctx.shadowColor = '#f472b6';
    ctx.shadowBlur = 20 + state.foodPulse * 10;
    ctx.beginPath();
    ctx.arc(
      state.food.x * tileSize + tileSize / 2,
      state.food.y * tileSize + tileSize / 2,
      tileSize / 2 + pulseSize,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Inner food
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(
      state.food.x * tileSize + tileSize / 2,
      state.food.y * tileSize + tileSize / 2,
      tileSize / 2 - 3,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(
      state.food.x * tileSize + tileSize / 2 - 3,
      state.food.y * tileSize + tileSize / 2 - 3,
      3,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  
  // Draw Particles
  updateParticles();
  drawParticles();
}

// Game Loop
function gameLoop(timestamp) {
  if (!state.lastUpdate) state.lastUpdate = timestamp;
  
  const delta = timestamp - state.lastUpdate;
  
  if (delta >= state.speed) {
    update();
    state.lastUpdate = timestamp;
  }
  
  draw(timestamp);
  state.animationId = requestAnimationFrame(gameLoop);
}

// Update Score Display
function updateScore() {
  scoreEl.textContent = state.score;
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem('snakeHighScore', state.highScore);
    highScoreEl.textContent = state.highScore;
  }
}

// Start Game
function startGame() {
  initCanvas();
  initGame();
  state.started = true;
  startOverlay.classList.add('hidden');
  gameOverOverlay.classList.add('hidden');
  state.animationId = requestAnimationFrame(gameLoop);
}

// End Game
function endGame() {
  state.gameOver = true;
  state.started = false;
  cancelAnimationFrame(state.animationId);
  
  finalScoreEl.textContent = state.score;
  finalBestEl.textContent = state.highScore;
  gameOverOverlay.classList.remove('hidden');
}

// Event Listeners
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);

// Handle resize
window.addEventListener('resize', () => {
  if (!state.started) {
    initCanvas();
  }
});

// Initial setup
initCanvas();
highScoreEl.textContent = state.highScore;
