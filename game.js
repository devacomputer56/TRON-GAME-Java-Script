// game.js

// --- Game Constants ---
const GRID_SIZE = 40; // Number of cells in the grid (e.g., 40x40)
const CELL_SIZE = 15; // Size of each cell in pixels
const CANVAS_WIDTH = GRID_SIZE * CELL_SIZE;
const CANVAS_HEIGHT = GRID_SIZE * CELL_SIZE;

// Player colors
const PLAYER_1_COLOR = '#00FFFF'; // Cyan
const PLAYER_2_COLOR = '#FFFF00'; // Yellow
const TRAIL_COLOR_P1 = '#00AAAA'; // Darker Cyan
const TRAIL_COLOR_P2 = '#AAAA00'; // Darker Yellow

// Game states
const GAME_STATE_RUNNING = 'running';
const GAME_STATE_GAME_OVER = 'game_over';
const GAME_STATE_WAITING = 'waiting'; // Before game starts or after game over, waiting for restart

// --- DOM Elements ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameStatusElement = document.getElementById('gameStatus');

// --- LightCycle Class ---
class LightCycle {
    constructor(x, y, dx, dy, color, trailColor) {
        this.x = x; // Current head x position (grid coordinates)
        this.y = y; // Current head y position (grid coordinates)
        this.dx = dx; // Direction x (-1, 0, 1)
        this.dy = dy; // Direction y (-1, 0, 1)
        this.color = color; // Color of the cycle's head
        this.trailColor = trailColor; // Color of the cycle's trail
        this.trail = [{ x: this.x, y: this.y }]; // Array of {x, y} objects representing the trail
        this.active = true; // Whether the cycle is still in play
    }

    move() {
        if (!this.active) return;

        // Update head position based on direction
        this.x += this.dx;
        this.y += this.dy;

        // Add new head position to the front of the trail
        // The trail grows from the head
        this.trail.push({ x: this.x, y: this.y });
    }

    turn(newDx, newDy) {
        if (!this.active) return;

        // Prevent 180-degree turns
        // If currently moving horizontally, can only turn vertically, and vice-versa
        if ((newDx !== 0 && this.dx !== 0) || (newDy !== 0 && this.dy !== 0)) {
            // console.log("Invalid turn: cannot reverse or turn into same axis directly");
            return;
        }

        // Prevent turning if not moving (should not happen with dx/dy but good check)
        if (this.dx === 0 && this.dy === 0) return;


        this.dx = newDx;
        this.dy = newDy;
    }

    draw(ctx) {
        if (!this.active) return;

        // Draw the trail
        ctx.fillStyle = this.trailColor;
        for (let i = 0; i < this.trail.length - 1; i++) {
            const segment = this.trail[i];
            ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        }

        // Draw the head (current position) - could be slightly different
        // For now, same as trail, but last segment is the head
        if (this.trail.length > 0) {
            const head = this.trail[this.trail.length - 1];
            ctx.fillStyle = this.color;
            ctx.fillRect(head.x * CELL_SIZE, head.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);

            // Add a small "glow" or highlight to the head
            ctx.strokeStyle = '#FFFFFF'; // White border for head
            ctx.lineWidth = 1;
            ctx.strokeRect(head.x * CELL_SIZE +1, head.y * CELL_SIZE+1, CELL_SIZE-2, CELL_SIZE-2);
        }
    }

    reset(x, y, dx, dy) {
        this.x = x;
        this.y = y;
        this.dx = dx;
        this.dy = dy;
        this.trail = [{ x: this.x, y: this.y }];
        this.active = true;
    }
}

// --- Canvas Setup ---
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// --- Game Variables ---
let player1; // Will be an instance of LightCycle
let player2; // Will be an instance of LightCycle
let gameState = GAME_STATE_WAITING;

// --- Main Game Functions ---

