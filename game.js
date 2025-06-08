// game.js

// --- Game Constants ---
const FIXED_GRID_SIZE = 40;
let CELL_SIZE;
let CANVAS_WIDTH;
let CANVAS_HEIGHT;
let GRID_SIZE_X = FIXED_GRID_SIZE;
let GRID_SIZE_Y = FIXED_GRID_SIZE;

const PLAYER_1_COLOR = '#00FFFF';
const PLAYER_2_COLOR = '#FFFF00';
const TRAIL_COLOR_P1 = '#00AAAA';
const TRAIL_COLOR_P2 = '#AAAA00';

const GAME_STATE_RUNNING = 'running';
const GAME_STATE_GAME_OVER = 'game_over';
const GAME_STATE_WAITING = 'waiting';

// --- DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameStatusElement = document.getElementById('gameStatus');
const gameContainer = document.getElementById('gameContainer');
const keyboardControlsInfoElement = document.getElementById('keyboardControlsInfo');
const touchControlsContainerElement = document.getElementById('touchControlsContainer');
const touchStartButton = document.getElementById('touchStartButton');
const touchRestartButton = document.getElementById('touchRestartButton');


// --- Game Variables ---
let player1;
let player2;
let gameState = GAME_STATE_WAITING;

// --- Touch Device Detection ---
let isTouchDevice = false;
function detectTouchDevice() {
    isTouchDevice = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
    if (isTouchDevice) {
        console.log("Touch device detected.");
        if (touchControlsContainerElement) touchControlsContainerElement.style.display = 'block';
        if (keyboardControlsInfoElement) keyboardControlsInfoElement.style.display = 'none';
    } else {
        console.log("Non-touch device detected.");
        if (keyboardControlsInfoElement) keyboardControlsInfoElement.style.display = 'block';
        if (touchControlsContainerElement) touchControlsContainerElement.style.display = 'none';
    }
}

// --- Canvas Setup Function ---
function setupCanvas() {
    const containerWidth = gameContainer.offsetWidth;
    const containerHeight = gameContainer.offsetHeight;

    CELL_SIZE = Math.max(5, Math.floor(Math.min(containerWidth / FIXED_GRID_SIZE, containerHeight / FIXED_GRID_SIZE)));
    if (CELL_SIZE === 0) CELL_SIZE = 5; // Prevent CELL_SIZE becoming 0 if container is too small initially

    GRID_SIZE_X = Math.floor(containerWidth / CELL_SIZE);
    GRID_SIZE_Y = Math.floor(containerHeight / CELL_SIZE);

    // Ensure grid is not impossibly small
    if (GRID_SIZE_X < 10) GRID_SIZE_X = 10;
    if (GRID_SIZE_Y < 10) GRID_SIZE_Y = 10;


    CANVAS_WIDTH = GRID_SIZE_X * CELL_SIZE;
    CANVAS_HEIGHT = GRID_SIZE_Y * CELL_SIZE;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    console.log(`Canvas Setup: Container ${containerWidth}x${containerHeight}, Cell: ${CELL_SIZE}px, Grid: ${GRID_SIZE_X}x${GRID_SIZE_Y}`);

    if (gameState !== GAME_STATE_WAITING || player1) {
        if(player1) player1.active = false;
        if(player2) player2.active = false;

        const restartMessage = isTouchDevice ? "Tap Restart" : "Press R";
        updateGameStatus(`Screen resized. ${restartMessage} to apply.`);
        if (gameState === GAME_STATE_RUNNING) {
            gameState = GAME_STATE_WAITING;
        }
        drawGame();
    }
}

