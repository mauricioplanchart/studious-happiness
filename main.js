import * as THREE from 'three';

// ============================================
// GLOBAL VARIABLE DECLARATIONS (ALL AT TOP)
// ============================================
let chatContainer = null;
let connectionStatus = null;
let chatInput = null;
let chatMessages = null;
let isChatFocused = false;
let gameStarted = false;
let localPlayer = null;
let otherPlayers = new Map();
let localPlayerId = null;
let selectedPlayer = null;
let desiredPlayerName = '';
let localPlayerName = 'Player';
let nameSent = false;
let ws = null;
let hasInit = false;
let clickableMonitors = [];

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue
scene.fog = new THREE.Fog(0x87CEEB, 0, 750);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a7c59,
    roughness: 0.8,
    metalness: 0.2
});
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Create a simulated browser UI
class BrowserUI {
    constructor(width = 1024, height = 768) {
        this.width = width;
        this.height = height;
        this.currentURL = "https://google.com";
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.magFilter = THREE.LinearFilter;
        this.texture.minFilter = THREE.LinearFilter;
    }

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

        // Browser chrome (top bar)
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, w, 60);

        // Back button
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(10, 10, 35, 40);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('←', 18, 38);

        // Address bar
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.fillRect(55, 10, w - 110, 40);
        ctx.strokeRect(55, 10, w - 110, 40);

        ctx.fillStyle = '#666666';
        ctx.font = '14px Arial';
        ctx.fillText(this.currentURL, 65, 37);

        // Reload button
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(w - 50, 10, 40, 40);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('⟳', w - 42, 36);

        // Tab bar
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 60, w, 30);
        ctx.fillStyle = '#4a90e2';
        ctx.fillRect(10, 60, 100, 30);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.fillText('Google Search', 20, 80);

        // Content area
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 90, w, h - 90);

        // Draw sample content (Google-like search interface)
        ctx.fillStyle = '#4a90e2';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('G', w / 2 - 100, 200);
        ctx.fillStyle = '#ea4335';
        ctx.fillText('o', w / 2 - 40, 200);
        ctx.fillStyle = '#fbbc04';
        ctx.fillText('o', w / 2 + 20, 200);
        ctx.fillStyle = '#4a90e2';
        ctx.fillText('g', w / 2 + 80, 200);
        ctx.fillStyle = '#ea4335';
        ctx.fillText('l', w / 2 + 130, 200);
        ctx.fillStyle = '#30a853';
        ctx.fillText('e', w / 2 + 170, 200);

        // Search box
        ctx.fillStyle = '#f1f3f4';
        ctx.strokeStyle = '#dadce0';
        ctx.lineWidth = 2;
        ctx.fillRect(w / 2 - 200, 270, 400, 50);
        ctx.strokeRect(w / 2 - 200, 270, 400, 50);

        ctx.fillStyle = '#999999';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Search or type URL...', w / 2, 302);

        // Search button
        ctx.fillStyle = '#4a90e2';
        ctx.fillRect(w / 2 - 100, 350, 200, 40);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Google Search', w / 2, 376);

        this.texture.needsUpdate = true;
    }
}

const browserUI = new BrowserUI(1024, 768);
browserUI.draw();

// Browser URL tracking
let currentBrowserURL = "";
let selectedMonitor = null;

// Create browser URL input UI (HTML overlay)
const browserInputHTML = `
    <div id="browserInputOverlay" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
        background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); 
        z-index: 9999; min-width: 400px; font-family: Arial, sans-serif;">
        <h3 style="margin-top: 0; color: #333;">Enter Website URL</h3>
        <input type="text" id="browserURLInput" placeholder="e.g., nytimes.com, google.com, wikipedia.org" 
            style="width: 100%; padding: 10px; border: 2px solid #4a90e2; border-radius: 5px; font-size: 14px; box-sizing: border-box;">
        <div style="margin-top: 15px; display: flex; gap: 10px;">
            <button id="browserLoadBtn" style="flex: 1; padding: 10px; background: #4a90e2; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Load</button>
            <button id="browserCancelBtn" style="flex: 1; padding: 10px; background: #ccc; color: #333; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
        </div>
        <p style="font-size: 12px; color: #999; margin-top: 10px;">Note: Some websites may not load due to security restrictions</p>
    </div>
    <div id="browserIframeContainer" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.5); z-index: 9998;">
        <iframe id="browserIframe" style="width: 100%; height: 100%; border: none; background: white;"></iframe>
    </div>
`;
document.body.insertAdjacentHTML('beforeend', browserInputHTML);

// Browser UI event listeners
document.getElementById('browserLoadBtn').addEventListener('click', () => {
    const url = document.getElementById('browserURLInput').value.trim();
    if (url) {
        loadBrowserURL(url);
    }
});

document.getElementById('browserCancelBtn').addEventListener('click', () => {
    closeBrowserInput();
});