// initGame() remains largely the same, but ensures players are active on init.
function initGame() {
    console.log("Initializing game...");
    player1 = new LightCycle(
        Math.floor(GRID_SIZE / 4),
        Math.floor(GRID_SIZE / 2),
        1, 0,
        PLAYER_1_COLOR,
        TRAIL_COLOR_P1
    );
    player2 = new LightCycle(
        Math.floor(GRID_SIZE * 3 / 4),
        Math.floor(GRID_SIZE / 2),
        -1, 0,
        PLAYER_2_COLOR,
        TRAIL_COLOR_P2
    );

    player1.active = true; // Explicitly set active
    player2.active = true; // Explicitly set active

    gameState = GAME_STATE_WAITING;
    updateGameStatus("Press Enter to Start");
    drawGame(); // Draw initial state
}

// gameLoop() remains the same
function gameLoop() {
    if (gameState === GAME_STATE_RUNNING) {
        updateGame();
    }
    // Drawing should happen regardless of state to show menus, game over, etc.
    // but actual game elements only drawn if they exist.
    drawGame();
    requestAnimationFrame(gameLoop);
}

function updateGame() {
    if (gameState !== GAME_STATE_RUNNING || !player1 || !player2) return;

    // Move players first
    if (player1.active) player1.move();
    if (player2.active) player2.move();

    // Check for collisions
    let p1Collided = false;
    if (player1.active) {
        p1Collided = checkCollision(player1, player2);
        if (p1Collided) {
            player1.active = false;
            console.log("Player 1 DEREZZED!");
        }
    }

    let p2Collided = false;
    if (player2.active) {
        // Pass player1 for collision check against its trail
        p2Collided = checkCollision(player2, player1);
        if (p2Collided) {
            player2.active = false;
            console.log("Player 2 DEREZZED!");
        }
    }

    // Determine game outcome
    if (p1Collided && p2Collided) {
        // Both collided in the same frame (e.g., head-on, or both hit walls)
        gameState = GAME_STATE_GAME_OVER;
        updateGameStatus("Both Players Derezzed! It's a Draw! Press R to Restart.");
    } else if (p1Collided) {
        gameState = GAME_STATE_GAME_OVER;
        updateGameStatus("Player 1 Derezzed! Player 2 Wins! Press R to Restart.");
    } else if (p2Collided) {
        gameState = GAME_STATE_GAME_OVER;
        updateGameStatus("Player 2 Derezzed! Player 1 Wins! Press R to Restart.");
    }
}

/**
 * Checks for collisions for a given cycle.
 * @param {LightCycle} cycle The cycle to check.
 * @param {LightCycle} otherCycle The other player's cycle.
 * @returns {boolean} True if a collision occurred, false otherwise.
 */
function checkCollision(cycle, otherCycle) {
    const head = cycle.trail[cycle.trail.length - 1];

    // 1. Arena Wall Collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        console.log(`${cycle.color} hit a wall.`);
        return true;
    }

    // 2. Self Collision
    // Check against all segments of its own trail, except the very last one (the head itself)
    // and the one before it (as the head just moved from there) if trail is short.
    // A simple check is to see if head coords are in any of the trail segments from index 0 to length-2
    for (let i = 0; i < cycle.trail.length - 1; i++) {
        const segment = cycle.trail[i];
        if (segment.x === head.x && segment.y === head.y) {
            console.log(`${cycle.color} collided with its own trail.`);
            return true;
        }
    }

    // 3. Other Player Collision
    // Check against all segments of the other player's trail (including their head for head-on)
    if (otherCycle && otherCycle.active) { // Check otherCycle exists and is active
        for (let i = 0; i < otherCycle.trail.length; i++) {
            const segment = otherCycle.trail[i];
            if (segment.x === head.x && segment.y === head.y) {
                // Special case: if both heads are at the same spot (head-on collision)
                // This can be tricky. If P1 moves, collides with P2's trail (which includes P2's current head)
                // Then P2 moves, it might also collide with P1's new trail segment (where P1 just died).
                // The current logic in updateGame handles this by checking P1 then P2.
                // If P1 hits P2's current head, P1 is out.
                // If P2 then moves into P1's new trail segment (where P1 just died), P2 is also out (Draw).
                console.log(`${cycle.color} collided with ${otherCycle.color}'s trail.`);
                return true;
            }
        }
    }
    return false;
}

