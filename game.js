console.log("Game script loaded!");

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game settings
const tileSize = 20;
const rows = 25;
const cols = 25;

canvas.width = cols * tileSize;
canvas.height = rows * tileSize;

// Game Assets
const wallColor = '#444';
const playerColor = '#40E0D0';
const powerPlayerColor = '#00FFFF';
const dotColor = '#fff';
const powerPillColor = '#FFD700';
const vulnerableEnemyColor = '#4169E1';

// Game State
let score, powerPillActive, powerPillTimer, lastFrameTime, gameState, remainingDots, player, enemies, gameStarted;
const POWER_PILL_DURATION = 7000;
const INVULNERABILITY_DURATION = 3000;
const ENEMY_RESPAWN_TIME = 10000; // 10 seconds

const initialMap = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,1,1,1,1,2,1,2,1,1,1,1,1,2,1,1,1,2,1],
    [1,3,1,2,2,2,2,2,2,2,1,2,1,2,1,2,2,2,2,2,2,2,1,3,1],
    [1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1],
    [1,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1,2,1],
    [1,2,2,2,1,2,1,2,2,2,2,2,1,2,2,2,2,2,1,2,1,2,2,2,1],
    [1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1],
    [1,2,2,2,1,2,2,2,2,2,1,2,2,2,1,2,2,2,2,2,1,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,2,1,1,1,1,1,2,1,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,2,1,2,1,2,1,2,0,0,1,2,1,2,1,2,1,1,1,1,1],
    [1,2,2,2,2,2,1,2,2,2,1,2,0,0,1,2,2,2,1,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,2,1],
    [1,2,2,2,1,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,1,2,2,2,1],
    [1,2,1,2,1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1,2,1,2,1],
    [1,2,1,2,2,2,1,2,2,2,2,2,2,2,2,2,2,2,1,2,2,2,1,2,1],
    [1,2,1,1,1,2,1,2,1,1,1,1,1,1,1,1,1,2,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,1,1,1,2,1],
    [1,3,2,2,2,2,1,2,2,2,1,2,1,2,1,2,2,2,1,2,2,2,2,3,1],
    [1,2,1,1,1,2,1,1,1,2,1,2,1,2,1,2,1,1,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];
let map;

function setupNewGame() {
    map = initialMap.map(arr => [...arr]);
    score = 0;
    remainingDots = 0;
    for (let r=0; r<rows; r++) { for (let c=0; c<cols; c++) { if (map[r][c] === 2) remainingDots++; } }
    
    player = { x: 12.5*tileSize, y: 23.5*tileSize, radius: tileSize/2*0.8, speed: 2, originalSpeed: 2, dx: 0, dy: 0, direction: 'right', nextDirection: null, lives: 3, isInvulnerable: true, invulnerabilityTimer: INVULNERABILITY_DURATION };
    
    enemies = [
        { type: 'square', color: '#FF5733', speed: 1.2, dx: 0, dy: 0, direction: 'up', x: 11.5*tileSize, y: 11.5*tileSize, initialPos: {x: 11.5*tileSize, y: 11.5*tileSize} },
        { type: 'square', color: '#FFC300', speed: 1.2, dx: 0, dy: 0, direction: 'down', x: 13.5*tileSize, y: 11.5*tileSize, initialPos: {x: 13.5*tileSize, y: 11.5*tileSize} },
        { type: 'circle', color: '#C70039', speed: 1.2, dx: 0, dy: 0, direction: 'up', x: 11.5*tileSize, y: 13.5*tileSize, initialPos: {x: 11.5*tileSize, y: 13.5*tileSize} },
        { type: 'circle', color: '#900C3F', speed: 1.2, dx: 0, dy: 0, direction: 'down', x: 13.5*tileSize, y: 13.5*tileSize, initialPos: {x: 13.5*tileSize, y: 13.5*tileSize} },
    ];

    gameState = 'playing';
    gameStarted = false;
}

function getTile(x, y) { return { row: Math.floor(y/tileSize), col: Math.floor(x/tileSize) }; }
function isWall(col, row) { if (row<0||row>=rows||col<0||col>=cols) return true; return map[row][col] === 1; }

function drawMap() { for (let r=0; r<rows; r++) { for (let c=0; c<cols; c++) { if(map[r][c]===1) { ctx.fillStyle=wallColor; ctx.fillRect(c*tileSize, r*tileSize, tileSize, tileSize); } } } }
function drawCollectibles() { for (let r=0; r<rows; r++) { for (let c=0; c<cols; c++) { const t=map[r][c]; if(t===2||t===3){ ctx.beginPath(); ctx.arc(c*tileSize+tileSize/2, r*tileSize+tileSize/2, t===2?tileSize/10:tileSize/3, 0, 2*Math.PI); ctx.fillStyle=t===2?dotColor:powerPillColor; ctx.fill(); } } } }
function drawScore() { ctx.fillStyle = 'white'; ctx.font = '20px sans-serif'; ctx.fillText(`Score: ${score}`, 20, 16); }
function drawLives() { ctx.fillStyle = 'white'; ctx.font = '20px sans-serif'; ctx.fillText(`Vidas: ${player.lives}`, canvas.width - 80, 16); }