document.getElementById('browserURLInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const url = document.getElementById('browserURLInput').value.trim();
        if (url) loadBrowserURL(url);
    }
});

function openBrowserInput() {
    document.getElementById('browserInputOverlay').style.display = 'block';
    document.getElementById('browserURLInput').focus();
    document.getElementById('browserURLInput').value = '';
}

function closeBrowserInput() {
    document.getElementById('browserInputOverlay').style.display = 'none';
}

function loadBrowserURL(url) {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    // Close input overlay and show iframe
    closeBrowserInput();

    const iframeContainer = document.getElementById('browserIframeContainer');
    const iframe = document.getElementById('browserIframe');

    // Note: This will only work for CORS-enabled websites
    // For security, we'll use an approach that works for more sites
    iframe.src = url;
    iframeContainer.style.display = 'block';

    currentBrowserURL = url;
}

// Close browser iframe when clicking outside
document.getElementById('browserIframeContainer').addEventListener('click', (e) => {
    if (e.target.id === 'browserIframeContainer') {
        document.getElementById('browserIframeContainer').style.display = 'none';
    }
});

// Escape key to close browser
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeBrowserInput();
        document.getElementById('browserIframeContainer').style.display = 'none';
    }
});

// Helper functions for avatar names (moved before use)
function sanitizeName(name) {
    if (!name) return '';
    return name.toString().trim().slice(0, 16);
}

function createNameLabel(name) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'Bold 20px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.fillText(name, canvas.width / 2, canvas.height / 2 + 7);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.y = 7;
    sprite.scale.set(4, 1, 1);

    return { sprite, texture };
}

function setAvatarName(avatar, name) {
    const safeName = sanitizeName(name) || 'Player';
    avatar.userData.displayName = safeName;

    if (avatar.userData.nameLabel) {
        avatar.remove(avatar.userData.nameLabel.sprite);
        avatar.userData.nameLabel.texture.dispose();
    }

    const label = createNameLabel(safeName);
    avatar.add(label.sprite);
    avatar.userData.nameLabel = label;
}

// Create buildings
function createBuilding(x, z, width, height, depth, color) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({
        color: color,
        roughness: 0.7,
        metalness: 0.3
    });
    const building = new THREE.Mesh(geometry, material);
    building.position.set(x, height / 2, z);
    building.castShadow = true;
    building.receiveShadow = true;
    scene.add(building);
    return building;
}

// Build a small city
createBuilding(-30, -30, 15, 25, 15, 0xff6b6b);
createBuilding(30, -30, 12, 30, 12, 0x4ecdc4);
createBuilding(-30, 30, 10, 20, 10, 0xffe66d);
createBuilding(30, 30, 18, 35, 18, 0x95e1d3);
createBuilding(0, -50, 20, 15, 20, 0xf38181);
createBuilding(0, 0, 8, 40, 8, 0xaa96da);
createBuilding(-60, 0, 15, 28, 15, 0xfcbad3);
createBuilding(60, 0, 12, 22, 12, 0xa8d8ea);

// Add some decorative cubes (floating platforms)
for (let i = 0; i < 10; i++) {
    const size = Math.random() * 3 + 2;
    const cube = createBuilding(
        Math.random() * 150 - 75,
        Math.random() * 150 - 75,
        size, size, size,
        Math.random() * 0xffffff
    );
    cube.position.y = size / 2;
}

// Add trees (cylinders + cones)
function createTree(x, z) {
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 2.5, z);
    trunk.castShadow = true;
    scene.add(trunk);

    const leavesGeometry = new THREE.ConeGeometry(3, 8, 8);
    const leavesMaterial = new THREE.MeshStandardMaterial({ color: 0x2d5016 });
    const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
    leaves.position.set(x, 8, z);
    leaves.castShadow = true;
    scene.add(leaves);
}

// Plant some trees
for (let i = 0; i < 20; i++) {
    const x = Math.random() * 200 - 100;
    const z = Math.random() * 200 - 100;
    // Avoid placing trees too close to center
    if (Math.abs(x) > 20 || Math.abs(z) > 20) {
        createTree(x, z);
    }
}

