





// --- 1. CORE SETUP ---

const canvas = document.getElementById('game');

const ctx = canvas.getContext('2d');

const music = document.getElementById('bg-music');



const UNIT = 64; 

const WORLD_WIDTH = 75 * UNIT; // Made it a bit wider for the vent run

const WORLD_HEIGHT = 7 * UNIT; 


let gameOverAlpha = 0; // Tracks the fade-in (0 is invisible, 1 is solid)
let officePattern;
let gameRunning = false; // Add this near your other 'let' variables
let cameraX = 0;
let score = 0;
 let shootTimer = 0;
let gameState = 'OFFICE'; 
let activeNPC = null;
let isTalking = false;
let verticalOffset = 0; 
let killsForBurst = 0;
let burstReady = false;
let burstEffectTimer = 0; // How long the giant X stays on screen
let burstTargetPos = { x: 0, y: 0 }; // Where the giant X will appear
let shakeTimer = 0;


class NPC {
    constructor(x, y, name, lines, state, spriteSrc, choices = null) {
        this.x = x;
        this.y = y;
        this.width = UNIT;
        this.height = UNIT;
        this.name = name;
        this.lines = lines; 
        this.state = state; 
        this.currentLine = 0;
        this.choices = choices;
        this.showingChoices = false;
        this.hasSpoken = false;
        this.facing = 'right'; // Default direction

        // Typewriter Properties
        this.visibleChars = 0;
        this.typingSpeed = 1;

        // Load the sprite
        this.sprite = new Image();
        this.sprite.src = spriteSrc;
    }

    draw() {
        if (gameState !== this.state) return;

        // --- 1. FACING LOGIC ---
        let dist = Math.abs(player.x - this.x);
        // If player is within 5 units, look at them
        if (dist < UNIT * 5) {
            this.facing = (player.x < this.x) ? 'left' : 'right';
        }

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // --- 2. DRAW SPRITE (With Flipping) ---
        if (this.facing === 'left') {
            // Flip the context horizontally for the sprite only
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            if (this.sprite.complete) {
                ctx.drawImage(this.sprite, 0, 0, this.width, this.height);
            } else {
                ctx.fillStyle = "#888";
                ctx.fillRect(0, 0, this.width, this.height);
            }
        } else {
            // Draw normally
            if (this.sprite.complete) {
                ctx.drawImage(this.sprite, this.x, this.y, this.width, this.height);
            } else {
                ctx.fillStyle = "#888";
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        }
        ctx.restore(); // Restore prevents the text below from being flipped!
        
        // --- 3. UI LABELS ---
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";
        
        // Name tag
        ctx.fillText(this.name, this.x + this.width/2, this.y - 10);
        
        // Show an "E" bubble if player is close enough to talk
        if (dist < UNIT * 1.5 && !isTalking) {
            ctx.fillStyle = "yellow";
            ctx.fillText("[E]", this.x + this.width/2, this.y - 30);
        }
    }
}

class Enemy {
    constructor(x, y, range, state) {
        this.x = x;
        this.y = y;
        this.startX = x; 
        this.range = range; 
        this.state = state; 
        this.width = UNIT;
        this.height = UNIT;
        this.speed = 2;
        this.dx = this.speed;
        this.hp = 3; // Takes 3 hits to kill
this.alive = true;
        // Animation
        this.frameX = 0; 
        this.totalFrames = 2; 
        this.frameTimer = 0;
        this.frameInterval = 10; 

        // AI Logic
        this.detectionRange = 300; // How far they can "see" you
        this.attackRange = 40;     // Distance to stop and bite
    }

    update() {
        if (gameState !== this.state || player.health <= 0) return;

        const distToPlayer = Math.abs(this.x - player.x);
        const playerInLevelY = Math.abs(this.y - player.y) < UNIT * 2;

        // 1. CHASE & ATTACK LOGIC
        if (distToPlayer < this.detectionRange && playerInLevelY) {
            // Determine direction to player
            let dir = player.x < this.x ? -1 : 1;
            
            if (distToPlayer > this.attackRange) {
                // Move toward player
                this.x += dir * (this.speed * 1.5);
                this.dx = dir; // Update direction for drawing
            } else {
                // STOP and Attack
                this.dx = dir; 
                player.health -= 0.5; // Continuous damage
                this.frameInterval = 5; // Faster "chomping" animation
            }
        } else {
            // 2. PATROL LOGIC (Normal behavior)
            this.frameInterval = 10;
            this.x += this.dx;
            if (this.x > this.startX + this.range || this.x < this.startX) {
                this.dx *= -1; 
            }
        }

        // Animation Loop
        this.frameTimer++;
        if (this.frameTimer % this.frameInterval === 0) {
            this.frameX = (this.frameX + 1) % this.totalFrames;
        }
    }

