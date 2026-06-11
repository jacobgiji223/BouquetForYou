const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const container = document.getElementById('game-container');
const scoreDisplay = document.getElementById('score-display');

const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const victoryScreen = document.getElementById('victory-screen');
// ADDED: Link to the confetti container
const confettiContainer = document.getElementById('confetti-container');

// 1. Load the custom player image (The Bird)
const playerImage = new Image();
playerImage.src = 'friend.png'; 

// 2. Load the victory image (Eminem with the red rose)
const victoryImage = new Image();
victoryImage.src = 'end_reward.png'; 

// Adjust canvas size to match its CSS container
function resizeCanvas() {
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Game Variables
let frames = 0;
let score = 0;
let gameState = 'START'; // Can be: START, PLAYING, GAMEOVER, VICTORY
const targetScore = 10;

// Flashy Effect State
let flashIntensity = 0;

// The Player (Bird) Object
const bird = {
  x: 60,
  y: canvas.height / 2,
  radius: 30, // Slightly bigger so your friend's face is easier to see!
  velocity: 0,
  gravity: 0.3, // Give the bird some weight
  jump: -6,    // Snappy jump
  
  draw() {
    // Check if the friend.png image successfully loaded
    if (playerImage.complete && playerImage.naturalWidth > 0) {
      let size = this.radius * 2; 
      ctx.drawImage(playerImage, this.x - this.radius, this.y - this.radius, size, size);
    } else {
      // Fallback: If image is missing, draw the yellow circle so the game doesn't crash
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700'; // Yellow
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

    // Hit the floor
    if (this.y + this.radius >= canvas.height) {
      this.y = canvas.height - this.radius;
      triggerGameOver();
    }
    // Hit the ceiling
    if (this.y - this.radius <= 0) {
      this.y = this.radius;
      this.velocity = 0;
    }
  },
  
  flap() {
    this.velocity = this.jump;
  }
};

// Pipes Setup (Balanced easy settings)
let pipes = [];
const pipeWidth = 60;
const pipeGap = 320; // Wide and forgiving
const pipeSpeed = 2.5; // Balanced pace

function drawPipes() {
  ctx.fillStyle = '#2ecc71'; // Green pipes
  ctx.strokeStyle = '#27ae60';
  ctx.lineWidth = 4;
  
  pipes.forEach(pipe => {
    // Top pipe
    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
    ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.topHeight);
    // Bottom pipe
    ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY);
    ctx.strokeRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY);
  });
}

function updatePipes() {
  // Spawn a new pipe every 150 frames
  if (frames % 150 === 0) {
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

    // Collision Detection
    if (
      bird.x + bird.radius > p.x && 
      bird.x - bird.radius < p.x + pipeWidth && 
      (bird.y - bird.radius < p.topHeight || bird.y + bird.radius > p.bottomY)
    ) {
      triggerGameOver();
    }

    // Add to score if we successfully pass the pipe
    if (p.x + pipeWidth < bird.x && !p.passed) {
      score++;
      p.passed = true;
      scoreDisplay.innerText = score;

      // Check for victory condition!
      if (score === targetScore) {
        triggerVictory();
      }
    }

    // Remove pipes that go off-screen
    if (p.x + pipeWidth < 0) {
      pipes.shift();
      i--;
    }
  }
}