function drawPlayer() { if (player.isInvulnerable && Math.floor(Date.now() / 200) % 2 === 0) { return; } ctx.save(); ctx.translate(player.x, player.y); let a=0; if(player.direction==='down')a=Math.PI/2; if(player.direction==='left')a=Math.PI; if(player.direction==='up')a=-Math.PI/2; ctx.rotate(a); ctx.beginPath(); ctx.moveTo(player.radius,0); ctx.lineTo(-player.radius/2,player.radius*0.866); ctx.lineTo(-player.radius/2,-player.radius*0.866); ctx.closePath(); ctx.fillStyle = powerPillActive ? powerPlayerColor : playerColor; ctx.fill(); ctx.restore(); }

function drawEnemies() { enemies.forEach(e => { ctx.fillStyle = powerPillActive ? vulnerableEnemyColor : e.color; if (e.type === 'square'){ ctx.fillRect(e.x - (tileSize/2), e.y - (tileSize/2), tileSize, tileSize); } else { ctx.beginPath(); ctx.arc(e.x, e.y, tileSize * 0.4, 0, 2 * Math.PI); ctx.fill(); } }); }

function updatePlayer() { if (!gameStarted) return; const TILE_CENTER=tileSize/2; const pcol=Math.floor(player.x/tileSize); const prow=Math.floor(player.y/tileSize); if(player.x%tileSize===TILE_CENTER&&player.y%tileSize===TILE_CENTER){if(player.nextDirection&&player.direction!==player.nextDirection){if(player.nextDirection==='up'&&!isWall(pcol,prow-1)){player.direction='up';}else if(player.nextDirection==='down'&&!isWall(pcol,prow+1)){player.direction='down';}else if(player.nextDirection==='left'&&!isWall(pcol-1,prow)){player.direction='left';}else if(player.nextDirection==='right'&&!isWall(pcol+1,prow)){player.direction='right';}}if((player.direction==='up'&&isWall(pcol,prow-1))||(player.direction==='down'&&isWall(pcol,prow+1))||(player.direction==='left'&&isWall(pcol-1,prow))||(player.direction==='right'&&isWall(pcol+1,prow))){player.dx=0;player.dy=0;}else{if(player.direction==='up'){player.dy=-player.speed;player.dx=0;}else if(player.direction==='down'){player.dy=player.speed;player.dx=0;}else if(player.direction==='left'){player.dx=-player.speed;player.dy=0;}else if(player.direction==='right'){player.dx=player.speed;player.dy=0;}}}player.x+=player.dx;player.y+=player.dy;const eatingTile=getTile(player.x,player.y);if(eatingTile.row>=0&&eatingTile.row<rows&&eatingTile.col>=0&&eatingTile.col<cols){if(map[eatingTile.row][eatingTile.col]===2){score+=10;remainingDots--;map[eatingTile.row][eatingTile.col]=0;}else if(map[eatingTile.row][eatingTile.col]===3){score+=50;map[eatingTile.row][eatingTile.col]=0;powerPillActive=true;powerPillTimer=POWER_PILL_DURATION;player.speed=player.originalSpeed*1.25;}}if(remainingDots===0){gameState='won';} }

function updateEnemies() {
    enemies.forEach(enemy => {
        if (!gameStarted) return;

        const nextX = enemy.x + enemy.dx;
        const nextY = enemy.y + enemy.dy;
        const enemyRadius = tileSize / 2 - 1; 

        const tl_col = Math.floor((nextX - enemyRadius) / tileSize);
        const tl_row = Math.floor((nextY - enemyRadius) / tileSize);
        const tr_col = Math.floor((nextX + enemyRadius) / tileSize);
        const tr_row = Math.floor((nextY - enemyRadius) / tileSize);
        const bl_col = Math.floor((nextX - enemyRadius) / tileSize);
        const bl_row = Math.floor((nextY + enemyRadius) / tileSize);
        const br_col = Math.floor((nextX + enemyRadius) / tileSize);
        const br_row = Math.floor((nextY + enemyRadius) / tileSize);

        if (isWall(tl_col, tl_row) || isWall(tr_col, tr_row) || isWall(bl_col, bl_row) || isWall(br_col, br_row)) {
            const validMoves = [];
            const ecol = Math.floor(enemy.x / tileSize);
            const erow = Math.floor(enemy.y / tileSize);
            if (!isWall(ecol, erow - 1)) validMoves.push('up');
            if (!isWall(ecol, erow + 1)) validMoves.push('down');
            if (!isWall(ecol - 1, erow)) validMoves.push('left');
            if (!isWall(ecol + 1, erow)) validMoves.push('right');
            
            if(validMoves.length > 0) {
                const newDirection = validMoves[Math.floor(Math.random() * validMoves.length)];
                if (newDirection === 'up') { enemy.dy = -enemy.speed; enemy.dx = 0; enemy.direction = 'up'; }
                else if (newDirection === 'down') { enemy.dy = enemy.speed; enemy.dx = 0; enemy.direction = 'down'; }
                else if (newDirection === 'left') { enemy.dx = -enemy.speed; enemy.dy = 0; enemy.direction = 'left'; }
                else if (newDirection === 'right') { enemy.dx = enemy.speed; enemy.dy = 0; enemy.direction = 'right'; }
            }
        } else {
            enemy.x = nextX;
            enemy.y = nextY;
        }
    });
}

