const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreLabel = document.getElementById('scoreLabel');
const ammoLabel = document.getElementById('ammoLabel');
const restartBtn = document.getElementById('restartBtn');
const gameOverMsg = document.getElementById('gameOverMsg');

// Game constants
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const TANK_WIDTH = 50;
const TANK_HEIGHT = 30;
const TANK_Y = HEIGHT - TANK_HEIGHT - 10;
const BULLET_WIDTH = 6;
const BULLET_HEIGHT = 12;
const BULLET_SPEED = 7;
const TARGET_WIDTH = 60;
const TARGET_HEIGHT = 24;
const TARGET_Y = 40;
const MAX_AMMO = 10;

// Game variables
let tankX, bullets, targetX, targetDirection, targetSpeed, score, ammo, isGameOver, animationFrameId;

function initGame() {
  tankX = WIDTH / 2 - TANK_WIDTH / 2;
  bullets = [];
  targetX = Math.random() * (WIDTH - TARGET_WIDTH);
  targetDirection = 1;
  targetSpeed = 3;
  score = 0;
  ammo = MAX_AMMO;
  isGameOver = false;
  scoreLabel.textContent = `Score: ${score}`;
  ammoLabel.textContent = ` | Ammo: ${ammo}`;
  gameOverMsg.textContent = '';
  restartBtn.style.display = 'none';
}

function shoot() {
  if (isGameOver || ammo <= 0) return;
  bullets.push({
    x: tankX + TANK_WIDTH / 2 - BULLET_WIDTH / 2,
    y: TANK_Y
  });
  ammo--;
  ammoLabel.textContent = ` | Ammo: ${ammo}`;
}

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  tankX = e.clientX - rect.left - TANK_WIDTH / 2;
  if (tankX < 0) tankX = 0;
  if (tankX + TANK_WIDTH > WIDTH) tankX = WIDTH - TANK_WIDTH;
});

canvas.addEventListener('mousedown', shoot);
window.addEventListener('keydown', e => {
  if (e.code === "Space") shoot();
});
restartBtn.addEventListener('click', () => {
  initGame();
  gameLoop();
});

function update() {
  // Move target
  targetX += targetDirection * targetSpeed;
  if (targetX < 0 || targetX + TARGET_WIDTH > WIDTH) {
    targetDirection *= -1;
    targetX += targetDirection * targetSpeed;
  }

  // Move bullets
  for (let b of bullets) b.y -= BULLET_SPEED;
  bullets = bullets.filter(b => b.y + BULLET_HEIGHT > 0);

  // Collision detection
  for (let i = 0; i < bullets.length; i++) {
    let b = bullets[i];
    if (
      b.x < targetX + TARGET_WIDTH &&
      b.x + BULLET_WIDTH > targetX &&
      b.y < TARGET_Y + TARGET_HEIGHT &&
      b.y + BULLET_HEIGHT > TARGET_Y
    ) {
      score++;
      scoreLabel.textContent = `Score: ${score}`;
      targetX = Math.random() * (WIDTH - TARGET_WIDTH);
      bullets.splice(i, 1);
      break;
    }
  }
}

function drawTank() {
  ctx.fillStyle = "#5af";
  ctx.fillRect(tankX, TANK_Y, TANK_WIDTH, TANK_HEIGHT);
  ctx.fillStyle = "#fff";
  ctx.fillRect(tankX + TANK_WIDTH / 2 - 5, TANK_Y - 14, 10, 20);
}

function drawTarget() {
  ctx.fillStyle = "#fa5";
  ctx.fillRect(targetX, TARGET_Y, TARGET_WIDTH, TARGET_HEIGHT);
  ctx.fillStyle = "#222";
  ctx.font = "bold 16px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("TARGET", targetX + TARGET_WIDTH / 2, TARGET_Y + TARGET_HEIGHT - 6);
}

function drawBullets() {
  ctx.fillStyle = "#fff";
  for (let b of bullets) ctx.fillRect(b.x, b.y, BULLET_WIDTH, BULLET_HEIGHT);
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  drawTank();
  drawBullets();
  drawTarget();
}

function gameLoop() {
  if (isGameOver) return;
  update();
  draw();

  // Only end the game when out of ammo and all bullets are gone
  if (ammo === 0 && bullets.length === 0) {
    endGame();
    return;
  }

  animationFrameId = requestAnimationFrame(gameLoop);
}

function endGame() {
  isGameOver = true;
  gameOverMsg.textContent = `Game Over! Total score: ${score} / ${MAX_AMMO}`;
  restartBtn.style.display = 'inline-block';
  cancelAnimationFrame(animationFrameId);
}

// Start game
initGame();
gameLoop();