
const readline = require('readline');
const { stdin, stdout } = process;

// Configuration
const SCREEN_WIDTH = 80;
const SCREEN_HEIGHT = 24;
const MAP_SIZE = 16;
const FOV = Math.PI / 3.0;
const MAX_DEPTH = 16.0;

// Game State
let playerX = 8.0;
let playerY = 8.0;
let playerA = 0.0; // Player Angle

// Map (1 = Wall, 0 = Empty)
const map = [
    '################',
    '#..............#',
    '#..............#',
    '#..............#',
    '#....#....#....#',
    '#....#....#....#',
    '#..............#',
    '#...########...#',
    '#..............#',
    '#..............#',
    '#.......#......#',
    '#.......#......#',
    '#..............#',
    '#..............#',
    '#..............#',
    '################',
];

// Input handling
readline.emitKeypressEvents(stdin);
if (stdin.isTTY) stdin.setRawMode(true);

let keys = {
    w: false,
    s: false,
    a: false,
    d: false,
    q: false
};

stdin.on('keypress', (str, key) => {
    if (key.name === 'q' || (key.ctrl && key.name === 'c')) {
        process.exit();
    }
    // Simple state toggle for demo (in real term game, need better input loop)
    // For this simple loop, we update state immediately on keypress
    if (key.name === 'w' || key.name === 'y') { // 'y' for some keyboard layouts
        playerX += Math.sin(playerA) * 0.5;
        playerY += Math.cos(playerA) * 0.5;
        if (map[Math.floor(playerX)][Math.floor(playerY)] === '#') {
            playerX -= Math.sin(playerA) * 0.5;
            playerY -= Math.cos(playerA) * 0.5;
        }
    }
    if (key.name === 's') {
        playerX -= Math.sin(playerA) * 0.5;
        playerY -= Math.cos(playerA) * 0.5;
        if (map[Math.floor(playerX)][Math.floor(playerY)] === '#') {
            playerX += Math.sin(playerA) * 0.5;
            playerY += Math.cos(playerA) * 0.5;
        }
    }
    if (key.name === 'a') {
        playerA -= 0.15;
    }
    if (key.name === 'd') {
        playerA += 0.15;
    }
});

function render() {
    let output = ''; // Accumulate frame string specific to terminal handling

    // Clear screen code
    output += '\x1b[H';

    for (let y = 0; y < SCREEN_HEIGHT; y++) {
        for (let x = 0; x < SCREEN_WIDTH; x++) {

            // Ray trace
            let rayAngle = (playerA - FOV / 2.0) + (x / SCREEN_WIDTH) * FOV;
            let distanceToWall = 0;
            let hitWall = false;
            let boundary = false;

            let eyeX = Math.sin(rayAngle);
            let eyeY = Math.cos(rayAngle);

            while (!hitWall && distanceToWall < MAX_DEPTH) {
                distanceToWall += 0.1;

                let testX = Math.floor(playerX + eyeX * distanceToWall);
                let testY = Math.floor(playerY + eyeY * distanceToWall);

                if (testX < 0 || testX >= MAP_SIZE || testY < 0 || testY >= MAP_SIZE) {
                    hitWall = true;
                    distanceToWall = MAX_DEPTH;
                } else {
                    // Cell is wall
                    if (map[testY][testX] === '#') {
                        hitWall = true;

                        // Boundary check for cleaner edges
                        let p = [];
                        for (let tx = 0; tx < 2; tx++) {
                            for (let ty = 0; ty < 2; ty++) {
                                let vy = testY + ty - playerY;
                                let vx = testX + tx - playerX;
                                let d = Math.sqrt(vx * vx + vy * vy);
                                let dot = (eyeX * vx / d) + (eyeY * vy / d);
                                p.push({ d: d, dot: dot });
                            }
                        }
                        // Sort pairs from closest to farthest
                        p.sort((a, b) => a.d - b.d);

                        const bound = 0.01;
                        if (Math.acos(p[0].dot) < bound) boundary = true;
                        if (Math.acos(p[1].dot) < bound) boundary = true;
                    }
                }
            }

            // Calculate ceiling and floor
            let ceiling = (SCREEN_HEIGHT / 2.0) - SCREEN_HEIGHT / distanceToWall;
            let floor = SCREEN_HEIGHT - ceiling;

            let shade = ' ';
            if (hitWall) {
                if (distanceToWall <= MAX_DEPTH / 4.0) shade = '\u2588';      // Block
                else if (distanceToWall < MAX_DEPTH / 3.0) shade = '\u2593';  // Dark shade
                else if (distanceToWall < MAX_DEPTH / 2.0) shade = '\u2592';  // Medium shade
                else if (distanceToWall < MAX_DEPTH) shade = '\u2591';        // Light shade
                else shade = '.';

                if (boundary) shade = ' ';
            }

            if (y < ceiling) {
                output += ' '; // Sky
            } else if (y > ceiling && y <= floor) {
                output += shade; // Wall
            } else {
                // Floor
                let b = 1.0 - ((y - SCREEN_HEIGHT / 2.0) / (SCREEN_HEIGHT / 2.0));
                if (b < 0.25) output += '#';
                else if (b < 0.5) output += 'x';
                else if (b < 0.75) output += '.';
                else output += ' ';
            }
        }
        output += '\n';
    }

    // Stats
    output += `X=${playerX.toFixed(2)}, Y=${playerY.toFixed(2)}, A=${playerA.toFixed(2)} | Controls: WASD to move, Q to quit`;

    // Write frame
    stdout.write(output);
}

// Game Loop
console.log('\x1b[2J'); // Clear entire screen once
setInterval(render, 100); // 10 FPS for terminal

