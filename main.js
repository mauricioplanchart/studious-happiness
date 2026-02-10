import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue
scene.fog = new THREE.Fog(0x87CEEB, 0, 750);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
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

            avatar.position.set(x, 0, z);
            scene.add(avatar);

            return avatar;
        }

        // Create NPC avatars with random colors
        const avatars = [];
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

    }
}

// Controls
const controls = new PointerLockControls(camera, document.body);

// Click to start
const instructions = document.getElementById('instructions');
instructions.addEventListener('click', () => {
    controls.lock();
});

controls.addEventListener('lock', () => {
    instructions.style.display = 'none';
});

controls.addEventListener('unlock', () => {
    instructions.style.display = 'flex';
});

scene.add(controls.getObject());

// Movement
const moveSpeed = 0.1;
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
    if (event.code === 'KeyT' && !isChatFocused && controls.isLocked) {
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
const otherPlayers = new Map();
let localPlayerId = null;
let ws = null;

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

    // Add username label
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    context.fillStyle = 'rgba(0, 0, 0, 0.6)';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.font = 'Bold 20px Arial';
    context.fillStyle = 'white';
    context.textAlign = 'center';
    context.fillText(playerId.substr(0, 6), canvas.width / 2, canvas.height / 2 + 7);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.y = 7;
    sprite.scale.set(4, 1, 1);
    avatar.add(sprite);

    scene.add(avatar);
    return avatar;
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
                    break;

                case 'players':
                    // Add existing players
                    message.players.forEach(player => {
                        if (!otherPlayers.has(player.id)) {
                            const avatar = createPlayerAvatar(player.id, player.color);
                            avatar.position.set(player.position.x, player.position.y, player.position.z);
                            avatar.rotation.y = player.rotation;
                            otherPlayers.set(player.id, avatar);
                        }
                    });
                    break;

                case 'playerJoined':
                    if (!otherPlayers.has(message.player.id)) {
                        const avatar = createPlayerAvatar(message.player.id, message.player.color);
                        avatar.position.set(
                            message.player.position.x,
                            message.player.position.y,
                            message.player.position.z
                        );
                        otherPlayers.set(message.player.id, avatar);
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
                    }
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
                x: camera.position.x,
                y: camera.position.y,
                z: camera.position.z
            },
            rotation: camera.rotation.y
        }));
        lastPositionUpdate = Date.now();
    }
}

// Connect to multiplayer
connectMultiplayer();

// Chat system
const chatContainer = document.getElementById('chatContainer');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const connectionStatus = document.getElementById('connectionStatus');

let isChatFocused = false;

// Show chat when game starts
controls.addEventListener('lock', () => {
    chatContainer.style.display = 'flex';
    connectionStatus.style.display = 'block';
    updateConnectionStatus();
});

controls.addEventListener('unlock', () => {
    chatContainer.style.display = 'none';
    connectionStatus.style.display = 'none';
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

    if (message.playerId === 'system') {
        messageDiv.classList.add('system');
        messageDiv.textContent = message.message;
    } else {
        const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.innerHTML = `
            <span class="username">${message.username}:</span>
            ${escapeHtml(message.message)}
            <span class="timestamp">${time}</span>
        `;
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Keep only last 50 messages
    while (chatMessages.children.length > 50) {
        chatMessages.removeChild(chatMessages.firstChild);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function sendChatMessage() {
    const message = chatInput.value.trim();
    if (message && ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
            type: 'chat',
            username: localPlayerId ? localPlayerId.substr(0, 6) : 'Anonymous',
            message: message
        }));
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

chatInput.addEventListener('focus', () => {
    isChatFocused = true;
});

chatInput.addEventListener('blur', () => {
    isChatFocused = false;
});

// Animation loop
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (controls.isLocked) {
        // Apply gravity
        velocity.y += gravity;

        // Calculate movement direction
        direction.z = Number(keys.forward) - Number(keys.backward);
        direction.x = Number(keys.right) - Number(keys.left);
        direction.normalize();

        // Move the camera
        if (keys.forward || keys.backward) {
            velocity.z = direction.z * moveSpeed;
        } else {
            velocity.z = 0;
        }

        if (keys.left || keys.right) {
            velocity.x = direction.x * moveSpeed;
        } else {
            velocity.x = 0;
        }

        controls.moveRight(velocity.x);
        controls.moveForward(-velocity.z);

        // Update vertical position
        camera.position.y += velocity.y * delta * 10;

        // Ground collision
        if (camera.position.y < 10) {
            camera.position.y = 10;
            velocity.y = 0;
            canJump = true;
        }

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