function resetPlayer() { player.lives--; if (player.lives <= 0) { gameState = 'lost'; } else { player.x = 12.5*tileSize; player.y = 23.5*tileSize; player.dx = 0; player.dy = 0; player.direction = 'right'; player.nextDirection = null; player.isInvulnerable = true; player.invulnerabilityTimer = INVULNERABILITY_DURATION; } }
function reviveEnemy(enemy) {
    const ecol = Math.floor(enemy.x / tileSize);
    const erow = Math.floor(enemy.y / tileSize);
    const validMoves = [];
    if (!isWall(ecol, erow - 1)) validMoves.push('up');
    if (!isWall(ecol, erow + 1)) validMoves.push('down');
    if (!isWall(ecol - 1, erow)) validMoves.push('left');
    if (!isWall(ecol + 1, erow)) validMoves.push('right');
    if(validMoves.length > 0) {
        const newDirection = validMoves[Math.floor(Math.random() * validMoves.length)];
        if (newDirection === 'up') { enemy.dy = -enemy.speed; enemy.dx = 0; enemy.direction = 'up'; }
        else if (newDirection === 'down') { enemy.dy = enemy.speed; enemy.dx = 0; enemy.direction = 'down'; }
        else if (newDirection === 'left') { enemy.dx = -enemy.speed; enemy.dy = 0; enemy.direction = 'left'; }
        else if (newDirection === 'right') { enemy.dx = enemy.speed; enemy.dy = 0; enemy.direction = 'right'; }
    }
    enemy.isReset = false;
}

function resetEnemy(enemy) {
    enemy.x = enemy.initialPos.x;
    enemy.y = enemy.initialPos.y;
    enemy.dx = 0;
    enemy.dy = 0;
    enemy.isReset = true;
    setTimeout(() => reviveEnemy(enemy), ENEMY_RESPAWN_TIME);
}

function checkCollisions() { if (player.isInvulnerable) return; enemies.forEach(enemy => { const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y); if (dist < player.radius + tileSize / 2) { if (powerPillActive) { score += 100; resetEnemy(enemy); } else { resetPlayer(); } } }); }

function updateGameState(deltaTime) { if (powerPillActive) { powerPillTimer -= deltaTime; if (powerPillTimer <= 0) { powerPillActive = false; powerPillTimer = 0; player.speed = player.originalSpeed; } } if (player.isInvulnerable) { player.invulnerabilityTimer -= deltaTime; if (player.invulnerabilityTimer <= 0) { player.isInvulnerable = false; } } }

function drawEndScreen() { ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.fillStyle = 'white'; ctx.font = '40px sans-serif'; ctx.textAlign = 'center'; if (gameState === 'won') { ctx.fillText('¡Ganaste!', canvas.width / 2, canvas.height / 2); } else { ctx.fillText('Has Perdido', canvas.width / 2, canvas.height / 2); } ctx.font = '20px sans-serif'; ctx.fillText('Refresca la página para volver a jugar', canvas.width/2, canvas.height/2 + 40); }

document.addEventListener('keydown', e => { if (gameState === 'playing' && !gameStarted) { gameStarted = true; kickstartEnemies(); } if (e.key === 'ArrowUp') player.nextDirection='up'; else if (e.key === 'ArrowDown') player.nextDirection='down'; else if (e.key === 'ArrowLeft') player.nextDirection='left'; else if (e.key === 'ArrowRight') player.nextDirection='right'; });

function gameLoop(currentTime) {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if (gameState === 'playing') {
        const deltaTime = (currentTime - lastFrameTime) || 0;
        lastFrameTime = currentTime;
        updatePlayer(); updateEnemies(); checkCollisions(); updateGameState(deltaTime);
        drawMap(); drawCollectibles(); drawPlayer(); drawEnemies(); drawScore(); drawLives();
    } else {
        drawEndScreen();
    }
    requestAnimationFrame(gameLoop);
}

setupNewGame();
lastFrameTime = performance.now();
requestAnimationFrame(gameLoop);