// LightCycle class
class LightCycle {
    constructor(x, y, dx, dy, color, trailColor) {
        this.x = x; this.y = y; this.dx = dx; this.dy = dy;
        this.color = color; this.trailColor = trailColor;
        this.trail = [{ x: this.x, y: this.y }];
        this.active = true;
    }
    move() {
        if (!this.active) return;
        this.x += this.dx; this.y += this.dy;
        this.trail.push({ x: this.x, y: this.y });
    }
    turn(newDx, newDy) {
        if (!this.active) return;
        // Prevent turning into the direction currently moving or directly opposite (180 degree turn)
        if ((newDx !== 0 && this.dx !== 0 && newDx !== this.dx ) || (newDy !== 0 && this.dy !== 0 && newDy !== this.dy)) {
            //This condition means trying to turn left/right when moving vertically, or up/down when moving horizontally. This is allowed.
        } else if ((newDx === this.dx && newDx !== 0) || (newDy === this.dy && newDy !== 0)){
            return; // Trying to "turn" into the same direction, ignore
        } else if ((newDx === -this.dx && this.dx !== 0) || (newDy === -this.dy && this.dy !==0)) {
            return; // Prevent 180 degree turns if already moving
        }


        // If currently stationary, any turn is fine (though game starts players moving)
        if (this.dx === 0 && this.dy === 0 && (newDx === 0 && newDy === 0)) {
            return; // Trying to turn to stationary from stationary
        }

        this.dx = newDx; this.dy = newDy;
    }
    draw(ctx) {
        if (!this.active && this.trail.length <= 1 && !(this.x === this.trail[0].x && this.y === this.trail[0].y) ) {
             // Don't draw if inactive and trail is just the initial spawn point, unless it's the very first frame
             if (this.trail.length === 1 && (this.x !== this.trail[0].x || this.y !== this.trail[0].y)) {
                 // This case might be an inactive player that never moved from spawn.
             } else if (this.trail.length > 1) {
                 // Has a trail, so should be drawn up to point of crash
             }
             else {return;}
        }

        ctx.fillStyle = this.trailColor;
        const trailCellSize = CELL_SIZE < 7 && CELL_SIZE > 2 ? CELL_SIZE +1 : CELL_SIZE;

        for (let i = 0; i < this.trail.length -1; i++) {
            const segment = this.trail[i];
            ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, trailCellSize, trailCellSize);
        }
        if (this.trail.length > 0) {
            const head = this.trail[this.trail.length - 1];
            ctx.fillStyle = this.color;
            ctx.fillRect(head.x * CELL_SIZE, head.y * CELL_SIZE, trailCellSize, trailCellSize);
            if (this.active && CELL_SIZE > 5) {
                ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 1;
                ctx.strokeRect(head.x * CELL_SIZE +1, head.y * CELL_SIZE+1, Math.max(1,CELL_SIZE-2), Math.max(1,CELL_SIZE-2));
            }
        }
    }
    reset(x, y, dx, dy) {
        this.x = x; this.y = y; this.dx = dx; this.dy = dy;
        this.trail = [{ x: this.x, y: this.y }]; this.active = true;
    }
}

// --- Main Game Functions ---
function initGame() {
    console.log(`Initializing game. Grid: ${GRID_SIZE_X}x${GRID_SIZE_Y}, Cell: ${CELL_SIZE}`);
    let p1StartX = Math.floor(GRID_SIZE_X / 4);
    let p1StartY = Math.floor(GRID_SIZE_Y / 2);
    let p2StartX = Math.floor(GRID_SIZE_X * 3 / 4);
    let p2StartY = Math.floor(GRID_SIZE_Y / 2);

    if (GRID_SIZE_X < 4) { // very narrow grid
        p1StartX = 0;
        p2StartX = Math.max(1, GRID_SIZE_X -1);
    }
    if (GRID_SIZE_Y < 2 && p1StartY === p2StartY) { // very flat grid
        p1StartY = 0;
        p2StartY = Math.max(1, GRID_SIZE_Y-1);
        if (p2StartY === p1StartY && GRID_SIZE_Y > 0) p2StartY = (p1StartY + 1) % GRID_SIZE_Y;

    }

    if (p1StartX === p2StartX && p1StartY === p2StartY) { // Avoid spawn collision
        p2StartX = (p2StartX + 1) % GRID_SIZE_X;
        if (p1StartX === p2StartX && p1StartY === p2StartY && GRID_SIZE_X >1) {
             p1StartX = (p1StartX - 1 + GRID_SIZE_X) % GRID_SIZE_X;
        } else if (p1StartX === p2StartX && p1StartY === p2StartY && GRID_SIZE_Y > 1) {
            p2StartY = (p2StartY + 1) % GRID_SIZE_Y;
        }
    }

    player1 = new LightCycle( p1StartX, p1StartY, 1, 0, PLAYER_1_COLOR, TRAIL_COLOR_P1);
    player2 = new LightCycle( p2StartX, p2StartY, -1, 0, PLAYER_2_COLOR, TRAIL_COLOR_P2);

    player1.active = true;
    player2.active = true;
    gameState = GAME_STATE_WAITING;
    const startMessage = isTouchDevice ? "Tap Start" : "Press Enter to Start";
    updateGameStatus(startMessage);
    drawGame();
}

function gameLoop() {
    if (gameState === GAME_STATE_RUNNING) {
        updateGame();
    }
    drawGame();
    requestAnimationFrame(gameLoop);
}

function updateGame() {
    if (gameState !== GAME_STATE_RUNNING || !player1 || !player2) return;

    if (player1.active) player1.move();
    if (player2.active) player2.move();

    let p1Collided = false;
    if (player1.active) {
        p1Collided = checkCollision(player1, player2);
        if (p1Collided) player1.active = false;
    }

    let p2Collided = false;
    if (player2.active) {
        p2Collided = checkCollision(player2, player1);
        if (p2Collided) player2.active = false;
    }

    const restartMsg = isTouchDevice ? "Tap Restart" : "Press R";
    if (!player1.active && !player2.active) {
        gameState = GAME_STATE_GAME_OVER;
        updateGameStatus(`Draw! ${restartMsg}`);
    } else if (!player1.active) {
        gameState = GAME_STATE_GAME_OVER;
        updateGameStatus(`Player 2 Wins! ${restartMsg}`);
    } else if (!player2.active) {
        gameState = GAME_STATE_GAME_OVER;
        updateGameStatus(`Player 1 Wins! ${restartMsg}`);
    }
}

