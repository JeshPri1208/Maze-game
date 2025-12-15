// ...existing code...
let ctx;
let canvas;
let maze;
let mazeHeight;
let mazeWidth;
let player;
let startTime;
let showSolution = false;
let timerInterval;
let timerStarted = false;
let listenersAdded = false;
let score = 0;
let currentLevel = 1;
let moveCount = 0;
let moveInterval;
let heldKeys = {};
let playerImage = new Image();

class Player {
  constructor() {
    this.col = 0;
    this.row = 0;
  }
}

class MazeCell {
  constructor(col, row) {
    this.col = col;
    this.row = row;
    this.eastWall = true;
    this.northWall = true;
    this.southWall = true;
    this.westWall = true;
    this.visited = false;
  }
}

class Maze {
  constructor(cols, rows, cellSize) {
    this.backgroundColor = "#ffffff";
    this.cols = cols;
    this.endColor = "#88FF88";
    this.mazeColor = "#ffffff";
    this.playerColor = "#ff6b6b";
    this.rows = rows;
    this.cellSize = cellSize;
    this.cells = [];
    this.solutionPath = [];
    this.generate();
  }

  generate() {
    mazeHeight = this.rows * this.cellSize;
    mazeWidth = this.cols * this.cellSize;

    canvas.height = mazeHeight;
    canvas.width = mazeWidth;
    canvas.style.height = `${mazeHeight}px`;
    canvas.style.width = `${mazeWidth}px`;

    for (let col = 0; col < this.cols; col++) {
      this.cells[col] = [];
      for (let row = 0; row < this.rows; row++) {
        this.cells[col][row] = new MazeCell(col, row);
      }
    }

    let rndCol = Math.floor(Math.random() * this.cols);
    let rndRow = Math.floor(Math.random() * this.rows);

    let stack = [];
    stack.push(this.cells[rndCol][rndRow]);

    let currCell;
    let dir;
    let foundNeighbor;
    let nextCell;

    while (this.hasUnvisited()) {
      currCell = stack[stack.length - 1];
      currCell.visited = true;
      if (this.hasUnvisitedNeighbor(currCell)) {
        nextCell = null;
        foundNeighbor = false;
        do {
          dir = Math.floor(Math.random() * 4);
          switch (dir) {
            case 0:
              if (currCell.col !== (this.cols - 1) && !this.cells[currCell.col + 1][currCell.row].visited) {
                currCell.eastWall = false;
                nextCell = this.cells[currCell.col + 1][currCell.row];
                nextCell.westWall = false;
                foundNeighbor = true;
              }
              break;
            case 1:
              if (currCell.row !== 0 && !this.cells[currCell.col][currCell.row - 1].visited) {
                currCell.northWall = false;
                nextCell = this.cells[currCell.col][currCell.row - 1];
                nextCell.southWall = false;
                foundNeighbor = true;
              }
              break;
            case 2:
              if (currCell.row !== (this.rows - 1) && !this.cells[currCell.col][currCell.row + 1].visited) {
                currCell.southWall = false;
                nextCell = this.cells[currCell.col][currCell.row + 1];
                nextCell.northWall = false;
                foundNeighbor = true;
              }
              break;
            case 3:
              if (currCell.col !== 0 && !this.cells[currCell.col - 1][currCell.row].visited) {
                currCell.westWall = false;
                nextCell = this.cells[currCell.col - 1][currCell.row];
                nextCell.eastWall = false;
                foundNeighbor = true;
              }
              break;
          }
          if (foundNeighbor) {
            stack.push(nextCell);
          }
        } while (!foundNeighbor)
      } else {
        currCell = stack.pop();
      }
    }

    this.computeSolution();
    this.redraw();
  }