    draw() {
        if (gameState !== this.state) return;
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        
        // Use the new 1600px frame constants
        if (this.dx < 0) {
            ctx.translate(this.x + this.width, this.y);
            ctx.scale(-1, 1);
            ctx.drawImage(enemySheet, this.frameX * ENEMY_FRAME_W, 0, ENEMY_FRAME_W, ENEMY_FRAME_H, 0, 0, this.width, this.height);
        } else {
            ctx.drawImage(enemySheet, this.frameX * ENEMY_FRAME_W, 0, ENEMY_FRAME_W, ENEMY_FRAME_H, this.x, this.y, this.width, this.height);
        }
        ctx.restore();
    }
}
const enemies = [

    // Vent Enemies (The 3 you wanted)
    new Enemy(40 * UNIT, -1.5 * UNIT, 5 * UNIT, 'VENT'),   // First long vent
    new Enemy(46 * UNIT, -3.5 * UNIT, 5 * UNIT, 'VENT'),   // Middle vent
    new Enemy(58 * UNIT, -1.5 * UNIT, 12 * UNIT, 'VENT')   // Final long stretch
];
class Projectile {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 12;
        this.dx = direction * this.speed;
        this.active = true;
    }

    update() {
        this.x += this.dx;
        
        // Remove if it goes too far off screen
        if (Math.abs(this.x - player.x) > canvas.width) {
            this.active = false;
        }
    }

    draw() {
        ctx.fillStyle = "#ff0000"; 
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("X", this.x, this.y + 15);
    }
}
const keys = {};



function resize() {

    canvas.width = window.innerWidth;

    canvas.height = window.innerHeight;

    verticalOffset = (canvas.height - WORLD_HEIGHT) / 2;

}

window.addEventListener('resize', resize);

resize();



const playerSprite = new Image();
playerSprite.src = 'Cube x sprite.png'; 
const librarySprite = new Image();
librarySprite.src = 'library.png';
const highlibrarySprite = new Image();
highlibrarySprite.src = 'Tall ahh library.png'
const deskSprite = new Image();
deskSprite.src = 'desk.png';
const officeBg = new Image();
officeBg.src = 'officeBg.png';
const barContainer = new Image();
barContainer.src = 'health_container.png'; // Your frame sprite
const barFill = new Image();
barFill.src = 'health_fill.png'; // Your colorful bar sprite
const enemySheet = new Image();
enemySheet.src = 'enemy.png'; 
const burstSprite = new Image();
burstSprite.src = 'giantX.png'; // Make sure this matches your filename!
const gameOverScreen = new Image();
gameOverScreen.src = 'gameover_screen.png'; // Make sure this matches your actual filename!
const retryBtnImg = new Image();
retryBtnImg.src = 'retry_button.png'; // Your filename
const menuBtnImg = new Image();
menuBtnImg.src = 'menu_button.png'; // Your filename

// The actual dimensions of each frame in the PNG file
const ENEMY_FRAME_W = 1600; 
const ENEMY_FRAME_H = 1600;

const player = {
    x: UNIT,
    y: WORLD_HEIGHT - UNIT,
    width: UNIT,
    height: UNIT,
    speed: 7,
    dx: 0,
    dy: 0,
    gravity: 0.8,
    jumpPower: -16,
    grounded: false,
    maxHealth: 100,
    health: 100,
    facing: 'right',
    isDashing: false,
    dashTimer: 0,
    dashCooldown: 0,
    dashSpeed: 20,      // How fast the dash is
    dashDuration: 10,   // How many frames the dash lasts
    dashTotalCooldown: 40
};
const npcs = [
    new NPC(5 * UNIT, WORLD_HEIGHT - UNIT, "Sima", ["Oh hey, Xquic!", "Going home already?", "Alright!Farda mibinamet!"], "OFFICE", "Emoticon sprite.png"),
    new NPC(22 * UNIT, WORLD_HEIGHT - UNIT, "Haile", ["Ah, Xquic. ታገሠ","Watch out for the boss. He is grumpy today.","መልካም ዕድል."], "OFFICE", "Battery sprite.png"),
    // Add this to your npcs array
new NPC(12 * UNIT, WORLD_HEIGHT - UNIT, "Boss Knopf",
    ["Oi! Xquic! Die kleine Lady nimmt diesen Job nicht ernst..."],
    "OFFICE", 
    "Button sprite.png", 
    {
        question: "Where do you think you are going, Xquic?",
        options: [
            { text: "1: None of your business", response: ["Ah. Frechheit! Fine. Don't pass by the door.", "Something is blockading it anyway."], effect: null },
            { text: "2: I am heading home, Sir Knopf", response: ["I see. Have a safe trip.","Ah also. The door is blocked for some reason"], effect: null },
        ]
    }
)
];
//--- 4. MENU & LEVEL LOADING ---

