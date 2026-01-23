
// Doom-style Raycaster Engine

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('message-overlay');

// Game State
let isRunning = false;
let lastTime = 0;

// World Map (1: wall, 0: empty)
const mapWidth = 24;
const mapHeight = 24;
const map = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 3, 0, 3, 0, 3, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 3, 0, 3, 0, 3, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 4, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 4, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 4, 0, 4, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 4, 0, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 4, 4, 4, 4, 4, 4, 4, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

// Player State
let posX = 22, posY = 12; // Start inside
let dirX = -1, dirY = 0; // Initial direction vector
let planeX = 0, planeY = 0.66; // The 2d raycaster version of camera plane

// Game variables
let score = 0;
const numSprites = 19;
const sprites = [
    //x, y, texture
    { x: 20.5, y: 11.5, texture: 10 },
    { x: 18.5, y: 4.5, texture: 10 },
    { x: 10.0, y: 4.5, texture: 10 },
    { x: 10.0, y: 12.5, texture: 10 },
    { x: 3.5, y: 6.5, texture: 10 },
    { x: 3.5, y: 20.5, texture: 10 },
    { x: 3.5, y: 14.5, texture: 10 },
    { x: 14.5, y: 20.5, texture: 10 },

    { x: 18.5, y: 10.5, texture: 11 },
    { x: 18.5, y: 11.5, texture: 11 },
    { x: 18.5, y: 12.5, texture: 11 },

    { x: 21.5, y: 1.5, texture: 12 },
    { x: 15.5, y: 1.5, texture: 12 },
    { x: 16.0, y: 1.8, texture: 12 },
    { x: 16.2, y: 1.2, texture: 12 },
    { x: 3.5, y: 2.5, texture: 12 },
    { x: 9.5, y: 15.5, texture: 12 },
    { x: 10.0, y: 15.1, texture: 12 },
    { x: 10.5, y: 15.8, texture: 12 },
];
const zBuffer = new Array(canvas.width);

// Movement Keys
const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    shoot: false
};

// Weapon
let weaponFrame = 0;
let isShooting = false;
let ammo = 50;

function startGame() {
    overlay.style.display = 'none';
    isRunning = true;
    requestAnimationFrame(gameLoop);
}

// Input Handling
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp': keys.forward = true; break;
        case 'ArrowDown': keys.backward = true; break;
        case 'ArrowLeft': keys.left = true; break;
        case 'ArrowRight': keys.right = true; break;
        case ' ':
            if (!keys.shoot && ammo > 0) {
                shoot();
            }
            keys.shoot = true;
            break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'ArrowUp': keys.forward = false; break;
        case 'ArrowDown': keys.backward = false; break;
        case 'ArrowLeft': keys.left = false; break;
        case 'ArrowRight': keys.right = false; break;
        case ' ': keys.shoot = false; break;
    }
});

function shoot() {
    if (isShooting) return;
    isShooting = true;
    ammo--;
    document.getElementById('ammo-val').innerText = ammo;
    // Shooting animation effect
    weaponFrame = 1;
    setTimeout(() => weaponFrame = 0, 100);
    setTimeout(() => isShooting = false, 250);

    // Check for sprite hits
    for (let i = 0; i < numSprites; i++) {
        const sprite = sprites[i];
        if (sprite.texture !== 13) { // Not already dead
            const vecX = sprite.x - posX;
            const vecY = sprite.y - posY;
            const dist = Math.sqrt(vecX * vecX + vecY * vecY);
            
            const eyeX = dirX;
            const eyeY = dirY;

            const dot = (eyeX * vecX / dist) + (eyeY * vecY / dist);

            if (dot > 0.98) { // ~12 degree cone
                sprite.texture = 13; // Dead sprite
                score += 100;
                document.getElementById('score-val').innerText = score;
            }
        }
    }
}

