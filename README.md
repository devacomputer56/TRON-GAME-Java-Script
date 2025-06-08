# Tron Light Cycles Game

A simple 2-player Tron Light Cycles game implemented in HTML and JavaScript.

## Gameplay

Two players control light cycles on a grid. Each cycle leaves a persistent trail (a light wall). The objective is to be the last rider remaining.

### Rules:
*   **Movement**: Cycles always move forward at a constant speed.
*   **Turns**: Only 90-degree turns (left or right relative to current direction) are allowed.
*   **Light Walls**: Cycles leave a trail behind them.
*   **Collision (Derezzing)**:
    *   Colliding with the arena's outer walls results in derezzing.
    *   Colliding with your own trail results in derezzing.
    *   Colliding with the opponent's trail results in derezzing.
*   **Winner**: The last active player wins the round. If both players collide simultaneously in a way that both are derezzed (e.g., head-on, or both hitting walls/trails in the same game update), the game is a draw.

## How to Play

1.  Open the `index.html` file in a web browser on a desktop or mobile device.
2.  The game will detect your input method:
    *   **Desktop/Keyboard:** You will see instructions for keyboard controls. Press **Enter** to start.
    *   **Mobile/Touch:** On-screen touch controls will be displayed. Tap the **Start** button to begin.

### Controls

#### Mobile / Touch Controls
*   **Player 1 (Blue/Cyan - Left D-Pad):**
    *   Use the directional buttons (Up, Down, Left, Right) on the left side of the screen.
*   **Player 2 (Yellow - Right D-Pad):**
    *   Use the directional buttons (Up, Down, Left, Right) on the right side of the screen.
*   **Game Actions (Center):**
    *   **Start Button:** Begins the match.
    *   **Restart Button:** Resets the game (can be used anytime).

#### Desktop / Keyboard Controls
*   **Player 1 (Blue/Cyan Cycle):**
    *   Turn Up: `ArrowUp`
    *   Turn Down: `ArrowDown`
    *   Turn Left: `ArrowLeft`
    *   Turn Right: `ArrowRight`
*   **Player 2 (Yellow Cycle):**
    *   Turn Up: `W`
    *   Turn Down: `S`
    *   Turn Left: `A`
    *   Turn Right: `D`
*   **Game Actions:**
    *   **Start Game:** `Enter`
    *   **Restart Game:** `R` (can be used anytime)


## Game Features

*   2-Player local gameplay.
*   Responsive design for desktop and mobile.
*   Grid-based movement with 90-degree turns.
*   Persistent light trails.
*   Collision detection (arena walls, self-trail, opponent-trail).
*   Win/Loss/Draw conditions.
*   **Input Methods:**
    *   Keyboard controls for desktop.
    *   On-screen touch controls for mobile devices.
*   Simple restart mechanism accessible via keyboard or touch.
*   Visual display of cycles and trails on an HTML canvas.

## Files

*   `index.html`: The main HTML file that structures the game page and includes the canvas.
*   `game.js`: Contains all the JavaScript code for game logic, including:
    *   Game constants (grid size, colors, etc.)
    *   The `LightCycle` class (handles player state, movement, drawing).
    *   Game state management (`GAME_STATE_WAITING`, `GAME_STATE_RUNNING`, `GAME_STATE_GAME_OVER`).
    *   Initialization (`initGame`).
    *   Game loop (`gameLoop`, `updateGame`, `drawGame`).
    *   Collision detection (`checkCollision`).
    *   Keyboard event handling for player controls and game start/restart.

## Future Enhancements (Potential)

*   Single-player mode with AI opponent(s).
*   Scoring system for multiple rounds.
*   Enhanced graphics and sound effects.
*   Selectable cycle colors or player names.
*   Power-ups or different game modes.