 
const librarySprite = new Image();
librarySprite.src = 'library.png';
const highlibrarySprite = new Image();
highlibrarySprite.src = 'Tall ahh library.png'
const deskSprite = new Image();
deskSprite.src = 'desk.png';



// --- 2. PLATFORMS ---



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
        { x: 74 * UNIT, y: -2 * UNIT, w: 2 * UNIT, h: 2 * UNIT, type: 'level_exit', solid: false, hidden: true }
    );
}