// Update Logic
function update(delta) {
    const moveSpeed = 5.0 * delta; // squares/second
    const rotSpeed = 3.0 * delta; // radians/second

    if (keys.forward) {
        if (map[Math.floor(posX + dirX * moveSpeed)][Math.floor(posY)] == 0) posX += dirX * moveSpeed;
        if (map[Math.floor(posX)][Math.floor(posY + dirY * moveSpeed)] == 0) posY += dirY * moveSpeed;
    }
    if (keys.backward) {
        if (map[Math.floor(posX - dirX * moveSpeed)][Math.floor(posY)] == 0) posX -= dirX * moveSpeed;
        if (map[Math.floor(posX)][Math.floor(posY - dirY * moveSpeed)] == 0) posY -= dirY * moveSpeed;
    }
    if (keys.right) {
        // Both camera direction and camera plane must be rotated
        const oldDirX = dirX;
        dirX = dirX * Math.cos(-rotSpeed) - dirY * Math.sin(-rotSpeed);
        dirY = oldDirX * Math.sin(-rotSpeed) + dirY * Math.cos(-rotSpeed);
        const oldPlaneX = planeX;
        planeX = planeX * Math.cos(-rotSpeed) - planeY * Math.sin(-rotSpeed);
        planeY = oldPlaneX * Math.sin(-rotSpeed) + planeY * Math.cos(-rotSpeed);
    }
    if (keys.left) {
        const oldDirX = dirX;
        dirX = dirX * Math.cos(rotSpeed) - dirY * Math.sin(rotSpeed);
        dirY = oldDirX * Math.sin(rotSpeed) + dirY * Math.cos(rotSpeed);
        const oldPlaneX = planeX;
        planeX = planeX * Math.cos(rotSpeed) - planeY * Math.sin(rotSpeed);
        planeY = oldPlaneX * Math.sin(rotSpeed) + planeY * Math.cos(rotSpeed);
    }
}