// Create Computer function
function createComputer(x, z) {
    const computer = new THREE.Group();

    // Large Visible Desk - Simple brown rectangle
    const deskGeometry = new THREE.BoxGeometry(12, 1.5, 6);
    const deskMaterial = new THREE.MeshStandardMaterial({ color: 0xCD853F, metalness: 0.3, roughness: 0.7 });
    const desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.y = 0.75;
    desk.castShadow = true;
    desk.receiveShadow = true;
    computer.add(desk);

    // Large Monitor
    const monitorGeometry = new THREE.BoxGeometry(5.5, 4, 0.5);
    const monitorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
    monitor.position.set(0, 3.5, 0);
    monitor.castShadow = true;
    monitor.receiveShadow = true;
    computer.add(monitor);

    // Bright Screen (very visible)
    const screenGeometry = new THREE.BoxGeometry(5, 3.8, 0.4);
    const screenMaterial = new THREE.MeshStandardMaterial({
        map: browserUI.texture,
        emissive: 0x333333,
        emissiveIntensity: 0.2
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 3.5, 0.3);
    screen.castShadow = true;
    screen.userData = { isMonitor: true };
    clickableMonitors.push(screen);
    computer.add(screen);

    // Keyboard
    const keyboardGeometry = new THREE.BoxGeometry(5, 0.4, 2);
    const keyboardMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const keyboard = new THREE.Mesh(keyboardGeometry, keyboardMaterial);
    keyboard.position.set(0, 1.5, 1.5);
    keyboard.castShadow = true;
    computer.add(keyboard);

    // Mouse
    const mouseGeometry = new THREE.BoxGeometry(0.7, 0.4, 1.5);
    const mouseMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const mouse01 = new THREE.Mesh(mouseGeometry, mouseMaterial);
    mouse01.position.set(3.5, 1.6, 2);
    mouse01.castShadow = true;
    computer.add(mouse01);

    computer.position.set(x, 0, z);
    scene.add(computer);
    return computer;
}

// Create a computer in the center of the field
const computer = createComputer(0, 0);

// Add a bright light above the computer desk
const deskLight = new THREE.PointLight(0x00ffff, 2, 50);
deskLight.position.set(0, 10, 0);
deskLight.castShadow = true;
scene.add(deskLight);

// Create White Desktop PC Desk function
function createWhiteDesktop(x, z) {
    const desktop = new THREE.Group();

    // Desk
    const deskGeometry = new THREE.BoxGeometry(8, 1, 3.5);
    const deskMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
    const desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.y = 0.5;
    desk.castShadow = true;
    desk.receiveShadow = true;
    desktop.add(desk);

    // White Desktop PC Tower (on the right side of desk)
    const pcGeometry = new THREE.BoxGeometry(1.5, 3.5, 1);
    const pcMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pc = new THREE.Mesh(pcGeometry, pcMaterial);
    pc.position.set(3, 2.2, 0);
    pc.castShadow = true;
    desktop.add(pc);

    // PC Front Panel (darker)
    const panelGeometry = new THREE.BoxGeometry(1.4, 1.2, 0.15);
    const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(3, 1.3, 0.5);
    panel.castShadow = true;
    desktop.add(panel);

    // Monitor (smaller than first one)
    const monitorGeometry = new THREE.BoxGeometry(4, 3, 0.4);
    const monitorMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
    monitor.position.set(-1.5, 3, 0);
    monitor.castShadow = true;
    desktop.add(monitor);

    // Monitor Screen (blue)
    const screenGeometry = new THREE.BoxGeometry(3.8, 2.8, 0.3);
    const screenMaterial = new THREE.MeshStandardMaterial({
        map: browserUI.texture,
        emissive: 0x1a1a1a,
        emissiveIntensity: 0.2
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(-1.5, 3, 0.25);
    screen.castShadow = true;
    screen.userData = { isMonitor: true };
    clickableMonitors.push(screen);
    desktop.add(screen);

    // Keyboard
    const keyboardGeometry = new THREE.BoxGeometry(4, 0.4, 1.5);
    const keyboardMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const keyboard = new THREE.Mesh(keyboardGeometry, keyboardMaterial);
    keyboard.position.set(-1.5, 1, 1.3);
    keyboard.castShadow = true;
    desktop.add(keyboard);

    // Mouse
    const mouseGeometry = new THREE.BoxGeometry(0.6, 0.4, 1.2);
    const mouseMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd });
    const mouse = new THREE.Mesh(mouseGeometry, mouseMaterial);
    mouse.position.set(0.5, 1.1, 1.6);
    mouse.castShadow = true;
    desktop.add(mouse);

    desktop.position.set(x, 0, z);
    scene.add(desktop);
    return desktop;
}

// Create second desk with white desktop PC
const whiteDesktop = createWhiteDesktop(25, 0);

// Add light above second desk
const desktopLight = new THREE.PointLight(0x0066ff, 2, 50);
desktopLight.position.set(25, 10, 0);
desktopLight.castShadow = true;
scene.add(desktopLight);

// Create Avatar function
function createAvatar(x, z, color) {
    const avatar = new THREE.Group();

    // Body
    const bodyGeometry = new THREE.BoxGeometry(1.5, 2.5, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: color || 0x3498db });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 3.5;
    body.castShadow = true;
    avatar.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 5.6;
    head.castShadow = true;
    avatar.add(head);

    // Left Eye (flat)
    const eyeGeometry = new THREE.CircleGeometry(0.12, 16);
    const eyeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.18, 5.85, 0.6);
    leftEye.castShadow = true;
    avatar.add(leftEye);

    // Left Eye Pupil (flat)
    const pupilGeometry = new THREE.CircleGeometry(0.06, 16);
    const pupilMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
    const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    leftPupil.position.set(-0.18, 5.85, 0.61);
    leftPupil.castShadow = true;
    avatar.add(leftPupil);

    // Right Eye (flat)
    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.18, 5.85, 0.6);
    rightEye.castShadow = true;
    avatar.add(rightEye);

    // Right Eye Pupil (flat)
    const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
    rightPupil.position.set(0.18, 5.85, 0.61);
    rightPupil.castShadow = true;
    avatar.add(rightPupil);

    // Nose (flat)
    const noseGeometry = new THREE.CircleGeometry(0.08, 16);
    const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xf5c299 });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.position.set(0, 5.6, 0.6);
    nose.rotation.z = 0;
    nose.castShadow = true;
    avatar.add(nose);

    // Mouth (flat 2D line)
    const mouthGeometry = new THREE.BoxGeometry(0.25, 0.05, 0.01);
    const mouthMaterial = new THREE.MeshStandardMaterial({ color: 0xff9999 });
    const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
    mouth.position.set(0, 5.35, 0.6);
    mouth.castShadow = true;
    avatar.add(mouth);

    // Left Arm
    const armGeometry = new THREE.BoxGeometry(0.4, 1.8, 0.4);
    const armMaterial = new THREE.MeshStandardMaterial({ color: color || 0x3498db });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-1, 3.5, 0);
    leftArm.castShadow = true;
    avatar.add(leftArm);

    // Right Arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(1, 3.5, 0);
    rightArm.castShadow = true;
    avatar.add(rightArm);

    // Left Hand
    const handGeometry = new THREE.SphereGeometry(0.25, 8, 8);
    const handMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const leftHand = new THREE.Mesh(handGeometry, handMaterial);
    leftHand.position.set(-1, 2.3, 0);
    leftHand.castShadow = true;
    avatar.add(leftHand);

    // Right Hand
    const rightHand = new THREE.Mesh(handGeometry, handMaterial);
    rightHand.position.set(1, 2.3, 0);
    rightHand.castShadow = true;
    avatar.add(rightHand);

    // Left Leg
    const legGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.5, 1.2, 0);
    leftLeg.castShadow = true;
    avatar.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.5, 1.2, 0);
    rightLeg.castShadow = true;
    avatar.add(rightLeg);

    avatar.position.set(x, 0, z);
    scene.add(avatar);

    return avatar;
}