function openLevelSelect() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('level-select').style.display = 'flex';
}

function backToMain() {
    document.getElementById('level-select').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
}


function loadLevel(num) {
    document.getElementById('level-select').style.display = 'none';
    document.getElementById('main-menu').style.display = 'none';
    canvas.style.display = 'block';

    if (num === 1) {
        setupLevel1();
        platforms.length = 0; // Start fresh
        player.x = UNIT;
        player.y = WORLD_HEIGHT - UNIT;
    }

    if (!gameRunning) {
        gameRunning = true;
        update(); // Added missing () and cleaned up
    }
}

// THIS IS THE ONLY startGame() YOU NEED
function startGame() {
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('level-select').style.display = 'flex';
}
// --- 2. PLATFORMS ---

const platforms = [
    { x: 3 * UNIT, y: WORLD_HEIGHT - UNIT, w: 3 * UNIT, h: UNIT, type: 'desk', solid: true },
    { x: 10 * UNIT, y: WORLD_HEIGHT - UNIT, w: 3 * UNIT, h: UNIT, type: 'desk', solid: true },
    { x: 15 * UNIT, y: WORLD_HEIGHT - 3 * UNIT, w: 1 * UNIT, h: 3 * UNIT, type: 'library', solid: true },
    { x: 16 * UNIT, y: WORLD_HEIGHT - 3 * UNIT, w: 1 * UNIT, h: 3 * UNIT, type: 'library', solid: true },
    { x: 20 * UNIT, y: WORLD_HEIGHT - UNIT, w: 3 * UNIT, h: UNIT, type: 'desk', solid: true },
    { x: 25 * UNIT, y: WORLD_HEIGHT - 3 * UNIT, w: 1 * UNIT, h: 3 * UNIT, type: 'library', solid: true },
    { x: 26 * UNIT, y: WORLD_HEIGHT - 3 * UNIT, w: 1 * UNIT, h: 3 * UNIT, type: 'library', solid: true },
    { x: 40 * UNIT, y: WORLD_HEIGHT - UNIT, w: 3 * UNIT, h: UNIT, type: 'desk', solid: true },
    { x: 45 * UNIT, y: WORLD_HEIGHT - 3 * UNIT, w: 1 * UNIT, h: 3 * UNIT, type: 'library', solid: true },
    { x: 46 * UNIT, y: WORLD_HEIGHT - 3 * UNIT, w: 1 * UNIT, h: 3 * UNIT, type: 'library', solid: true },
    { x: 50 * UNIT, y: WORLD_HEIGHT - UNIT, w: 4 * UNIT, h: UNIT, type: 'desk', solid: true },

    // Ascent to Vent

    { x: 35 * UNIT, y: WORLD_HEIGHT - 3 * UNIT, w: UNIT, h: 3 * UNIT, type: 'library', solid: true }, 
    { x: 36 * UNIT, y: WORLD_HEIGHT - 5 * UNIT, w: UNIT, h: 5 * UNIT, type: 'highlibrary', solid: true },



    // VENT INTERIOR (Hidden until 'E' is pressed)

    //Part 1

    { x: 36 * UNIT, y: -4 * UNIT, w: 7 * UNIT, h: 0.5 * UNIT, type: 'vent_roof', solid: true, hidden: true },

     { x: 37 * UNIT, y: -0.5 * UNIT, w: 8 * UNIT, h: 0.5 * UNIT, type: 'vent_floor', solid: true, hidden: true },

      {x: 36 * UNIT, y: -4 * UNIT,w: 0.5 * UNIT, h: 4 * UNIT,  type: 'vent_wall', solid: true,  hidden: true },

    //Part 2

    { x: 43 * UNIT, y: -6 * UNIT, w: 12 * UNIT, h: 0.5 * UNIT, type: 'vent_roof', solid: true, hidden: true },

    { x: 45 * UNIT, y: -2.5 * UNIT, w: 8 * UNIT, h: 0.5 * UNIT, type: 'vent_floor', solid: true, hidden: true },

    {x: 45 * UNIT, y: -2.5 * UNIT,w: 0.5 * UNIT, h: 2.5 * UNIT,  type: 'vent_wall', solid: true,  hidden: true },

    {x: 43 * UNIT, y: -6 * UNIT,w: 0.5 * UNIT, h: 2.5 * UNIT,  type: 'vent_wall', solid: true,  hidden: true },

    //Part 3

   {x: 53 * UNIT, y: -2.5 * UNIT,w: 0.5 * UNIT, h: 2.5 * UNIT,  type: 'vent_wall', solid: true,  hidden: true },

    {x: 55 * UNIT, y: -6 * UNIT,w: 0.5 * UNIT, h: 2.5 * UNIT,  type: 'vent_wall', solid: true,  hidden: true },

 { x: 55 * UNIT, y: -4 * UNIT, w: 20 * UNIT, h: 0.5 * UNIT, type: 'vent_roof', solid: true, hidden: true },

     { x: 53 * UNIT, y: -0.5 * UNIT, w: 24 * UNIT, h: 0.5 * UNIT, type: 'vent_floor', solid: true, hidden: true },
// Part 3 Vent end...
{ x: 53 * UNIT, y: -0.5 * UNIT, w: 24 * UNIT, h: 0.5 * UNIT, type: 'vent_floor', solid: true, hidden: true },
{ x: 74 * UNIT, y: -0.5 * UNIT, w: 2 * UNIT, h: 2 * UNIT, type: 'vent_wall', solid: true, hidden: true }

];