function checkCollision(cycle, otherCycle) {
    if (!cycle.trail || cycle.trail.length === 0) return false;
    const head = cycle.trail[cycle.trail.length - 1];

    if (head.x < 0 || head.x >= GRID_SIZE_X || head.y < 0 || head.y >= GRID_SIZE_Y) {
        return true; // Wall collision
    }
    // Self collision: check all segments *except the head itself*
    for (let i = 0; i < cycle.trail.length - 1; i++) {
        if (cycle.trail[i].x === head.x && cycle.trail[i].y === head.y) {
            return true; // Self collision
        }
    }
    // Other player collision
    if (otherCycle && otherCycle.active && otherCycle.trail.length > 0) {
        for (let i = 0; i < otherCycle.trail.length; i++) {
            if (otherCycle.trail[i].x === head.x && otherCycle.trail[i].y === head.y) {
                return true; // Collision with other player's trail (including their head)
            }
        }
    }
    return false;
}

function drawGame() {
    if (!ctx) return;
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.strokeStyle = '#333';
    if (CELL_SIZE > 2) { // Only draw grid if cells are somewhat visible
        for (let x = 0; x <= GRID_SIZE_X; x++) { ctx.beginPath(); ctx.moveTo(x * CELL_SIZE, 0); ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT); ctx.stroke(); }
        for (let y = 0; y <= GRID_SIZE_Y; y++) { ctx.beginPath(); ctx.moveTo(0, y * CELL_SIZE); ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE); ctx.stroke(); }
    }
    if (player1) player1.draw(ctx);
    if (player2) player2.draw(ctx);
}

function updateGameStatus(message) { if (gameStatusElement) gameStatusElement.textContent = message; }

// --- Event Listeners ---
document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && gameState === GAME_STATE_WAITING && !isTouchDevice) {
        if (canvas.width !== GRID_SIZE_X * CELL_SIZE || canvas.height !== GRID_SIZE_Y * CELL_SIZE || !player1) {
            initGame();
        }
        gameState = GAME_STATE_RUNNING;
        updateGameStatus("Game Running!");
        return;
    }

    if (event.key.toLowerCase() === 'r') {
        console.log("R pressed - re-initializing game.");
        initGame();
        return;
    }

    if (gameState !== GAME_STATE_RUNNING) return;

    if (player1 && player1.active) {
        switch (event.key) {
            case 'ArrowUp': if (player1.dy === 0) player1.turn(0, -1); break;
            case 'ArrowDown': if (player1.dy === 0) player1.turn(0, 1); break;
            case 'ArrowLeft': if (player1.dx === 0) player1.turn(-1, 0); break;
            case 'ArrowRight': if (player1.dx === 0) player1.turn(1, 0); break;
        }
    }
    if (player2 && player2.active) {
        switch (event.key.toLowerCase()) {
            case 'w': if (player2.dy === 0) player2.turn(0, -1); break;
            case 's': if (player2.dy === 0) player2.turn(0, 1); break;
            case 'a': if (player2.dx === 0) player2.turn(-1, 0); break;
            case 'd': if (player2.dx === 0) player2.turn(1, 0); break;
        }
    }
});

function handleTouchTurn(playerNumber, action) {
    const player = (playerNumber === 1) ? player1 : player2;
    if (gameState !== GAME_STATE_RUNNING || !player || !player.active) return;
    switch (action) {
        case 'up': if (player.dy === 0) player.turn(0, -1); break;
        case 'down': if (player.dy === 0) player.turn(0, 1); break;
        case 'left': if (player.dx === 0) player.turn(-1, 0); break;
        case 'right': if (player.dx === 0) player.turn(1, 0); break;
    }
}

if (touchControlsContainerElement) {
    document.querySelectorAll('.player-controls button').forEach(button => {
        button.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const player = parseInt(e.currentTarget.dataset.player);
            const action = e.currentTarget.dataset.action;
            handleTouchTurn(player, action);
        }, { passive: false });
    });

    if (touchStartButton) {
        touchStartButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (gameState === GAME_STATE_WAITING) {
                if (canvas.width !== GRID_SIZE_X * CELL_SIZE || canvas.height !== GRID_SIZE_Y * CELL_SIZE || !player1) {
                    initGame();
                }
                gameState = GAME_STATE_RUNNING;
                updateGameStatus("Game Running!");
            }
        }, { passive: false });
    }

    if (touchRestartButton) {
        touchRestartButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            console.log("Touch Restart pressed - re-initializing game.");
            initGame();
        }, { passive: false });
    }
}

// --- Resize Listener ---
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        console.log("Window resized.");
        setupCanvas();
    }, 250);
});

// --- Initial Call ---
detectTouchDevice();
setupCanvas();
initGame();
requestAnimationFrame(gameLoop);

console.log("game.js touch controls setup complete.");