// Create NPC avatars with random colors
const avatars = [];
/*
const avatarColors = [0xe74c3c, 0x3498db, 0x2ecc71, 0xf39c12, 0x9b59b6, 0x1abc9c, 0xe67e22, 0x34495e];

for (let i = 0; i < 8; i++) {
    const x = Math.random() * 160 - 80;
    const z = Math.random() * 160 - 80;
    const color = avatarColors[i % avatarColors.length];

    // Avoid spawning too close to center
    if (Math.abs(x) > 15 || Math.abs(z) > 15) {
        const avatar = createAvatar(x, z, color);
        avatar.userData.speed = Math.random() * 0.02 + 0.01;
        avatar.userData.direction = Math.random() * Math.PI * 2;
        avatars.push(avatar);
    }
}
*/

// Create local player avatar
try {
    localPlayer = createAvatar(0, 30, 0x00ff00); // Green color for local player
    localPlayer.position.y = 0;
    // Don't set name here - do it when game starts
} catch (e) {
    console.error('Error creating local player avatar:', e.message);
}

// Third-person camera controls
let mouseDown = false;
let mouseX = 0;
let mouseY = 0;
let cameraAngleH = 0; // Horizontal angle
let cameraAngleV = 0.3; // Vertical angle (looking down slightly)
const cameraDistance = 15;

// Raycaster for clicking on avatars and objects
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

document.addEventListener('click', (e) => {
    if (!gameStarted || isChatFocused) return;

    // Calculate mouse position in normalized device coordinates
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with monitors first
    const monitorIntersects = raycaster.intersectObjects(clickableMonitors);
    if (monitorIntersects.length > 0) {
        const clickedMonitor = monitorIntersects[0].object;
        if (clickedMonitor.userData.isMonitor) {
            openBrowserInput();
            return;
        }
    }

    // Check for intersections with other players
    const clickableObjects = [];
    otherPlayers.forEach((avatar) => {
        avatar.children.forEach(child => clickableObjects.push(child));
    });

    const intersects = raycaster.intersectObjects(clickableObjects);

    if (intersects.length > 0) {
        // Find which player was clicked
        const clickedObject = intersects[0].object;
        otherPlayers.forEach((avatar, playerId) => {
            if (avatar.children.includes(clickedObject)) {
                selectPlayer(playerId);
            }
        });
    } else {
        deselectPlayer();
    }
});