function setupLevel1() {
    gameState = 'OFFICE';
    player.x = UNIT;
    player.y = WORLD_HEIGHT - UNIT;
    player.dx = 0;
    player.dy = 0;


    platforms.length = 0;
    platforms.push(
   
        { x: 3 * UNIT, y: WORLD_HEIGHT - UNIT, w: 3 * UNIT, h: UNIT, type: 'desk', solid: true },
        { x: 10 * UNIT, y: WORLD_HEIGHT - UNIT, w: 3 * UNIT, h: UNIT, type: 'desk', solid: true },
        { x: 15 * UNIT, y: WORLD_HEIGHT - 3 * UNIT, w: 1 * UNIT, h: 3 * UNIT, type: 'library', solid: true },
{ x: 16 * UNIT, y: WORLD_HEIGHT - 3 * UNIT, w: 1 * UNIT, h: 3 * UNIT, type: 'library', solid: true },
        { x: 20 * UNIT, y: WORLD_HEIGHT - UNIT, w: 3 * UNIT, h: UNIT, type: 'desk', solid: true },
        { x: 25 * UNIT, y: WORLD_HEIGHT - 3 * UNIT, w: 1 * UNIT, h: 3 * UNIT, type: 'library', solid: true },
{ x: 26 * UNIT, y: WORLD_HEIGHT - 3 * UNIT, w: 1 * UNIT, h: 3 * UNIT, type: 'library', solid: true },
        { x: 30 * UNIT, y: WORLD_HEIGHT - UNIT, w: 3 * UNIT, h: UNIT, type: 'desk', solid: true },
        { x: 40 * UNIT, y: WORLD_HEIGHT - UNIT, w: 3 * UNIT, h: UNIT, type: 'desk', solid: true },
        { x: 45 * UNIT, y: WORLD_HEIGHT - 3 * UNIT, w: 1 * UNIT, h: 3 * UNIT, type: 'library', solid: true },
{ x: 46 * UNIT, y: WORLD_HEIGHT - 3 * UNIT, w: 1 * UNIT, h: 3 * UNIT, type: 'library', solid: true },
        { x: 50 * UNIT, y: WORLD_HEIGHT - UNIT, w: 4 * UNIT, h: UNIT, type: 'desk', solid: true },
        { x: 35 * UNIT, y: WORLD_HEIGHT - 3 * UNIT, w: UNIT, h: 3 * UNIT, type: 'library', solid: true }, 
        { x: 36 * UNIT, y: WORLD_HEIGHT - 5 * UNIT, w: UNIT, h: 5 * UNIT, type: 'highlibrary', solid: true },
        { x: 36 * UNIT, y: -4 * UNIT, w: 7 * UNIT, h: 0.5 * UNIT, type: 'vent_roof', solid: true, hidden: true },
        { x: 37 * UNIT, y: -0.5 * UNIT, w: 8 * UNIT, h: 0.5 * UNIT, type: 'vent_floor', solid: true, hidden: true },
        { x: 36 * UNIT, y: -4 * UNIT, w: 0.5 * UNIT, h: 4 * UNIT, type: 'vent_wall', solid: true, hidden: true },
        { x: 43 * UNIT, y: -6 * UNIT, w: 12 * UNIT, h: 0.5 * UNIT, type: 'vent_roof', solid: true, hidden: true },
        { x: 45 * UNIT, y: -2.5 * UNIT, w: 8 * UNIT, h: 0.5 * UNIT, type: 'vent_floor', solid: true, hidden: true },
        { x: 45 * UNIT, y: -2.5 * UNIT, w: 0.5 * UNIT, h: 2.5 * UNIT, type: 'vent_wall', solid: true, hidden: true },
        { x: 43 * UNIT, y: -6 * UNIT, w: 0.5 * UNIT, h: 2.5 * UNIT, type: 'vent_wall', solid: true, hidden: true },
        { x: 53 * UNIT, y: -2.5 * UNIT, w: 0.5 * UNIT, h: 2.5 * UNIT, type: 'vent_wall', solid: true, hidden: true },
        { x: 55 * UNIT, y: -6 * UNIT, w: 0.5 * UNIT, h: 2.5 * UNIT, type: 'vent_wall', solid: true, hidden: true },
        { x: 55 * UNIT, y: -4 * UNIT, w: 20 * UNIT, h: 0.5 * UNIT, type: 'vent_roof', solid: true, hidden: true },
        { x: 53 * UNIT, y: -0.5 * UNIT, w: 24 * UNIT, h: 0.5 * UNIT, type: 'vent_floor', solid: true, hidden: true },
    { x: 75 * UNIT, y: -4  * UNIT, w:0.5 * UNIT, h: 4* UNIT, type: 'vent_wall', solid: true, hidden: true }
);
}