// Draw the custom victory screen (Eminem, Rose, Flashy Effect, Text)
function drawVictoryScreen() {
  // 1. Flash effect background 
  if (flashIntensity > 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, ' + flashIntensity + ')';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      flashIntensity -= 0.05; // Fade out the flash
  } else {
      // Transition to a darker birthday vibe after the flash
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; 
      ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Define some measurements for scaling the image
  let targetWidth = canvas.width * 0.9; 
  let targetHeight = 0;
  let offsetY = 0;

  // 2. Safely display the end_reward image centered
  if (victoryImage.complete && victoryImage.naturalWidth > 0) {
      let imgAspectRatio = victoryImage.width / victoryImage.height;
      targetHeight = targetWidth / imgAspectRatio;
      let offsetX = (canvas.width - targetWidth) / 2;
      
      // Push the image up a bit so there is room for the text at the bottom
      offsetY = (canvas.height - targetHeight) / 2 - 50; 
      
      ctx.drawImage(victoryImage, offsetX, offsetY, targetWidth, targetHeight);
      
      // 3. Display the custom text below the image (MODIFIED: Made smaller)
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      
      // Changed font size from bold 22px to bold 16px sans-serif
      ctx.font = 'bold 16px sans-serif'; 
      ctx.fillText("Well done noob, btw this is for you homegirl", canvas.width / 2, offsetY + targetHeight + 60);
      
  } else {
      // Fallback if end_reward.png is missing
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.font = '24px sans-serif'; 
      ctx.fillText("Well done noob, btw this is for you homegirl", canvas.width / 2, canvas.height / 2);
  }
}

// =======================================================
// ADDED: Celebratory Confetti Logic
// =======================================================
function createConfetti() {
  const confettiCount = 50; // How many particles to create
  const colors = ['#f1c40f', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6']; // Rainbow colors

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div');
    confetti.classList.add('confetti');
    
    // Set random color, starting position (X), animation duration, and delay
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = Math.random() * 100 + '%'; // Random horizontal position
    confetti.style.animationDuration = (Math.random() * 2 + 3) + 's'; // Random duration (3-5 seconds)
    confetti.style.animationDelay = (Math.random() * 2) + 's'; // Random start delay (0-2 seconds)
    
    // Add to HTML container
    confettiContainer.appendChild(confetti);
  }
}

// State Management Functions
function triggerGameOver() {
  if (gameState !== 'VICTORY') {
    gameState = 'GAMEOVER';
    gameOverScreen.classList.add('active');
  }
}

function triggerVictory() {
  if (gameState !== 'VICTORY') {
      gameState = 'VICTORY';
      flashIntensity = 1; // Trigger the flash bang effect
      victoryScreen.classList.add('active');
      // ADDED: Trigger the confetti explosion
      createConfetti();
  }
}

// Globally accessible so the HTML buttons can call it
window.resetGame = function() {
  bird.y = canvas.height / 2;
  bird.velocity = 0;
  pipes = [];
  score = 0;
  frames = 0;
  flashIntensity = 0;
  scoreDisplay.innerText = score;
  gameState = 'PLAYING';
  
  startScreen.classList.remove('active');
  gameOverScreen.classList.remove('active');
  victoryScreen.classList.remove('active');
  
  // ADDED: Remove confetti divs when restarting
  confettiContainer.innerHTML = '';
  
  bird.flap();
}

// Input Handling (Mouse, Touch, Spacebar)
function handleInput() {
  if (gameState === 'START') {
    resetGame();
  } else if (gameState === 'PLAYING') {
    bird.flap();
  } else if (gameState === 'VICTORY' && flashIntensity <= 0) {
    // Let them click anywhere to restart after seeing the celebration
    resetGame();
  }
}

container.addEventListener('mousedown', handleInput);
container.addEventListener('touchstart', (e) => {
  e.preventDefault(); // Prevents mobile browsers from zooming in
  handleInput();
}, { passive: false });

document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    handleInput();
  }
});

// The Main Game Loop
function loop() {
  // Clear screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gameState === 'PLAYING') {
    updatePipes();
    drawPipes();
    bird.update();
    bird.draw();
    frames++;
  } else if (gameState === 'GAMEOVER' || gameState === 'START') {
    // Just draw the static state behind the menus
    drawPipes();
    bird.draw();
  } else if (gameState === 'VICTORY') {
      // Display the custom victory screen (Eminem, flash, confetti)
      drawVictoryScreen();
  }

  requestAnimationFrame(loop);
}

// Start the animation loop
loop();