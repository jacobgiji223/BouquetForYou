const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score-display');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const victoryScreen = document.getElementById('victory-screen');

// Load Images
const playerImage = new Image();
playerImage.src = 'friend.png'; 

const victoryImage = new Image();
victoryImage.src = 'end_reward.png'; 

// Load Audio (Make sure jump.mp3 and cheer.mp3 are in your folder!)
const jumpSound = new Audio('jump.mp3');
const cheerSound = new Audio('cheer.mp3');

function resizeCanvas() {
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game Variables
let frames = 0;
let score = 0;
let gameState = 'START'; 
const targetScore = 45; // Win condition is exactly 45

let flashIntensity = 0;
let confettiParticles = []; // Moved confetti into the Canvas so it NEVER fails

// The Player (Bird)
const bird = {
  x: 60,
  y: canvas.height / 2,
  radius: 30, 
  velocity: 0,
  gravity: 0.3, 
  jump: -6,    
  
  draw() {
    if (playerImage.complete && playerImage.naturalWidth > 0) {
      let size = this.radius * 2; 
      ctx.drawImage(playerImage, this.x - this.radius, this.y - this.radius, size, size);
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700'; 
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.closePath();
    }
  },
  
  update() {
    this.velocity += this.gravity;
    this.y += this.velocity;

    if (this.y + this.radius >= canvas.height) {
      this.y = canvas.height - this.radius;
      triggerGameOver();
    }
    if (this.y - this.radius <= 0) {
      this.y = this.radius;
      this.velocity = 0;
    }
  },
  
  flap() {
    this.velocity = this.jump;
    
    // ONLY play the jump sound if the cheer sound is NOT currently playing
    if (cheerSound.paused || cheerSound.ended) {
        jumpSound.currentTime = 0; 
        jumpSound.play().catch(e => console.log('Audio blocked by browser until interacted'));
    }
  }
};

// Pipes Setup
let pipes = [];
const pipeWidth = 60;
const pipeGap = 180; 
const pipeSpeed = 4; 

function drawPipes() {
  ctx.fillStyle = '#2ecc71'; 
  ctx.strokeStyle = '#27ae60';
  ctx.lineWidth = 4;
  
  pipes.forEach(pipe => {
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
    ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.topHeight);
    ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY);
    ctx.strokeRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY);
  });
}

function updatePipes() {
  if (frames % 100 === 0) {
    let minPipeHeight = 50;
    let maxPipeHeight = canvas.height - pipeGap - minPipeHeight;
    let topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1) + minPipeHeight);
    
    pipes.push({
      x: canvas.width,
      topHeight: topHeight,
      bottomY: topHeight + pipeGap,
      passed: false
    });
  }

  for (let i = 0; i < pipes.length; i++) {
    let p = pipes[i];
    p.x -= pipeSpeed;

    if (
      bird.x + bird.radius > p.x && 
      bird.x - bird.radius < p.x + pipeWidth && 
      (bird.y - bird.radius < p.topHeight || bird.y + bird.radius > p.bottomY)
    ) {
      triggerGameOver();
    }

    if (p.x + pipeWidth < bird.x && !p.passed) {
      score++;
      p.passed = true;
      scoreDisplay.innerText = score;

      // Check for mini celebration at 10, 20, 30, 40
      if (score % 10 === 0 && score !== 0 && score < targetScore) {
          triggerMiniCelebration();
      }

      // Check for final victory condition at 45!
      if (score === targetScore) {
        triggerVictory();
      }
    }

    if (p.x + pipeWidth < 0) {
      pipes.shift();
      i--;
    }
  }
}

// Canvas Confetti Logic
function createConfetti() {
  const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6']; 
  for (let i = 0; i < 100; i++) {
    confettiParticles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height, // Spawn above the screen
      vx: (Math.random() - 0.5) * 4,     // Drift sideways
      vy: Math.random() * 3 + 2,         // Fall down
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      angle: Math.random() * 360,
      spin: (Math.random() - 0.5) * 10
    });
  }
}