// --- 1. THE CLASS (Must be defined BEFORE it's used) ---



// Array to hold all active missiles
const playerProjectiles = [];
// --- 3. DRAWING ---

function drawPlayer() {
    ctx.save(); 
    ctx.imageSmoothingEnabled = false;

    // If dashing, draw a semi-transparent "ghost" behind the player
    if (player.isDashing) {
        ctx.globalAlpha = 0.5;
        const ghostOffset = (player.facing === 'left' ? 20 : -20);
        
        // Draw one ghost frame back
        if (player.facing === 'left') {
            ctx.save();
            ctx.translate(player.x + player.width + ghostOffset, player.y);
            ctx.scale(-1, 1);
            ctx.drawImage(playerSprite, 0, 0, player.width, player.height);
            ctx.restore();
        } else {
            ctx.drawImage(playerSprite, player.x + ghostOffset, player.y, player.width, player.height);
        }
    }

    ctx.globalAlpha = 1.0; // Reset transparency for the main player
    
    // Draw the actual player
    if (player.facing === 'left') {
        ctx.translate(player.x + player.width, player.y);
        ctx.scale(-1, 1);
        ctx.drawImage(playerSprite, 0, 0, player.width, player.height);
    } else {
        ctx.drawImage(playerSprite, player.x, player.y, player.width, player.height);
    }
    
    ctx.restore(); 
}


function drawLevel1() {
    ctx.fillStyle = '#b0bec5'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (shakeTimer > 0) {
    ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10);
    shakeTimer--;
}
    let yShift = (gameState === 'VENT') ? verticalOffset + (4 * UNIT) : verticalOffset;
    ctx.translate(-cameraX, yShift);

    if (gameState === 'OFFICE' && officeBg.complete) {
        const bgX = (WORLD_WIDTH / 2) - (officeBg.width / 2);
        ctx.drawImage(officeBg, bgX, 50);
    }

    if (gameState === 'OFFICE') {
        // Ceiling
        ctx.fillStyle = '#96aab5';
        ctx.fillRect(0, -UNIT, WORLD_WIDTH, UNIT); 
        // Floor (Darker so it's not a blob)
        ctx.fillStyle = '#78909c'; 
        ctx.fillRect(0, WORLD_HEIGHT, WORLD_WIDTH, UNIT * 5); 
    }

    platforms.forEach(p => {
        if (p.hidden && gameState !== 'VENT') return;
        if (gameState === 'VENT' && (p.type === 'desk' || p.type === 'library' || p.type === 'highlibrary')) return;

        if (p.type === 'highlibrary') { ctx.drawImage(highlibrarySprite, p.x, p.y, p.w, p.h); }
        else if (p.type === 'library') { ctx.drawImage(librarySprite, p.x, p.y, p.w, p.h); }
        else if (p.type === 'desk') { ctx.drawImage(deskSprite, p.x, p.y, p.w, p.h); }
        else {
            ctx.fillStyle = p.type.includes('vent') ? '#777' : '#444';
            ctx.fillRect(p.x, p.y, p.w, p.h);
        }
    });

   // Drawing all enemies (the class now handles the state check)
   // Inside drawLevel1(), after platforms but before player
npcs.forEach(npc => npc.draw());
enemies.forEach(enemy => {
    // Check if enemy matches the current game state before drawing
    if (enemy.state === gameState) {
        enemy.draw();
    }
});
playerProjectiles.forEach(p => p.draw());
    drawPlayer();

    if (gameState === 'OFFICE' && player.y <= 128 && player.x >= 35 * UNIT && player.x <= 38 * UNIT) {
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("PRESS 'E' TO ENTER VENT", 36.5 * UNIT, -40);
    }