function selectPlayer(playerId) {
    selectedPlayer = playerId;
    const selectedPlayerIndicator = document.getElementById('selectedPlayerIndicator');
    const chatHeader = document.getElementById('chatHeader');

    const displayName = getPlayerDisplayName(playerId);

    if (selectedPlayer) {
        selectedPlayerIndicator.textContent = 'Private chat with ' + displayName + ' (Click to deselect)';
        selectedPlayerIndicator.style.display = 'block';
        chatHeader.textContent = 'Private Chat with ' + displayName;
        chatHeader.className = 'private';

        selectedPlayerIndicator.onclick = () => {
            deselectPlayer();
        };
    }
}

function deselectPlayer() {
    selectedPlayer = null;
    const selectedPlayerIndicator = document.getElementById('selectedPlayerIndicator');
    const chatHeader = document.getElementById('chatHeader');

    selectedPlayerIndicator.style.display = 'none';
    chatHeader.textContent = 'Global Chat (Click player to private chat)';
    chatHeader.className = '';
}

function getPlayerDisplayName(playerId) {
    if (playerId === localPlayerId) {
        return localPlayerName || 'Player';
    }
    const avatar = otherPlayers.get(playerId);
    if (avatar && avatar.userData.displayName) {
        return avatar.userData.displayName;
    }
    return playerId.substr(0, 6);
}

document.addEventListener('mousedown', (e) => {
    if (!isChatFocused && gameStarted) {
        mouseDown = true;
    }
});

document.addEventListener('mouseup', () => {
    mouseDown = false;
});

document.addEventListener('mousemove', (e) => {
    if (mouseDown && gameStarted) {
        cameraAngleH -= e.movementX * 0.002;
        cameraAngleV = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, cameraAngleV - e.movementY * 0.002));
    }
});

// Click to start - MINIMAL VERSION

function initStartButton() {
    console.log('=== Button Init ===');

    const startScreen = document.getElementById('startScreen');
    const enterBtn = document.getElementById('enterBtn');
    const playerName = document.getElementById('playerName');

    if (!enterBtn) {
        console.error('Button not found!');
        return;
    }

    enterBtn.addEventListener('click', function (e) {
        console.log('Button clicked!');
        e.preventDefault();

        try {
            // Hide screen
            if (startScreen) startScreen.style.display = 'none';

            // Get name
            const name = (playerName && playerName.value) ? playerName.value.trim() : 'Player';
            console.log('Name entered:', name);

            // Set name on avatar
            if (localPlayer && name) {
                localPlayerName = name;
                if (setAvatarName && typeof setAvatarName === 'function') {
                    try {
                        setAvatarName(localPlayer, name);
                        console.log('Avatar name set to:', name);
                    } catch (err) {
                        console.error('Error setting avatar name:', err.message);
                    }
                }
            }

            // Start game
            gameStarted = true;
            console.log('gameStarted = true');

            // Show UI after a tiny delay to let things settle
            setTimeout(function () {
                if (chatContainer) chatContainer.style.display = 'flex';
                if (connectionStatus) connectionStatus.style.display = 'block';
                console.log('UI shown');
            }, 100);

            console.log('SUCCESS - Game started!');
        } catch (err) {
            console.error('Error:', err.message);
        }
    });

    console.log('Button ready');
}

// Movement
const moveSpeed = 0.3;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

const keys = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false
};

window.addEventListener('keydown', (event) => {
    // T key to focus chat
    if (event.code === 'KeyT' && !isChatFocused && gameStarted) {
        event.preventDefault();
        chatInput.focus();
        return;
    }

    // Don't process movement keys when chat is focused
    if (isChatFocused) {
        return;
    }

    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            keys.forward = true;
            break;
        case 'KeyS':
        case 'ArrowDown':
            keys.backward = true;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.left = true;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keys.right = true;
            break;
        case 'Space':
            if (canJump) {
                velocity.y = 15;
                canJump = false;
            }
            break;
    }
});

window.addEventListener('keyup', (event) => {
    switch (event.code) {
        case 'KeyW':
        case 'ArrowUp':
            keys.forward = false;
            break;
        case 'KeyS':
        case 'ArrowDown':
            keys.backward = false;
            break;
        case 'KeyA':
        case 'ArrowLeft':
            keys.left = false;
            break;
        case 'KeyD':
        case 'ArrowRight':
            keys.right = false;
            break;
    }
});

let canJump = true;
const gravity = -0.5;

// Multiplayer setup
const speechBubbleTimeouts = new Map();
const typingTimeouts = new Map();