// drawGame() remains the same
function drawGame() {
    // Clear canvas
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid lines
    ctx.strokeStyle = '#333';
    for (let x = 0; x <= GRID_SIZE; x++) {
        ctx.beginPath();
        ctx.moveTo(x * CELL_SIZE, 0);
        ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
        ctx.stroke();
    }
    for (let y = 0; y <= GRID_SIZE; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * CELL_SIZE);
        ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
        ctx.stroke();
    }

    // Draw players if they exist
    if (player1) player1.draw(ctx);
    if (player2) player2.draw(ctx);

    // Game status messages will be handled by updateGameStatus and potentially drawn here too
}

/**
 * Updates the game status message on the screen.
 * @param {string} message The message to display.
 */
function updateGameStatus(message) {
    if (gameStatusElement) {
        gameStatusElement.textContent = message;
    }
}

// --- Event Listeners ---
document.addEventListener('keydown', (event) => {
    if (gameState === GAME_STATE_WAITING && event.key === 'Enter') {
        gameState = GAME_STATE_RUNNING;
        updateGameStatus("Player 1: Arrows | Player 2: WASD");
        // initGame() should have already set up players, now they can move.
        // If players weren't fully set up, call initGame() here.
        // For robustness, let's ensure players are ready:
        if (!player1 || !player2 || !player1.active || !player2.active) {
            // This would happen if 'R' was pressed before 'Enter'
            // or if Enter is the first key after loading.
             initGame(); // Reset positions and active states
             gameState = GAME_STATE_RUNNING; // Set to running after init
        }
        return; // Prevent other key handling if we just started
    }

    if (gameState !== GAME_STATE_RUNNING) return; // Only process game controls if running

    // Player 1 controls (Arrow Keys)
    if (player1 && player1.active) {
        switch (event.key) {
            case 'ArrowUp':
                if (player1.dy === 0) player1.turn(0, -1); // Turn up only if moving horizontally
                break;
            case 'ArrowDown':
                if (player1.dy === 0) player1.turn(0, 1);  // Turn down only if moving horizontally
                break;
            case 'ArrowLeft':
                if (player1.dx === 0) player1.turn(-1, 0); // Turn left only if moving vertically
                break;
            case 'ArrowRight':
                if (player1.dx === 0) player1.turn(1, 0);  // Turn right only if moving vertically
                break;
        }
    }

    // Player 2 controls (WASD Keys)
    if (player2 && player2.active) {
        switch (event.key.toLowerCase()) { // Use toLowerCase for wasd
            case 'w': // Up
                if (player2.dy === 0) player2.turn(0, -1);
                break;
            case 's': // Down
                if (player2.dy === 0) player2.turn(0, 1);
                break;
            case 'a': // Left
                if (player2.dx === 0) player2.turn(-1, 0);
                break;
            case 'd': // Right
                if (player2.dx === 0) player2.turn(1, 0);
                break;
        }
    }

    // Restart Game (R key) - will be fleshed out more in a later step
    if (event.key.toLowerCase() === 'r' && (gameState === GAME_STATE_GAME_OVER || gameState === GAME_STATE_RUNNING)) {
        console.log("R pressed - re-initializing game.");
        initGame(); // This will reset players and set state to WAITING
        // The gameLoop continues, but updateGame won't run until Enter is pressed.
    }
});

// --- Initial Call ---
initGame(); // Initialize players and set game to WAITING state.
requestAnimationFrame(gameLoop); // Start the animation loop.

console.log("game.js player controls setup complete.");