// Inside drawLevel1, after enemies.forEach(...)
if (burstEffectTimer > 0) {
    ctx.globalAlpha = burstEffectTimer / 30; // Fade out as it disappears
    ctx.drawImage(burstSprite, burstTargetPos.x, burstTargetPos.y, UNIT * 3, UNIT * 3);
    ctx.globalAlpha = 1.0; // Reset alpha
}
    ctx.restore(); 
    drawUI(); 
}
function findNearestEnemy() {
    let nearest = null;
    let minDist = Infinity;

    enemies.forEach(enemy => {
        if (enemy.state === gameState && enemy.alive) {
            // Calculate distance using A² + B² = C²
            let dx = enemy.x - player.x;
            let dy = enemy.y - player.y;
            let dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }
    });
    return nearest;
}
    
    // Prompt
    if (gameState === 'OFFICE' && player.y <= 128 && player.x >= 35 * UNIT && player.x <= 38 * UNIT) {
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("PRESS 'E' TO ENTER VENT", 36.5 * UNIT, -40);
    }

    ctx.restore();

 function drawUI() {
    if (!barContainer.complete || !barFill.complete) return;
    
    // --- 1. Health Bar ---
    const x = 30; const y = 30; 
    const width = 256; const height = 128;
    ctx.drawImage(barContainer, x, y, width, height);
    const healthPct = Math.max(0, player.health / player.maxHealth);
    if (healthPct > 0) {
        ctx.drawImage(barFill, 0, 0, barFill.width * healthPct, barFill.height, x, y, width * healthPct, height);
    }

    // --- 2. Burst Status ---
    ctx.fillStyle = "white";
    ctx.font = "bold 18px Arial";
    if (burstReady) {
        ctx.fillStyle = "#ff0000";
        ctx.fillText("BURST READY (R)", 30, 180);
    } else {
        ctx.fillText(`Kills: ${killsForBurst}/3`, 30, 180);
    }

    // --- 3. Dialogue Box (The Fix is Here!) ---
    if (isTalking && activeNPC) {
        const boxW = 800; 
        const boxH = 150;
        const boxX = (canvas.width - boxW) / 2;
        const boxY = canvas.height - boxH - 50;

        // Background Box
        ctx.fillStyle = "rgba(0,0,0,0.9)";
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // NPC Sprite/Face
        if (activeNPC.sprite.complete) {
            ctx.drawImage(activeNPC.sprite, boxX + 20, boxY + 25, 100, 100);
        }

        // --- NPC Name (With Outline) ---
        ctx.fillStyle = "yellow";
        ctx.font = "bold 26px 'Courier New', Courier, monospace"; // Changed font for a "game" feel
        ctx.textAlign = "left";
        
        // Add a black outline to the name
        ctx.strokeStyle = "black";
        ctx.lineWidth = 4;
        ctx.strokeText(activeNPC.name, boxX + 140, boxY + 40);
        ctx.fillText(activeNPC.name, boxX + 140, boxY + 40);

        // --- Logic for Choices vs Text ---
        if (activeNPC.showingChoices) {
            ctx.fillStyle = "white";
            ctx.font = "20px Arial";
            ctx.fillText(activeNPC.choices.question, boxX + 140, boxY + 75);
            activeNPC.choices.options.forEach((opt, i) => {
                ctx.fillStyle = (i === 0) ? "#00ff00" : "#00ffff";
                ctx.fillText(opt.text, boxX + 140, boxY + 110 + (i * 30));
            });
        } else {
            // --- TYPEWRITER TEXT (With Outline & Shadow) ---
            let fullLine = activeNPC.lines[activeNPC.currentLine] || "";
            let displayedText = fullLine.substring(0, Math.floor(activeNPC.visibleChars));
            
            ctx.font = "22px Arial";
            
            // 1. Draw a soft shadow first
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillText(displayedText, boxX + 142, boxY + 87); 

            // 2. Draw a sharp black outline
            ctx.strokeStyle = "black";
            ctx.lineWidth = 3;
            ctx.strokeText(displayedText, boxX + 140, boxY + 85);

            // 3. Draw the actual white text on top
            ctx.fillStyle = "white";
            ctx.fillText(displayedText, boxX + 140, boxY + 85);
            
            // Draw "Next" arrow if line is done
            if (activeNPC.visibleChars >= fullLine.length) {
                ctx.fillStyle = "yellow";
                ctx.fillText("▼ [E]", boxX + boxW - 70, boxY + boxH - 25);
            }
        }}

   // --- 4. Game Over Screen ---
    if (gameState === 'GAMEOVER') {
        // 1. Draw solid black background first (No transparency so it hides the world)
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 2. Apply the fade-in alpha to everything drawn after this
        ctx.globalAlpha = gameOverAlpha;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // 3. Draw Main Game Over Image
        if (gameOverScreen.complete) {
            ctx.drawImage(gameOverScreen, centerX - 400, centerY - 500, 800, 800);
        }

        // 4. Draw Retry Button
        if (retryBtnImg.complete) {
            ctx.drawImage(retryBtnImg, centerX - 300, centerY -200,500, 450);
        }

        // 5. Draw Menu Button
        if (menuBtnImg.complete) {
            ctx.drawImage(menuBtnImg, centerX -200,centerY - 200, 500,450);
        }

        ctx.globalAlpha = 1.0; // Always reset alpha so UI doesn't stay faded!
    }
}