function drawAndProcessConfetti() {
  for (let i = 0; i < confettiParticles.length; i++) {
    let p = confettiParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.angle += p.spin;
    
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle * Math.PI / 180);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }
  // Automatically remove confetti when it falls off the bottom of the screen
  confettiParticles = confettiParticles.filter(p => p.y < canvas.height + 50);
}

// Mini Celebration Logic (Audio + Confetti)
function triggerMiniCelebration() {
    cheerSound.currentTime = 0;
    cheerSound.play().catch(e => console.log('Audio blocked'));
    createConfetti();
}

// Victory Screen Rendering
function drawVictoryScreen() {
  if (flashIntensity > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, ' + flashIntensity + ')';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      flashIntensity -= 0.05; 
  } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  let targetWidth = canvas.width * 0.9; 
  let targetHeight = 0;
  let offsetY = 0;

  if (victoryImage.complete && victoryImage.naturalWidth > 0) {
      let imgAspectRatio = victoryImage.width / victoryImage.height;
      targetHeight = targetWidth / imgAspectRatio;
      let offsetX = (canvas.width - targetWidth) / 2;
      
      offsetY = (canvas.height - targetHeight) / 2 - 50; 
      
      ctx.drawImage(victoryImage, offsetX, offsetY, targetWidth, targetHeight);
      
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = 'bold 16px sans-serif'; 
      ctx.fillText("Well done noob, btw this is for you homegirl", canvas.width / 2, offsetY + targetHeight + 60);
      
  } else {
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif'; 
      ctx.fillText("Well done noob, btw this is for you homegirl", canvas.width / 2, canvas.height / 2);
  }
}

// State Management
function triggerGameOver() {
  if (gameState !== 'VICTORY') {
    gameState = 'GAMEOVER';
    gameOverScreen.classList.add('active');
  }
}

function triggerVictory() {
  if (gameState !== 'VICTORY') {
      gameState = 'VICTORY';
      flashIntensity = 1; 
      victoryScreen.classList.add('active');
      createConfetti();
      // Play cheer for final victory
      cheerSound.currentTime = 0;
      cheerSound.play().catch(e => console.log('Audio blocked'));
  }
}

// Global Reset
window.resetGame = function() {
  bird.y = canvas.height / 2;
  bird.velocity = 0;
  pipes = [];
  score = 0;
  frames = 0;
  flashIntensity = 0;
  confettiParticles = []; // Clear any remaining confetti
  scoreDisplay.innerText = score;
  gameState = 'PLAYING';
  
  startScreen.classList.remove('active');
  gameOverScreen.classList.remove('active');
  victoryScreen.classList.remove('active');
  
  bird.flap();
}

// Input Handlers
function handleInput() {
  if (gameState === 'START') {
    resetGame();
  } else if (gameState === 'PLAYING') {
    bird.flap();
  }
}

// Event Listeners
container.addEventListener('mousedown', (e) => {
  if (e.target.tagName === 'BUTTON') return; // Let buttons be clicked
  if (gameState === 'GAMEOVER' || gameState === 'VICTORY') return; // BLOCK CLICKS if dead or won
  handleInput();
});

container.addEventListener('touchstart', (e) => {
  if (e.target.tagName === 'BUTTON') return; // Let buttons be clicked
  if (gameState === 'GAMEOVER' || gameState === 'VICTORY') return; // BLOCK TAPS if dead or won
  e.preventDefault(); 
  handleInput();
}, { passive: false });

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    if (gameState === 'GAMEOVER' || gameState === 'VICTORY') return; // BLOCK SPACEBAR if dead or won
    handleInput();
  }
});

// Main Loop
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === 'PLAYING') {
    updatePipes();
    drawPipes();
    bird.update();
    bird.draw();
    drawAndProcessConfetti(); // Draw confetti over the game
    frames++;
  } else if (gameState === 'GAMEOVER' || gameState === 'START') {
    drawPipes();
    bird.draw();
  } else if (gameState === 'VICTORY') {
      drawVictoryScreen();
      drawAndProcessConfetti(); // Draw confetti over the victory screen
  }

  requestAnimationFrame(loop);
}

loop();