  hasUnvisited() {
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        if (!this.cells[col][row].visited) {
          return true;
        }
      }
    }
    return false;
  }

  hasUnvisitedNeighbor(mazeCell) {
    return ((mazeCell.col !== 0               && !this.cells[mazeCell.col - 1][mazeCell.row].visited) ||
            (mazeCell.col !== (this.cols - 1) && !this.cells[mazeCell.col + 1][mazeCell.row].visited) ||
            (mazeCell.row !== 0               && !this.cells[mazeCell.col][mazeCell.row - 1].visited) ||
            (mazeCell.row !== (this.rows - 1) && !this.cells[mazeCell.col][mazeCell.row + 1].visited));
  }

  // BFS shortest path from start to goal
  computeSolution() {
    const startKey = (c, r) => `${c},${r}`;
    const start = { col: 0, row: 0 };
    const goal = { col: this.cols - 1, row: this.rows - 1 };
    const queue = [start];
    const cameFrom = {};
    cameFrom[startKey(start.col, start.row)] = null;

    while (queue.length) {
      const cur = queue.shift();
      if (cur.col === goal.col && cur.row === goal.row) break;
      const cell = this.cells[cur.col][cur.row];
      const neighbors = [];
      if (!cell.eastWall) neighbors.push({ col: cur.col + 1, row: cur.row });
      if (!cell.westWall) neighbors.push({ col: cur.col - 1, row: cur.row });
      if (!cell.northWall) neighbors.push({ col: cur.col, row: cur.row - 1 });
      if (!cell.southWall) neighbors.push({ col: cur.col, row: cur.row + 1 });

      for (const n of neighbors) {
        const k = startKey(n.col, n.row);
        if (cameFrom[k] === undefined) {
          cameFrom[k] = cur;
          queue.push(n);
        }
      }
    }

    const path = [];
    let key = startKey(goal.col, goal.row);
    if (cameFrom[key] === undefined) {
      this.solutionPath = [];
      return;
    }
    let node = { col: goal.col, row: goal.row };
    while (node) {
      path.push({ col: node.col, row: node.row });
      node = cameFrom[startKey(node.col, node.row)];
    }
    path.reverse();
    this.solutionPath = path;
  }

  redraw() {
    // level-based gradient background with transparency
    const gradient = ctx.createLinearGradient(0, 0, 0, mazeHeight);
    let topColor, bottomColor;
    
    if (currentLevel <= 3) {
      // Easy levels: cool blues
      topColor = "rgba(15, 15, 35, 0.7)";
      bottomColor = "rgba(26, 26, 46, 0.7)";
    } else if (currentLevel <= 6) {
      // Medium levels: purples
      topColor = "rgba(35, 15, 45, 0.7)";
      bottomColor = "rgba(46, 26, 56, 0.7)";
    } else {
      // Hard levels: dark reds
      topColor = "rgba(45, 15, 25, 0.7)";
      bottomColor = "rgba(56, 26, 36, 0.7)";
    }
    
    gradient.addColorStop(0, topColor);
    gradient.addColorStop(1, bottomColor);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, mazeWidth, mazeHeight);

    // end cell highlight - trophy goal
    ctx.font = `${this.cellSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = "#FFD700"; // Gold color
    ctx.fillText('🍆', (this.cols - 1) * this.cellSize + this.cellSize/2, (this.rows - 1) * this.cellSize + this.cellSize/2);

    // solution path (behind walls)
    if (showSolution && Array.isArray(this.solutionPath)) {
      ctx.fillStyle = "rgba(255,200,0,0.35)";
      for (const p of this.solutionPath) {
        ctx.fillRect(p.col * this.cellSize + 1, p.row * this.cellSize + 1, this.cellSize - 2, this.cellSize - 2);
      }
    }

    // border
    ctx.strokeStyle = this.mazeColor;
    ctx.strokeRect(0, 0, mazeWidth, mazeHeight);

    // draw walls with 3D shadow effect
    ctx.strokeStyle = this.mazeColor;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.lineWidth = 2; // thicker for 3D look
    for (let col = 0; col < this.cols; col++) {
      for (let row = 0; row < this.rows; row++) {
        if (this.cells[col][row].eastWall) {
          ctx.beginPath();
          ctx.moveTo((col + 1) * this.cellSize, row * this.cellSize);
          ctx.lineTo((col + 1) * this.cellSize, (row + 1) * this.cellSize);
          ctx.stroke();
        }
        if (this.cells[col][row].northWall) {
          ctx.beginPath();
          ctx.moveTo(col * this.cellSize, row * this.cellSize);
          ctx.lineTo((col + 1) * this.cellSize, row * this.cellSize);
          ctx.stroke();
        }
        if (this.cells[col][row].southWall) {
          ctx.beginPath();
          ctx.moveTo(col * this.cellSize, (row + 1) * this.cellSize);
          ctx.lineTo((col + 1) * this.cellSize, (row + 1) * this.cellSize);
          ctx.stroke();
        }
        if (this.cells[col][row].westWall) {
          ctx.beginPath();
          ctx.moveTo(col * this.cellSize, row * this.cellSize);
          ctx.lineTo(col * this.cellSize, (row + 1) * this.cellSize);
          ctx.stroke();
        }
      }
    }

    // player
    if (playerImage.complete && playerImage.naturalHeight !== 0) {
      // Draw spherical (circular) image - bigger for visibility
      ctx.save();
      ctx.beginPath();
      ctx.arc((player.col * this.cellSize) + this.cellSize/2, (player.row * this.cellSize) + this.cellSize/2, (this.cellSize - 2)/2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(playerImage, (player.col * this.cellSize) + 1, (player.row * this.cellSize) + 1, this.cellSize - 2, this.cellSize - 2);
      ctx.restore();
    } else {
      // Fallback to emoji
      ctx.font = `${this.cellSize}px Arial`; // Bigger emoji too
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = this.playerColor;
      ctx.fillText('🏃‍♂️', (player.col * this.cellSize) + this.cellSize/2, (player.row * this.cellSize) + this.cellSize/2);
    }
  }
}

function calculateScore() {
  const baseScore = 1000;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const timePenalty = elapsed * 5; // deduct 5 points per second
  const levelMultiplier = currentLevel;
  score += Math.max(0, (baseScore - timePenalty) * levelMultiplier);
  document.getElementById("scoreDisplay").textContent = `🏆 Score: ${score}`;
  return score;
}

function onClick() {
  currentLevel = parseInt(document.getElementById("level").value, 10) || 1;
  
  // Adjust maze size and cell size based on level - MEDIUM size, balanced difficulty
  let cols = 12 + (currentLevel - 1) * 2; // Level 1: 12x12, Level 10: 30x30 (medium!)
  let rows = cols;
  let cellSize = Math.max(20, Math.floor(40 - (currentLevel - 1) * 1.5)); // Level 1: 40px, Level 10: 25px (comfortable!)
  
  player = new Player();
  maze = new Maze(cols, rows, cellSize);
  showSolution = false;
  moveCount = 0;
  heldKeys = {}; // reset held keys

  // Update difficulty display
  document.getElementById("difficultyDisplay").textContent = `📊 Level: ${currentLevel}`;
  document.getElementById("scoreDisplay").textContent = `🏆 Score: ${score}`;

  // reset timer so it will start on first arrow press
  timerStarted = false;
  startTime = null;
  clearInterval(timerInterval);
  clearInterval(moveInterval);
  moveInterval = null;
  document.getElementById("timerDisplay").textContent = "⏱️ Time: 0:00";
}

function onKeyDown(event) {
  if (!maze) return;

  // start timer when an arrow / movement key is pressed (only once)
  const movementKeys = [37, 38, 39, 40, 65, 68, 83, 87];
  if (!timerStarted && movementKeys.indexOf(event.keyCode) !== -1) {
    startTimer();
  }

  // Set held key
  if (movementKeys.indexOf(event.keyCode) !== -1) {
    heldKeys[event.keyCode] = true;
    if (!moveInterval) {
      moveInterval = setInterval(movePlayer, 50); // move every 50ms for smooth movement
    }
  }
}

function onKeyUp(event) {
  heldKeys[event.keyCode] = false;
}

function movePlayer() {
  if (!maze) return;

  let moved = false;

  if (heldKeys[37] || heldKeys[65]) { // left or A
    if (!maze.cells[player.col][player.row].westWall) {
      player.col -= 1;
      moved = true;
    }
  } else if (heldKeys[39] || heldKeys[68]) { // right or D
    if (!maze.cells[player.col][player.row].eastWall) {
      player.col += 1;
      moved = true;
    }
  } else if (heldKeys[40] || heldKeys[83]) { // down or S
    if (!maze.cells[player.col][player.row].southWall) {
      player.row += 1;
      moved = true;
    }
  } else if (heldKeys[38] || heldKeys[87]) { // up or W
    if (!maze.cells[player.col][player.row].northWall) {
      player.row -= 1;
      moved = true;
    }
  }

  if (moved) {
    moveCount++;
    // clamp player to bounds
    player.col = Math.max(0, Math.min(player.col, maze.cols - 1));
    player.row = Math.max(0, Math.min(player.row, maze.rows - 1));

    // Check if player reached the end
    if (player.col === maze.cols - 1 && player.row === maze.rows - 1) {
      clearInterval(timerInterval);
      clearInterval(moveInterval);
      moveInterval = null;
      updateTimer(); // Update timer display with final time
      timerStarted = false;
      showSolution = true; // reveal path for demo
      maze.redraw();
      
      // Show fireworks for level 10 completion
      if (currentLevel === 10) {
        showFireworks();
      } else {
        showCongratsPopup();
      }
      return;
    }

    maze.redraw();
  } else {
    // If no movement keys held, stop the interval
    clearInterval(moveInterval);
    moveInterval = null;
  }
}

function showFireworks() {
  const overlay = document.getElementById("fireworks");
  const message = document.getElementById("fireworksMessage");
  const container = document.getElementById("fireworksContainer");

  // Set seasonal message
  const now = new Date();
  const month = now.getMonth();
  let seasonMessage = "🎉 Congratulations! 🎉";
  
  if (month >= 11 || month <= 1) { // Winter
    seasonMessage = "❄️ Winter Wonderland Complete! ❄️";
  } else if (month >= 2 && month <= 4) { // Spring
    seasonMessage = "🌸 Spring Victory! 🌸";
  } else if (month >= 5 && month <= 7) { // Summer
    seasonMessage = "☀️ Summer Champion! ☀️";
  } else { // Fall
    seasonMessage = "🍂 Autumn Triumph! 🍂";
  }
  
  message.textContent = seasonMessage;

  // Clear previous fireworks
  container.innerHTML = '';

  // Create fireworks
  for (let i = 0; i < 50; i++) {
    const firework = document.createElement('div');
    firework.className = 'firework';
    firework.style.left = Math.random() * 100 + '%';
    firework.style.top = Math.random() * 100 + '%';
    firework.style.animationDelay = Math.random() * 2 + 's';
    container.appendChild(firework);
  }

  // Show overlay
  overlay.style.display = 'flex';

  // Hide after 5 seconds
  setTimeout(() => {
    overlay.style.display = 'none';
    // After fireworks, show the congrats popup
    showCongratsPopup();
  }, 5000);
}

function showCongratsPopup() {
  const modal = document.getElementById("congratsModal");
  const finalTime = document.getElementById("finalTime");
  const finalScore = document.getElementById("finalScore");
  const playAgainBtn = document.getElementById("playAgainBtn");
  calculateScore();
  finalTime.textContent = document.getElementById("timerDisplay").textContent;
  finalScore.textContent = `🏆 Score: ${score}`;
  if (currentLevel < 10) {
    playAgainBtn.textContent = "Next Level";
  } else {
    playAgainBtn.textContent = "Play Again";
  }
  modal.style.display = "block";
  modal.setAttribute("aria-hidden", "false");
}

function closeCongratsPopup() {
  const modal = document.getElementById("congratsModal");
  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

function updateTimer() {
  if (!startTime) return;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const formattedTime = `${minutes}:${String(seconds).padStart(2, "0")}`;
  document.getElementById("timerDisplay").textContent = `⏱️ Time: ${formattedTime}`;
}

function startTimer() {
  startTime = Date.now();
  clearInterval(timerInterval);
  updateTimer();
  timerInterval = setInterval(updateTimer, 250);
  timerStarted = true;
}

function onLoad() {
  canvas = document.getElementById("mainForm");
  ctx = canvas.getContext("2d");

  if (!listenersAdded) {
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    // document.addEventListener("keydown", function(event){
    //   if (event.keyCode === 80) { // 'P' key
    //     showSolution = !showSolution;
    //     if (maze) maze.redraw();
    //   }
    // });
    document.getElementById("generate").addEventListener("click", onClick);
    document.getElementById("showHint").addEventListener("click", function() {
      showSolution = !showSolution;
      if (maze) maze.redraw();
     });
    document.getElementById("playAgainBtn").addEventListener("click", function() {
      closeCongratsPopup();
      if (currentLevel < 10) {
        currentLevel++;
        document.getElementById("level").value = currentLevel;
      } else {
        currentLevel = 1;
        document.getElementById("level").value = 1;
        score = 0; // reset score on full restart
      }

      showSolution = false;
      onClick();
    });
    listenersAdded = true;
  }

  // Load player image
  playerImage.src = "player.png.jpg"; // Your uploaded image file
  playerImage.onload = function() {
    console.log("Player image loaded successfully!");
    if (maze) maze.redraw(); // Redraw to show the image
  };
  playerImage.onerror = function() {
    console.log("Failed to load player image, using emoji fallback");
  };

  onClick();
}

if (typeof window !== "undefined") {
  window.addEventListener("load", onLoad);
}