function loadLevel(num) {
    document.getElementById('level-select').style.display = 'none';
    document.getElementById('main-menu').style.display = 'none';
    canvas.style.display = 'block';

    if (num === 1) {
        // Reset to Level 1 (Office)
 setupLevel1();
    }
    if (!gameRunning) {
        gameRunning = true;
        update()
    }

}
function backToMain() {
    document.getElementById('level-select').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
}


function backToMain() {
    document.getElementById('level-select').style.display = 'none';
    document.getElementById('main-menu').style.display = 'flex';
}

// --- 4. ENGINE ---
function applyChoice(option) {
    if (!activeNPC) return;

    // Replace the NPC's lines with the response to your choice
    activeNPC.lines = option.response;
    activeNPC.currentLine = 0;
    activeNPC.showingChoices = false;
    
    // If the choice had an effect (like healing or items), you'd trigger it here
    if (option.effect) option.effect();
    
    // Reset the keys so it doesn't immediately skip the next line
    keys['1'] = false;
    keys['2'] = false;
}
function update() {
    if (!gameRunning) return;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameState === 'GAMEOVER') {
        if (gameOverAlpha < 1) gameOverAlpha += 0.02; // Adjust speed of fade here

        if (keys['r']) {
            resetGame();
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawUI(); 
        requestAnimationFrame(update);
        return; 
    }

    if (player.health <= 0) {
        player.health = 0;
        gameState = 'GAMEOVER';
        requestAnimationFrame(update);
        return; 
    }

   // --- 2. Dialogue Logic ---
    if (isTalking && activeNPC) {
        // Define fullLine so the code knows what it's measuring!
        let fullLine = activeNPC.lines[activeNPC.currentLine] || "";

        // Increment character count for typewriter
        if (activeNPC.visibleChars < fullLine.length) {
            activeNPC.visibleChars += activeNPC.typingSpeed;
        }

        if (activeNPC.showingChoices) {
            if (keys['1']) applyChoice(activeNPC.choices.options[0]);
            else if (keys['2'] && activeNPC.choices.options[1]) applyChoice(activeNPC.choices.options[1]);
        } else if (keys['e']) {
            keys['e'] = false; 

            // If text is still typing, skip to the end of the line
            if (activeNPC.visibleChars < fullLine.length) {
                activeNPC.visibleChars = fullLine.length;
            } 
            // If line is finished, go to the next one
            else {
                activeNPC.currentLine++;
                activeNPC.visibleChars = 0; // Reset for next line

                if (activeNPC.currentLine >= activeNPC.lines.length) {
                    if (activeNPC.choices && !activeNPC.hasSpoken) {
                        activeNPC.showingChoices = true;
                        activeNPC.currentLine = activeNPC.lines.length - 1;
                        activeNPC.hasSpoken = true;
                    } else {
                        isTalking = false;
                        activeNPC.currentLine = 0;
                        activeNPC.visibleChars = 0;
                        activeNPC = null;
                    }
                }
            }
        }
        drawLevel1();
        requestAnimationFrame(update);
        return; 
    }
    if (isTalking && activeNPC && activeNPC.name === "Boss Knopf") {
    shakeTimer = 10; 
}

    // --- 3. Movement & Input ---
// --- 3. Movement & Dash Input ---
    
    // Check for Dash (using 'Shift' or 'K')
    if (keys['shift'] && player.dashCooldown <= 0 && !player.isDashing) {
        player.isDashing = true;
        player.dashTimer = player.dashDuration;
        player.dashCooldown = player.dashTotalCooldown;
        player.dy = 0; // Freeze vertical movement for a "straight" dash
    }

    if (player.isDashing) {
        // Apply dash speed in the direction they are facing
        player.dx = (player.facing === 'left' ? -1 : 1) * player.dashSpeed;
        player.dashTimer--;
        
        if (player.dashTimer <= 0) {
            player.isDashing = false;
        }
    } else {
        // --- Normal Movement (Only runs if NOT dashing) ---
        if (keys['arrowright'] || keys['d']) {
            player.dx = player.speed;
            player.facing = 'right';
        } else if (keys['arrowleft'] || keys['a']) {
            player.dx = -player.speed;
            player.facing = 'left';
        } else {
            player.dx = 0;
        }
    }

    // Cooldown ticking down
    if (player.dashCooldown > 0) player.dashCooldown--;

    if ((keys['arrowup'] || keys['w'] || keys[' ']) && player.grounded) {
        player.dy = player.jumpPower;
        player.grounded = false;
    }

    // Shooting
    if (keys['q'] && shootTimer <= 0) {
        const dir = player.facing === 'left' ? -1 : 1;
        playerProjectiles.push(new Projectile(player.x + (player.width/2), player.y + (player.height/2), dir));
        shootTimer = 25;
    }
    if (shootTimer > 0) shootTimer--;

    // --- 4. Physics & Camera ---
    player.x += player.dx;
    player.dy += player.gravity;
    player.y += player.dy;

    cameraX = player.x - canvas.width / 2 + player.width / 2;
    if (cameraX < 0) cameraX = 0;
    if (cameraX > WORLD_WIDTH - canvas.width) cameraX = WORLD_WIDTH - canvas.width;

    // --- 5. Collisions ---
    player.grounded = false;
    if (gameState === 'OFFICE' && player.y > WORLD_HEIGHT - player.height) {
        player.y = WORLD_HEIGHT - player.height;
        player.dy = 0;
        player.grounded = true;
    }

    // Interaction Check (Press E to talk)
    npcs.forEach(npc => {
        if (npc.state === gameState) {
            let dist = Math.abs(player.x - npc.x);
            if (dist < UNIT * 1.5 && keys['e']) {
                isTalking = true;
                activeNPC = npc;
                keys['e'] = false; 
            }
        }
    });

    // Vent Entry
    if (keys['e'] && gameState === 'OFFICE' && player.y <= 128 && player.x >= 35 * UNIT && player.x <= 38 * UNIT) {
        gameState = 'VENT';
        player.x = 37 * UNIT;
        player.y = -UNIT * 3; 
    }

    // Platform collisions
    platforms.forEach(p => {
        if (p.hidden && gameState !== 'VENT') return;
        if (!p.solid) return;
        if (player.x + player.width > p.x + 10 && player.x < p.x + p.w - 10) {
            if (player.dy >= 0 && player.y + player.height <= p.y + 15 && player.y + player.height + player.dy >= p.y) {
                player.y = p.y - player.height; player.dy = 0; player.grounded = true;
            }
        }
    });

    // --- 6. Enemies & Projectiles ---
    // --- Updated Enemy/Projectile Loop in update() ---
for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    
    // Only update enemies in the current state
    if (enemy.state === gameState) {
        enemy.update();

        // Check for Projectile Hits
        playerProjectiles.forEach((proj) => {
            if (proj.active && 
                proj.x < enemy.x + enemy.width && 
                proj.x + proj.width > enemy.x && 
                proj.y < enemy.y + enemy.height && 
                proj.y + proj.height > enemy.y) {
                
                enemy.hp--;
                proj.active = false;
                
                if (enemy.hp <= 0) {
                    enemy.alive = false;
                    killsForBurst++;
                    if (killsForBurst >= 3) burstReady = true;
                }
            }
        });
    }
    
    // Remove dead enemies
    if (!enemy.alive) {
        enemies.splice(i, 1);
    }
}

    

    if (burstEffectTimer > 0) burstEffectTimer--;

    drawLevel1();
    requestAnimationFrame(update);
}
// --- 5. EVENT LISTENERS ---