function createSpeechBubble(text) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const padding = 12;
    const fontSize = 20;

    context.font = `Bold ${fontSize}px Arial`;
    const textMetrics = context.measureText(text);
    const textWidth = Math.max(60, Math.ceil(textMetrics.width));

    canvas.width = textWidth + padding * 2;
    canvas.height = fontSize + padding * 2;

    context.font = `Bold ${fontSize}px Arial`;
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    context.lineWidth = 2;

    const radius = 10;
    context.beginPath();
    context.moveTo(radius, 0);
    context.lineTo(canvas.width - radius, 0);
    context.quadraticCurveTo(canvas.width, 0, canvas.width, radius);
    context.lineTo(canvas.width, canvas.height - radius);
    context.quadraticCurveTo(canvas.width, canvas.height, canvas.width - radius, canvas.height);
    context.lineTo(radius, canvas.height);
    context.quadraticCurveTo(0, canvas.height, 0, canvas.height - radius);
    context.lineTo(0, radius);
    context.quadraticCurveTo(0, 0, radius, 0);
    context.closePath();
    context.fill();
    context.stroke();

    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture, depthTest: false });
    const sprite = new THREE.Sprite(spriteMaterial);
    const scale = 0.03;
    sprite.scale.set(canvas.width * scale, canvas.height * scale, 1);
    sprite.position.y = 8.5;

    return { sprite, texture };
}

function showSpeechBubble(playerId, message) {
    if (!message) return;

    const avatar = playerId === localPlayerId ? localPlayer : otherPlayers.get(playerId);
    if (!avatar) return;

    const text = message.length > 60 ? `${message.slice(0, 57)}...` : message;

    if (avatar.userData.speechBubble) {
        const { sprite, texture } = avatar.userData.speechBubble;
        if (texture) {
            texture.dispose();
        }
        const updated = createSpeechBubble(text);
        sprite.material.map = updated.texture;
        sprite.material.needsUpdate = true;
        sprite.scale.copy(updated.sprite.scale);
        avatar.userData.speechBubble.texture = updated.texture;
    } else {
        const bubble = createSpeechBubble(text);
        avatar.add(bubble.sprite);
        avatar.userData.speechBubble = bubble;
    }

    if (speechBubbleTimeouts.has(playerId)) {
        clearTimeout(speechBubbleTimeouts.get(playerId));
    }

    const timeoutId = setTimeout(() => {
        if (avatar.userData.speechBubble) {
            avatar.remove(avatar.userData.speechBubble.sprite);
            avatar.userData.speechBubble.texture.dispose();
            avatar.userData.speechBubble = null;
        }
        speechBubbleTimeouts.delete(playerId);
    }, 4000);

    speechBubbleTimeouts.set(playerId, timeoutId);
}

function showTypingIndicator(playerId, isTyping) {
    const avatar = playerId === localPlayerId ? localPlayer : otherPlayers.get(playerId);
    if (!avatar) return;

    if (isTyping) {
        if (!avatar.userData.typingBubble) {
            const bubble = createSpeechBubble('typing...');
            bubble.sprite.position.y = 10.5;
            avatar.add(bubble.sprite);
            avatar.userData.typingBubble = bubble;
        }
    } else if (avatar.userData.typingBubble) {
        avatar.remove(avatar.userData.typingBubble.sprite);
        avatar.userData.typingBubble.texture.dispose();
        avatar.userData.typingBubble = null;
    }
}

// Create avatar for other players
function createPlayerAvatar(playerId, color) {
    const avatar = new THREE.Group();
    avatar.userData.playerId = playerId;

    // Body
    const bodyGeometry = new THREE.BoxGeometry(1.5, 2.5, 0.8);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: color || 0x3498db });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 3.5;
    body.castShadow = true;
    avatar.add(body);

    // Head
    const headGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 5.6;
    head.castShadow = true;
    avatar.add(head);

    // Left Arm
    const armGeometry = new THREE.BoxGeometry(0.4, 1.8, 0.4);
    const armMaterial = new THREE.MeshStandardMaterial({ color: color || 0x3498db });
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-1, 3.5, 0);
    leftArm.castShadow = true;
    avatar.add(leftArm);

    // Right Arm
    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(1, 3.5, 0);
    rightArm.castShadow = true;
    avatar.add(rightArm);

    // Left Leg
    const legGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x2c3e50 });
    const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
    leftLeg.position.set(-0.5, 1.2, 0);
    leftLeg.castShadow = true;
    avatar.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
    rightLeg.position.set(0.5, 1.2, 0);
    rightLeg.castShadow = true;
    avatar.add(rightLeg);

    setAvatarName(avatar, playerId.substr(0, 6));

    scene.add(avatar);
    return avatar;
}

function applyLocalName() {
    if (!hasInit || !ws || ws.readyState !== WebSocket.OPEN || nameSent) {
        return;
    }
    const fallbackName = localPlayerId ? `Player ${localPlayerId.substr(0, 6)}` : 'Player';
    const selectedName = sanitizeName(desiredPlayerName) || fallbackName;
    localPlayerName = selectedName;
    setAvatarName(localPlayer, localPlayerName);
    ws.send(JSON.stringify({
        type: 'setName',
        name: localPlayerName
    }));
    nameSent = true;
}