// Rendering Logic
function draw() {
    // Clear screen
    // Floor casting (simple gradient)
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#333'); // Ceiling
    gradient.addColorStop(0.5, '#000'); // Horizon
    gradient.addColorStop(1, '#554433'); // Floor
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Raycasting
    for (let x = 0; x < canvas.width; x++) {
        const cameraX = 2 * x / canvas.width - 1;
        const rayDirX = dirX + planeX * cameraX;
        const rayDirY = dirY + planeY * cameraX;

        let mapX = Math.floor(posX);
        let mapY = Math.floor(posY);

        let sideDistX, sideDistY;

        const deltaDistX = Math.abs(1 / rayDirX);
        const deltaDistY = Math.abs(1 / rayDirY);
        let perpWallDist;

        let stepX, stepY;

        let hit = 0;
        let side;

        if (rayDirX < 0) {
            stepX = -1;
            sideDistX = (posX - mapX) * deltaDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1.0 - posX) * deltaDistX;
        }
        if (rayDirY < 0) {
            stepY = -1;
            sideDistY = (posY - mapY) * deltaDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1.0 - posY) * deltaDistY;
        }

        while (hit == 0) {
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
            }
            if (map[mapX][mapY] > 0) hit = 1;
        }

        if (side == 0) perpWallDist = (mapX - posX + (1 - stepX) / 2) / rayDirX;
        else perpWallDist = (mapY - posY + (1 - stepY) / 2) / rayDirY;

        const lineHeight = Math.floor(canvas.height / perpWallDist);

        let drawStart = -lineHeight / 2 + canvas.height / 2;
        if (drawStart < 0) drawStart = 0;
        let drawEnd = lineHeight / 2 + canvas.height / 2;
        if (drawEnd >= canvas.height) drawEnd = canvas.height - 1;

        // Wall colors based on map value
        let color;
        switch (map[mapX][mapY]) {
            case 1: color = '#AA0000'; break; // Red
            case 2: color = '#00AA00'; break; // Green
            case 3: color = '#0000AA'; break; // Blue
            case 4: color = '#AAAAAA'; break; // White
            default: color = '#AA8800'; break; // Yellow
        }

        // Give x and y sides different brightness
        if (side == 1) {
            // Darken color
            color = color.replace(/AA/g, '77');
        }

        ctx.fillStyle = color;
        ctx.fillRect(x, drawStart, 1, drawEnd - drawStart);

        zBuffer[x] = perpWallDist; // perpendicular distance
    }

    // Sprite casting
    // Sort sprites from far to close
    for (let i = 0; i < numSprites; i++) {
        sprites[i].distance = ((posX - sprites[i].x) * (posX - sprites[i].x) + (posY - sprites[i].y) * (posY - sprites[i].y));
    }
    sprites.sort((a, b) => b.distance - a.distance);

    for (let i = 0; i < numSprites; i++) {
        const spriteX = sprites[i].x - posX;
        const spriteY = sprites[i].y - posY;

        const invDet = 1.0 / (planeX * dirY - dirX * planeY);

        const transformX = invDet * (dirY * spriteX - dirX * spriteY);
        const transformY = invDet * (-planeY * spriteX + planeX * spriteY);

        if (transformY > 0) {
            const spriteScreenX = Math.floor((canvas.width / 2) * (1 + transformX / transformY));
            const spriteHeight = Math.abs(Math.floor(canvas.height / (transformY)));
            let drawStartY = -spriteHeight / 2 + canvas.height / 2;
            if (drawStartY < 0) drawStartY = 0;
            let drawEndY = spriteHeight / 2 + canvas.height / 2;
            if (drawEndY >= canvas.height) drawEndY = canvas.height - 1;

            const spriteWidth = Math.abs(Math.floor(canvas.height / (transformY)));
            let drawStartX = Math.floor(-spriteWidth / 2 + spriteScreenX);
            if (drawStartX < 0) drawStartX = 0;
            let drawEndX = spriteWidth / 2 + spriteScreenX;
            if (drawEndX >= canvas.width) drawEndX = canvas.width - 1;

            for (let stripe = drawStartX; stripe < drawEndX; stripe++) {
                if (transformY > 0 && stripe > 0 && stripe < canvas.width && transformY < zBuffer[stripe]) {
                    // Sprite color based on texture
                    let spriteColor;
                    switch (sprites[i].texture) {
                        case 10: spriteColor = '#FF0000'; break; // Imp
                        case 11: spriteColor = '#00FF00'; break; // Barrel
                        case 12: spriteColor = '#0000FF'; break; // Pillar
                        case 13: spriteColor = '#404040'; break; // Dead Imp
                        default: spriteColor = '#FF00FF'; break;
                    }
                    ctx.fillStyle = spriteColor;
                    ctx.fillRect(stripe, drawStartY, 1, drawEndY - drawStartY);
                }
            }
        }
    }

    // Draw Weapon (Primitive Gun)
    const gunWidth = 200;
    const gunHeight = 200;
    const gunX = canvas.width / 2 - gunWidth / 2;
    const gunY = canvas.height - gunHeight + (weaponFrame * 20); // Recoil

    // Gun shape (simple polygons)
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.moveTo(gunX + 60, gunY + 80);
    ctx.lineTo(gunX + 140, gunY + 80);
    ctx.lineTo(gunX + 160, canvas.height);
    ctx.lineTo(gunX + 40, canvas.height);
    ctx.fill();

    // Muzzle flash
    if (isShooting && Math.random() > 0.5) {
        ctx.fillStyle = '#FFDD55';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2 + 50, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FF8800';
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2 + 50, 20, 0, Math.PI * 2);
        ctx.fill();
    }
}

function gameLoop(timestamp) {
    if (!isRunning) return;

    if (lastTime === 0) lastTime = timestamp;
    const delta = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    update(delta);
    draw();

    requestAnimationFrame(gameLoop);
}