document.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
document.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });
canvas.addEventListener('click', (e) => {
    if (gameState !== 'GAMEOVER') return;

    // Adjust mouse coordinates to match canvas scale
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    // Retry Button Hitbox (Adjust coordinates/size to match your drawing)
    if (mouseX > centerX - 160 && mouseX < centerX - 10 &&
        mouseY > centerY + 100 && mouseY < centerY + 160) {
        resetGame();
    }

    // Menu Button Hitbox
    if (mouseX > centerX + 10 && mouseX < centerX + 160 &&
        mouseY > centerY + 100 && mouseY < centerY + 160) {
        gameOverAlpha = 0;
        gameRunning = false;
        gameState = 'OFFICE'; // Reset state for next time
        backToMain();
    }
});

// Helper to keep code clean
function resetGame() {
    player.health = 100;
    gameOverAlpha = 0;
    setupLevel1();
    gameState = 'OFFICE';
}

// This handles the very first "CLICK TO BEGIN" splash screen
const entryBtn = document.getElementById('entry-button');
if (entryBtn) {
    entryBtn.addEventListener('click', () => {
        if (music) music.play().catch(e => console.log("Music blocked"));
        document.getElementById('splash-screen').style.display = 'none';
        document.getElementById('main-menu').style.display = 'flex';
    });
}