// Connect to WebSocket server
function connectMultiplayer() {
    try {
        const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';
        console.log('Connecting to WebSocket:', wsUrl);
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('Connected to multiplayer server');
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);

            switch (message.type) {
                case 'init':
                    localPlayerId = message.playerId;
                    console.log('My player ID:', localPlayerId);
                    hasInit = true;
                    applyLocalName();
                    break;

                case 'players':
                    // Add existing players
                    message.players.forEach(player => {
                        if (!otherPlayers.has(player.id)) {
                            const avatar = createPlayerAvatar(player.id, player.color);
                            setAvatarName(avatar, player.name || player.id.substr(0, 6));
                            avatar.position.set(player.position.x, player.position.y, player.position.z);
                            avatar.rotation.y = player.rotation;
                            otherPlayers.set(player.id, avatar);
                        }
                    });
                    break;

                case 'playerJoined':
                    if (!otherPlayers.has(message.player.id)) {
                        const avatar = createPlayerAvatar(message.player.id, message.player.color);
                        setAvatarName(avatar, message.player.name || message.player.id.substr(0, 6));
                        avatar.position.set(
                            message.player.position.x,
                            message.player.position.y,
                            message.player.position.z
                        );
                        otherPlayers.set(message.player.id, avatar);
                    }
                    break;

                case 'playerUpdated':
                    const updatedPlayer = otherPlayers.get(message.playerId);
                    if (updatedPlayer) {
                        setAvatarName(updatedPlayer, message.name || message.playerId.substr(0, 6));
                    }
                    break;

                case 'playerMoved':
                    const player = otherPlayers.get(message.playerId);
                    if (player) {
                        player.position.set(
                            message.position.x,
                            message.position.y,
                            message.position.z
                        );
                        player.rotation.y = message.rotation;
                    }
                    break;

                case 'playerLeft':
                    const leftPlayer = otherPlayers.get(message.playerId);
                    if (leftPlayer) {
                        scene.remove(leftPlayer);
                        otherPlayers.delete(message.playerId);
                        if (selectedPlayer === message.playerId) {
                            deselectPlayer();
                        }
                    }
                    break;

                case 'typing':
                    if (message.playerId) {
                        showTypingIndicator(message.playerId, message.isTyping);
                    }
                    break;

                case 'reaction':
                    addReactionMessage(message);
                    break;

                case 'chat':
                    addChatMessage(message);
                    break;
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };

        ws.onclose = () => {
            console.log('Disconnected from multiplayer server');
            setTimeout(connectMultiplayer, 3000); // Try to reconnect
        };
    } catch (error) {
        console.error('Failed to connect to multiplayer server:', error);
    }
}

// Send position updates
let lastPositionUpdate = 0;
function sendPositionUpdate() {
    if (ws && ws.readyState === WebSocket.OPEN && Date.now() - lastPositionUpdate > 50) {
        ws.send(JSON.stringify({
            type: 'position',
            position: {
                x: localPlayer.position.x,
                y: localPlayer.position.y,
                z: localPlayer.position.z
            },
            rotation: localPlayer.rotation.y
        }));
        lastPositionUpdate = Date.now();
    }
}

// Connect to multiplayer
connectMultiplayer();

// Chat system
chatContainer = document.getElementById('chatContainer');
chatMessages = document.getElementById('chatMessages');
chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
connectionStatus = document.getElementById('connectionStatus');
const chatTabs = document.querySelectorAll('.chatTab');
const reactionButtons = document.querySelectorAll('.reactionBtn');

let currentChatTab = 'global';
let isTyping = false;
let typingTimer = null;

function applyChatFilter() {
    const items = Array.from(chatMessages.children);
    items.forEach((item) => {
        const isPrivate = item.dataset.private === 'true';
        const isSystem = item.dataset.system === 'true';
        if (currentChatTab === 'private') {
            item.style.display = isPrivate ? 'block' : 'none';
        } else {
            item.style.display = isSystem || !isPrivate ? 'block' : 'none';
        }
    });
}

chatTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        chatTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        currentChatTab = tab.dataset.tab;
        applyChatFilter();
    });
});

reactionButtons.forEach((button) => {
    button.addEventListener('click', () => {
        if (!ws || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({
            type: 'reaction',
            reaction: button.dataset.reaction
        }));
    });
});

function updateConnectionStatus() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        connectionStatus.textContent = `🟢 Connected (${otherPlayers.size} online)`;
        connectionStatus.className = 'connected';
    } else {
        connectionStatus.textContent = '🔴 Disconnected';
        connectionStatus.className = 'disconnected';
    }
}

// Update connection status periodically
setInterval(updateConnectionStatus, 2000);

function addChatMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chatMessage';
    messageDiv.dataset.private = message.private ? 'true' : 'false';
    messageDiv.dataset.system = message.playerId === 'system' ? 'true' : 'false';

    if (message.private) {
        messageDiv.classList.add('private');
    }

    if (message.playerId === 'system') {
        messageDiv.classList.add('system');
        messageDiv.textContent = message.message;
    } else {
        const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        const privateLabel = message.private ? '<strong>[Private]</strong> ' : '';

        messageDiv.innerHTML = `
            ${privateLabel}<span class="username">${message.username}:</span>
            ${escapeHtml(message.message)}
            <span class="timestamp">${time}</span>
        `;
    }

    if (message.playerId && message.playerId !== 'system') {
        showSpeechBubble(message.playerId, message.message);
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    applyChatFilter();

    while (chatMessages.children.length > 50) {
        chatMessages.removeChild(chatMessages.firstChild);
    }
}

function addReactionMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chatMessage';
    messageDiv.dataset.private = 'false';
    messageDiv.dataset.system = 'false';

    const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    messageDiv.innerHTML = `
        <span class="username">${message.username}:</span>
        ${escapeHtml(message.reaction)}
        <span class="timestamp">${time}</span>
    `;

    if (message.playerId) {
        showSpeechBubble(message.playerId, message.reaction);
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    applyChatFilter();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sendChatMessage() {
    const message = chatInput.value.trim();
    if (message && ws && ws.readyState === WebSocket.OPEN) {
        const chatData = {
            type: 'chat',
            username: localPlayerId ? localPlayerId.substr(0, 6) : 'Anonymous',
            message: message
        };

        // If a player is selected, send private message
        if (selectedPlayer) {
            chatData.private = true;
            chatData.toPlayerId = selectedPlayer;
        }

        ws.send(JSON.stringify(chatData));
        if (isTyping) {
            ws.send(JSON.stringify({ type: 'typing', isTyping: false }));
            isTyping = false;
        }
        if (typingTimer) {
            clearTimeout(typingTimer);
            typingTimer = null;
        }
        if (localPlayerId) {
            showSpeechBubble(localPlayerId, message);
        }
        chatInput.value = '';
    }
}

chatSend.addEventListener('click', sendChatMessage);

chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        sendChatMessage();
    }
    // Prevent movement when typing
    e.stopPropagation();
});

chatInput.addEventListener('input', () => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!isTyping) {
        ws.send(JSON.stringify({ type: 'typing', isTyping: true }));
        isTyping = true;
    }
    if (typingTimer) {
        clearTimeout(typingTimer);
    }
    typingTimer = setTimeout(() => {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'typing', isTyping: false }));
        }
        isTyping = false;
        typingTimer = null;
    }, 1500);
});

chatInput.addEventListener('focus', () => {
    isChatFocused = true;
});

chatInput.addEventListener('blur', () => {
    isChatFocused = false;
    if (ws && ws.readyState === WebSocket.OPEN && isTyping) {
        ws.send(JSON.stringify({ type: 'typing', isTyping: false }));
    }
    isTyping = false;
    if (typingTimer) {
        clearTimeout(typingTimer);
        typingTimer = null;
    }
});

// Animation loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (gameStarted) {
        // Apply gravity
        velocity.y += gravity;

        // Calculate movement direction based on camera angle
        direction.z = Number(keys.forward) - Number(keys.backward);
        direction.x = Number(keys.right) - Number(keys.left);
        direction.normalize();

        // Move the player avatar
        if (keys.forward || keys.backward || keys.left || keys.right) {
            const moveX = (direction.x * Math.cos(cameraAngleH) - direction.z * Math.sin(cameraAngleH)) * moveSpeed;
            const moveZ = (direction.x * Math.sin(cameraAngleH) + direction.z * Math.cos(cameraAngleH)) * moveSpeed;

            localPlayer.position.x += moveX;
            localPlayer.position.z += moveZ;

            // Rotate player to face movement direction if moving
            if (Math.abs(moveX) > 0.01 || Math.abs(moveZ) > 0.01) {
                localPlayer.rotation.y = Math.atan2(moveX, moveZ);
            }
        }

        // Update vertical position
        localPlayer.position.y += velocity.y * delta * 10;

        // Ground collision
        if (localPlayer.position.y < 0) {
            localPlayer.position.y = 0;
            velocity.y = 0;
            canJump = true;
        }

        // Update camera to follow player (third-person)
        const idealOffset = new THREE.Vector3(
            Math.sin(cameraAngleH) * Math.cos(cameraAngleV) * cameraDistance,
            Math.sin(cameraAngleV) * cameraDistance + 10,
            Math.cos(cameraAngleH) * Math.cos(cameraAngleV) * cameraDistance
        );

        camera.position.x = localPlayer.position.x + idealOffset.x;
        camera.position.y = localPlayer.position.y + idealOffset.y;
        camera.position.z = localPlayer.position.z + idealOffset.z;
        camera.lookAt(localPlayer.position.x, localPlayer.position.y + 5, localPlayer.position.z);

        // Send position update to server
        sendPositionUpdate();
    }

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();

// Initialize start button after everything is set up
console.log('Script loaded, waiting for safe initialization');

function safeInit() {
    try {
        console.log('Safe init running');
        initStartButton();
    } catch (e) {
        console.error('Error in safe init:', e.message);
        setTimeout(safeInit, 100); // Retry
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeInit);
} else {
    setTimeout(safeInit, 100);
}
