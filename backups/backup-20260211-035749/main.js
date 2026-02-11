import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

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
let clickableProducts = [];

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue
scene.fog = new THREE.Fog(0x87CEEB, 0, 750);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 20);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.domElement.style.position = 'absolute';
renderer.domElement.style.top = '0';
renderer.domElement.style.pointerEvents = 'none';
document.body.appendChild(renderer.domElement);

// CSS3D Renderer for real website iframes
const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(window.innerWidth, window.innerHeight);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
document.body.appendChild(cssRenderer.domElement);

// Store CSS3D objects for monitors
const monitorIframes = new Map();

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

// Simple grass ground with basic texture
const grassCanvas = document.createElement('canvas');
grassCanvas.width = 256;
grassCanvas.height = 256;
const grassCtx = grassCanvas.getContext('2d');

// Base grass color
grassCtx.fillStyle = '#4a7c59';
grassCtx.fillRect(0, 0, 256, 256);

// Simple color variation
const grassColors = ['#3a6b3a', '#4a7c59', '#527d52'];
for (let i = 0; i < 1000; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const color = grassColors[Math.floor(Math.random() * grassColors.length)];
    grassCtx.fillStyle = color;
    grassCtx.fillRect(x, y, 3 + Math.random() * 3, 3 + Math.random() * 3);
}

const grassTexture = new THREE.CanvasTexture(grassCanvas);
grassTexture.wrapS = THREE.RepeatWrapping;
grassTexture.wrapT = THREE.RepeatWrapping;
grassTexture.repeat.set(30, 30);

// Ground
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const groundMaterial = new THREE.MeshStandardMaterial({
    map: grassTexture,
    roughness: 0.9,
    metalness: 0.0
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
        this.currentSite = "google";
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.magFilter = THREE.LinearFilter;
        this.texture.minFilter = THREE.LinearFilter;
    }

    loadURL(url) {
        this.currentURL = url;

        // Detect website type from URL
        const urlLower = url.toLowerCase();
        if (urlLower.includes('google')) {
            this.currentSite = 'google';
        } else if (urlLower.includes('youtube')) {
            this.currentSite = 'youtube';
        } else if (urlLower.includes('wikipedia')) {
            this.currentSite = 'wikipedia';
        } else if (urlLower.includes('github')) {
            this.currentSite = 'github';
        } else if (urlLower.includes('twitter') || urlLower.includes('x.com')) {
            this.currentSite = 'twitter';
        } else if (urlLower.includes('reddit')) {
            this.currentSite = 'reddit';
        } else if (urlLower.includes('amazon')) {
            this.currentSite = 'amazon';
        } else {
            this.currentSite = 'generic';
        }

        this.draw();
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
        ctx.textAlign = 'left';
        ctx.fillText(this.currentURL, 65, 37);

        // Reload button
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(w - 50, 10, 40, 40);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('⟳', w - 42, 36);

        // Content area
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 60, w, h - 60);

        // Draw site-specific content
        this.drawSiteContent();

        this.texture.needsUpdate = true;
    }

    drawSiteContent() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        ctx.textAlign = 'center';

        switch (this.currentSite) {
            case 'google':
                // Google logo
                ctx.fillStyle = '#4a90e2';
                ctx.font = 'bold 72px Arial';
                ctx.fillText('G', w / 2 - 150, 200);
                ctx.fillStyle = '#ea4335';
                ctx.fillText('o', w / 2 - 60, 200);
                ctx.fillStyle = '#fbbc04';
                ctx.fillText('o', w / 2 + 30, 200);
                ctx.fillStyle = '#4a90e2';
                ctx.fillText('g', w / 2 + 120, 200);
                ctx.fillStyle = '#ea4335';
                ctx.fillText('l', w / 2 + 195, 200);
                ctx.fillStyle = '#34a853';
                ctx.fillText('e', w / 2 + 255, 200);

                // Search box
                ctx.fillStyle = '#f1f3f4';
                ctx.strokeStyle = '#dadce0';
                ctx.lineWidth = 2;
                ctx.fillRect(w / 2 - 250, 300, 500, 50);
                ctx.strokeRect(w / 2 - 250, 300, 500, 50);
                ctx.fillStyle = '#999999';
                ctx.font = '18px Arial';
                ctx.fillText('Search Google...', w / 2, 332);
                break;

            case 'youtube':
                // YouTube style
                ctx.fillStyle = '#ff0000';
                ctx.fillRect(w / 2 - 100, 100, 200, 140);
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.moveTo(w / 2 - 30, 140);
                ctx.lineTo(w / 2 + 40, 170);
                ctx.lineTo(w / 2 - 30, 200);
                ctx.closePath();
                ctx.fill();

                ctx.fillStyle = '#000000';
                ctx.font = 'bold 48px Arial';
                ctx.fillText('YouTube', w / 2, 310);

                // Video thumbnails simulation
                for (let i = 0; i < 6; i++) {
                    const x = (i % 3) * 320 + 50;
                    const y = Math.floor(i / 3) * 200 + 380;
                    ctx.fillStyle = '#e0e0e0';
                    ctx.fillRect(x, y, 280, 160);
                    ctx.fillStyle = '#666666';
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText('Video Title', x + 10, y + 185);
                }
                break;

            case 'wikipedia':
                // Wikipedia logo style
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 64px serif';
                ctx.fillText('W', w / 2, 180);

                ctx.font = 'bold 48px serif';
                ctx.fillText('WIKIPEDIA', w / 2, 250);

                ctx.font = '20px serif';
                ctx.fillStyle = '#666666';
                ctx.fillText('The Free Encyclopedia', w / 2, 290);

                // Search box
                ctx.fillStyle = '#ffffff';
                ctx.strokeStyle = '#a2a9b1';
                ctx.lineWidth = 2;
                ctx.fillRect(w / 2 - 250, 350, 500, 50);
                ctx.strokeRect(w / 2 - 250, 350, 500, 50);

                // Article simulation
                ctx.textAlign = 'left';
                ctx.fillStyle = '#000000';
                ctx.font = '16px serif';
                const lines = ['Featured Article', '', 'Lorem ipsum dolor sit amet, consectetur', 'adipiscing elit. Sed do eiusmod tempor', 'incididunt ut labore et dolore magna.'];
                lines.forEach((line, i) => {
                    ctx.fillText(line, 100, 450 + i * 30);
                });
                break;

            case 'github':
                // GitHub style
                ctx.fillStyle = '#24292e';
                ctx.fillRect(0, 60, w, 60);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 32px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('GitHub', 40, 100);

                // Repository simulation
                ctx.fillStyle = '#0366d6';
                ctx.font = 'bold 28px Arial';
                ctx.fillText('user/repository', 100, 200);

                ctx.fillStyle = '#586069';
                ctx.font = '18px Arial';
                ctx.fillText('Public repository', 100, 240);

                // Code area
                ctx.fillStyle = '#f6f8fa';
                ctx.fillRect(80, 280, w - 160, 300);
                ctx.fillStyle = '#24292e';
                ctx.font = '16px monospace';
                const codeLines = ['README.md', 'src/', 'package.json', 'index.html', 'main.js'];
                codeLines.forEach((line, i) => {
                    ctx.fillText(line, 100, 320 + i * 40);
                });
                break;

            case 'twitter':
                // Twitter/X style
                ctx.fillStyle = '#1da1f2';
                ctx.fillRect(0, 60, w, 60);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 42px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('X', w / 2, 105);

                // Tweet simulation
                for (let i = 0; i < 4; i++) {
                    const y = 180 + i * 140;
                    ctx.fillStyle = '#f7f9fa';
                    ctx.fillRect(100, y, w - 200, 120);
                    ctx.fillStyle = '#14171a';
                    ctx.font = 'bold 18px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText('@username', 120, y + 30);
                    ctx.font = '16px Arial';
                    ctx.fillStyle = '#657786';
                    ctx.fillText('Tweet content goes here...', 120, y + 60);
                    ctx.fillText('This is a sample tweet', 120, y + 85);
                }
                break;

            case 'reddit':
                // Reddit style
                ctx.fillStyle = '#ff4500';
                ctx.fillRect(0, 60, w, 60);
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 36px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('reddit', 40, 105);

                // Posts simulation
                for (let i = 0; i < 5; i++) {
                    const y = 180 + i * 110;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(50, y, w - 100, 100);
                    ctx.strokeStyle = '#ccc';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(50, y, w - 100, 100);

                    ctx.fillStyle = '#1c1c1c';
                    ctx.font = 'bold 18px Arial';
                    ctx.fillText('Post title ' + (i + 1), 70, y + 30);
                    ctx.font = '14px Arial';
                    ctx.fillStyle = '#787c7e';
                    ctx.fillText('r/subreddit • Posted by u/user', 70, y + 55);
                }
                break;

            case 'amazon':
                // Amazon style
                ctx.fillStyle = '#232f3e';
                ctx.fillRect(0, 60, w, 60);
                ctx.fillStyle = '#ff9900';
                ctx.font = 'bold 36px Arial';
                ctx.textAlign = 'left';
                ctx.fillText('amazon', 40, 105);

                // Product grid simulation
                for (let i = 0; i < 6; i++) {
                    const x = (i % 3) * 320 + 50;
                    const y = Math.floor(i / 3) * 280 + 180;
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x, y, 280, 250);
                    ctx.strokeStyle = '#ddd';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x, y, 280, 250);

                    ctx.fillStyle = '#e0e0e0';
                    ctx.fillRect(x + 20, y + 20, 240, 160);
                    ctx.fillStyle = '#000000';
                    ctx.font = '14px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText('Product Name', x + 20, y + 200);
                    ctx.fillStyle = '#b12704';
                    ctx.font = 'bold 18px Arial';
                    ctx.fillText('$99.99', x + 20, y + 230);
                }
                break;

            default:
                // Generic website
                ctx.fillStyle = '#333333';
                ctx.font = 'bold 48px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Website Loaded', w / 2, 250);
                ctx.font = '24px Arial';
                ctx.fillStyle = '#666666';
                ctx.fillText(this.currentURL, w / 2, 320);
                ctx.font = '18px Arial';
                ctx.fillText('Click another monitor or enter new URL', w / 2, 400);
                break;
        }
    }
}

// Create separate browser UI for each monitor
const monitorBrowsers = new Map();

// CSS3D Scene for iframes
const cssScene = new THREE.Scene();

// Product data
const productData = [
    {
        name: 'Laptop Gaming',
        price: '$999',
        description: 'Laptop potente para gamers con RTX 4060',
        image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400',
        buyLink: 'https://wa.me/1234567890?text=Quiero%20comprar%20Laptop%20Gaming'
    },
    {
        name: 'Audífonos Bluetooth',
        price: '$149',
        description: 'Audífonos inalámbricos con cancelación de ruido',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        buyLink: 'https://wa.me/1234567890?text=Quiero%20comprar%20Audífonos'
    },
    {
        name: 'Smartwatch Pro',
        price: '$299',
        description: 'Reloj inteligente con monitor de salud',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
        buyLink: 'https://wa.me/1234567890?text=Quiero%20comprar%20Smartwatch'
    },
    {
        name: 'Cámara 4K',
        price: '$599',
        description: 'Cámara profesional para contenido',
        image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400',
        buyLink: 'https://wa.me/1234567890?text=Quiero%20comprar%20Cámara%204K'
    },
    {
        name: 'Tablet Pro',
        price: '$449',
        description: 'Tablet de alta gama para diseño',
        image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
        buyLink: 'https://wa.me/1234567890?text=Quiero%20comprar%20Tablet%20Pro'
    },
    {
        name: 'Teclado Mecánico',
        price: '$179',
        description: 'Teclado RGB para gaming',
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
        buyLink: 'https://wa.me/1234567890?text=Quiero%20comprar%20Teclado'
    },
    {
        name: 'Mouse Gamer',
        price: '$89',
        description: 'Mouse de alta precisión',
        image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=400',
        buyLink: 'https://wa.me/1234567890?text=Quiero%20comprar%20Mouse%20Gamer'
    },
    {
        name: 'Consola Next-Gen',
        price: '$499',
        description: 'Consola de última generación',
        image: 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=400',
        buyLink: 'https://wa.me/1234567890?text=Quiero%20comprar%20Consola'
    }
];

// Browser URL tracking
let selectedMonitor = null;

// Create browser URL input UI (HTML overlay)
const browserInputHTML = `
    <div id="browserInputOverlay" style="display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
        background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); 
        z-index: 9999; min-width: 400px; font-family: Arial, sans-serif;">
        <h3 style="margin-top: 0; color: #333;">Enter Website URL</h3>
        <input type="text" id="browserURLInput" placeholder="e.g., google.com, youtube.com, wikipedia.org" 
            style="width: 100%; padding: 10px; border: 2px solid #4a90e2; border-radius: 5px; font-size: 14px; box-sizing: border-box;">
        <div style="margin-top: 15px; display: flex; gap: 10px;">
            <button id="browserLoadBtn" style="flex: 1; padding: 10px; background: #4a90e2; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Load on Monitor</button>
            <button id="browserCancelBtn" style="flex: 1; padding: 10px; background: #ccc; color: #333; border: none; border-radius: 5px; cursor: pointer;">Cancel</button>
        </div>
        <p style="font-size: 12px; color: #999; margin-top: 10px;">Try: google, youtube, wikipedia, github, twitter, reddit, amazon</p>
    </div>
    
    <div id="productModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; ">
        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px; border-radius: 20px; box-shadow: 0 10px 50px rgba(0,0,0,0.5); max-width: 500px; width: 90%;">
            <button id="closeProductModal" style="position: absolute; top: 15px; right: 15px; background: #ff4444; color: white; border: none; width: 35px; height: 35px; border-radius: 50%; cursor: pointer; font-size: 20px; font-weight: bold;">×</button>
            <img id="productImage" src="" style="width: 100%; height: 250px; object-fit: cover; border-radius: 10px; margin-bottom: 20px;">
            <h2 id="productName" style="margin: 0 0 10px 0; color: #333; font-size: 28px;"></h2>
            <p id="productPrice" style="font-size: 32px; color: #FF6B35; font-weight: bold; margin: 10px 0;"></p>
            <p id="productDescription" style="color: #666; font-size: 16px; line-height: 1.6; margin: 15px 0;"></p>
            <button id="buyProductBtn" style="width: 100%; padding: 15px; background: linear-gradient(45deg, #25D366, #128C7E); color: white; border: none; border-radius: 10px; font-size: 18px; font-weight: bold; cursor: pointer; margin-top: 20px; transition: transform 0.2s;">💬 Comprar por WhatsApp</button>
        </div>
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

function openBrowserInput(monitor) {
    selectedMonitor = monitor;
    document.getElementById('browserInputOverlay').style.display = 'block';
    document.getElementById('browserURLInput').focus();

    // Show current URL if monitor has one
    const iframe = monitorIframes.get(monitor);
    if (iframe && iframe.element) {
        try {
            const currentUrl = iframe.element.src.replace('https://', '').replace('http://', '');
            document.getElementById('browserURLInput').value = currentUrl;
        } catch (e) {
            document.getElementById('browserURLInput').value = '';
        }
    } else {
        document.getElementById('browserURLInput').value = '';
    }
}

function closeBrowserInput() {
    document.getElementById('browserInputOverlay').style.display = 'none';
    selectedMonitor = null;
}

function loadBrowserURL(url) {
    if (!selectedMonitor) return;

    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }

    // Create or update iframe for this monitor
    let css3DObject = monitorIframes.get(selectedMonitor);

    if (!css3DObject) {
        // Create new iframe
        const iframe = document.createElement('iframe');
        iframe.style.width = '1920px';
        iframe.style.height = '1440px';
        iframe.style.border = 'none';
        iframe.style.background = '#ffffff';
        iframe.src = url;

        // Create CSS3D object
        css3DObject = new CSS3DObject(iframe);

        // Position it at the monitor location
        const monitorWorldPos = new THREE.Vector3();
        selectedMonitor.getWorldPosition(monitorWorldPos);

        const monitorWorldQuat = new THREE.Quaternion();
        selectedMonitor.getWorldQuaternion(monitorWorldQuat);

        css3DObject.position.copy(monitorWorldPos);
        css3DObject.quaternion.copy(monitorWorldQuat);

        // Scale to match monitor size
        const scale = 0.004; // Adjust this to fit monitor
        css3DObject.scale.set(scale, scale, scale);

        cssScene.add(css3DObject);
        monitorIframes.set(selectedMonitor, css3DObject);

        // Store reference to iframe element
        css3DObject.element = iframe;
    } else {
        // Update existing iframe
        css3DObject.element.src = url;
    }

    closeBrowserInput();
}

// Escape key to close browser input
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeBrowserInput();
        closeProductModal();
    }
});

// Product modal event listeners
document.getElementById('closeProductModal').addEventListener('click', closeProductModal);
document.getElementById('productModal').addEventListener('click', (e) => {
    if (e.target.id === 'productModal') {
        closeProductModal();
    }
});

let currentProductLink = '';
document.getElementById('buyProductBtn').addEventListener('click', () => {
    if (currentProductLink) {
        window.open(currentProductLink, '_blank');
    }
});

function showProductModal(productIndex) {
    const product = productData[productIndex];
    if (!product) return;

    document.getElementById('productImage').src = product.image;
    document.getElementById('productName').textContent = product.name;
    document.getElementById('productPrice').textContent = product.price;
    document.getElementById('productDescription').textContent = product.description;
    currentProductLink = product.buyLink;

    document.getElementById('productModal').style.display = 'block';
}

function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

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

// Create house for village
function createHouse(x, z, color) {
    const house = new THREE.Group();

    // House walls (wider)
    const wallsGeo = new THREE.BoxGeometry(18, 8, 18);
    const wallsMat = new THREE.MeshStandardMaterial({ color: color || 0xf5deb3 });
    const walls = new THREE.Mesh(wallsGeo, wallsMat);
    walls.position.y = 4;
    walls.castShadow = true;
    walls.receiveShadow = true;
    house.add(walls);

    // Roof (pyramid shape, wider)
    const roofGeo = new THREE.ConeGeometry(14, 6, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 11;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);

    // Door
    const doorGeo = new THREE.BoxGeometry(3, 5, 0.3);
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 2.5, 9.15);
    door.castShadow = true;
    house.add(door);

    // Windows
    const windowGeo = new THREE.BoxGeometry(2.5, 2.5, 0.3);
    const windowMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, emissive: 0x87ceeb, emissiveIntensity: 0.3 });

    // Front windows (3 windows for wider house)
    const window1 = new THREE.Mesh(windowGeo, windowMat);
    window1.position.set(-6, 5, 9.15);
    house.add(window1);

    const window2 = new THREE.Mesh(windowGeo, windowMat);
    window2.position.set(6, 5, 9.15);
    house.add(window2);
    
    // Additional windows on sides
    const window3 = new THREE.Mesh(windowGeo, windowMat);
    window3.position.set(-9.15, 5, -3);
    window3.rotation.y = Math.PI / 2;
    house.add(window3);
    
    const window4 = new THREE.Mesh(windowGeo, windowMat);
    window4.position.set(-9.15, 5, 3);
    window4.rotation.y = Math.PI / 2;
    house.add(window4);
    
    const window5 = new THREE.Mesh(windowGeo, windowMat);
    window5.position.set(9.15, 5, -3);
    window5.rotation.y = -Math.PI / 2;
    house.add(window5);
    
    const window6 = new THREE.Mesh(windowGeo, windowMat);
    window6.position.set(9.15, 5, 3);
    window6.rotation.y = -Math.PI / 2;
    house.add(window6);

    house.position.set(x, 0, z);
    scene.add(house);
    return house;
}

// Create small village - 2 houses
// Left side of main street
createHouse(-40, -40, 0xffe4b5);

// Right side of main street
createHouse(40, -40, 0xffd9b3);

// Create small plaza/fountain in center
const fountainGeo = new THREE.CylinderGeometry(2, 2.5, 1.5, 8);
const fountainMat = new THREE.MeshStandardMaterial({ color: 0xd3d3d3 });
const fountain = new THREE.Mesh(fountainGeo, fountainMat);
fountain.position.set(0, 0.75, -15);
fountain.castShadow = true;
fountain.receiveShadow = true;
scene.add(fountain);

// Water in fountain
const waterGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.3, 16);
const waterMat = new THREE.MeshStandardMaterial({
    color: 0x4169e1,
    transparent: true,
    opacity: 0.7,
    emissive: 0x4169e1,
    emissiveIntensity: 0.2
});
const water = new THREE.Mesh(waterGeo, waterMat);
water.position.set(0, 1.6, -15);
scene.add(water);

// Create roads/paths
function createRoad(x, z, width, length, rotation = 0) {
    const roadGeo = new THREE.BoxGeometry(width, 0.1, length);
    const roadMat = new THREE.MeshStandardMaterial({
        color: 0x696969,
        roughness: 0.8
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set(x, 0.05, z);
    road.rotation.y = rotation;
    road.receiveShadow = true;
    scene.add(road);
    return road;
}

// Main central road (vertical) - extended to reach back houses
createRoad(0, -10, 12, 100);

// Plaza around fountain
createRoad(0, -15, 18, 18);

// Left side road to house
createRoad(-25, -40, 20, 4, Math.PI / 2);

// Right side road to house
createRoad(25, -40, 20, 4, Math.PI / 2);

// Add highly realistic trees with detailed branches and organic foliage
function createTree(x, z, scale = 1) {
    const treeGroup = new THREE.Group();

    // Random size and shape variation
    const sizeVariation = 0.9 + Math.random() * 0.6; // 0.9 to 1.5
    const finalScale = scale * sizeVariation;
    const treeType = Math.random(); // Different tree styles

    // Realistic trunk with irregular shape
    const trunkHeight = 5 + Math.random() * 3;
    const trunkSegments = 5;
    const trunkGeometry = new THREE.CylinderGeometry(
        0.4 * finalScale, 
        0.65 * finalScale, 
        trunkHeight * finalScale, 
        10,
        trunkSegments,
        false
    );
    
    // Add irregularity to trunk vertices
    const positions = trunkGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        const noise = (Math.random() - 0.5) * 0.08 * finalScale;
        positions.setX(i, x + noise);
        positions.setZ(i, z + noise);
    }
    positions.needsUpdate = true;
    trunkGeometry.computeVertexNormals();
    
    const trunkMaterial = new THREE.MeshStandardMaterial({
        color: 0x2d1f14,
        roughness: 0.95,
        metalness: 0.0,
        flatShading: false
    });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.y = (trunkHeight / 2) * finalScale;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    // Add main branches with sub-branches
    const numMainBranches = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numMainBranches; i++) {
        const branchLength = (1.5 + Math.random() * 1.2) * finalScale;
        const branchGeo = new THREE.CylinderGeometry(
            0.06 * finalScale, 
            0.18 * finalScale, 
            branchLength, 
            6
        );
        const branch = new THREE.Mesh(branchGeo, trunkMaterial);
        
        const angle = (Math.PI * 2 * i) / numMainBranches + (Math.random() - 0.5) * 0.6;
        const heightPos = (trunkHeight * 0.45 + Math.random() * trunkHeight * 0.4) * finalScale;
        
        branch.position.y = heightPos;
        branch.position.x = Math.cos(angle) * 0.35 * finalScale;
        branch.position.z = Math.sin(angle) * 0.35 * finalScale;
        branch.rotation.z = (Math.PI / 5.5) + Math.random() * (Math.PI / 7);
        branch.rotation.y = angle;
        branch.castShadow = true;
        treeGroup.add(branch);
        
        // Add 2-3 sub-branches per main branch
        const numSubBranches = 2 + Math.floor(Math.random() * 2);
        for (let j = 0; j < numSubBranches; j++) {
            const subBranchLength = branchLength * (0.4 + Math.random() * 0.3);
            const subBranchGeo = new THREE.CylinderGeometry(
                0.03 * finalScale,
                0.08 * finalScale,
                subBranchLength,
                4
            );
            const subBranch = new THREE.Mesh(subBranchGeo, trunkMaterial);
            
            const subAngle = angle + (Math.random() - 0.5) * 1;
            const branchTipX = Math.cos(angle) * branchLength * Math.sin(Math.PI / 5.5);
            const branchTipZ = Math.sin(angle) * branchLength * Math.sin(Math.PI / 5.5);
            const branchTipY = branchLength * Math.cos(Math.PI / 5.5);
            
            subBranch.position.set(
                Math.cos(angle) * 0.35 * finalScale + branchTipX * 0.6,
                heightPos + branchTipY * 0.6,
                Math.sin(angle) * 0.35 * finalScale + branchTipZ * 0.6
            );
            subBranch.rotation.z = (Math.PI / 4) + Math.random() * (Math.PI / 6);
            subBranch.rotation.y = subAngle;
            subBranch.castShadow = true;
            treeGroup.add(subBranch);
        }
    }

    // Realistic foliage with varied colors and densities
    const greenShades = [
        { base: 0x1a4d2e, mid: 0x2d5016, highlight: 0x4a7c3c, light: 0x5d9652 },
        { base: 0x0f5626, mid: 0x228B22, highlight: 0x32CD32, light: 0x90ee90 },
        { base: 0x2a4d3a, mid: 0x355E3B, highlight: 0x4a7c4e, light: 0x6b9d6b },
        { base: 0x3d5c3d, mid: 0x4F7942, highlight: 0x6b9d5b, light: 0x8fbc8f }
    ];
    const colorSet = greenShades[Math.floor(Math.random() * greenShades.length)];

    const foliageY = (trunkHeight + 1.5) * finalScale;
    
    if (treeType < 0.5) {
        // Dense deciduous tree (oak/maple style) with layered clusters
        const leafClusters = 12 + Math.floor(Math.random() * 8);
        
        for (let i = 0; i < leafClusters; i++) {
            const clusterSize = (1.0 + Math.random() * 1.2) * finalScale;
            const detail = 10 + Math.floor(Math.random() * 6);
            const leafGeo = new THREE.SphereGeometry(clusterSize, detail, detail);
            
            // Vary colors more naturally
            let clusterColor;
            const colorRand = Math.random();
            if (colorRand < 0.3) clusterColor = colorSet.base;
            else if (colorRand < 0.6) clusterColor = colorSet.mid;
            else if (colorRand < 0.85) clusterColor = colorSet.highlight;
            else clusterColor = colorSet.light;
            
            const leafMat = new THREE.MeshStandardMaterial({
                color: clusterColor,
                roughness: 0.85,
                metalness: 0.0,
                flatShading: true
            });
            const leafCluster = new THREE.Mesh(leafGeo, leafMat);
            
            // Organize in spherical crown
            const phi = Math.acos((Math.random() * 2) - 1);
            const theta = Math.random() * Math.PI * 2;
            const radius = (1.2 + Math.random() * 1.5) * finalScale;
            
            leafCluster.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                foliageY + (Math.cos(phi) * radius * 1.2),
                radius * Math.sin(phi) * Math.sin(theta)
            );
            leafCluster.castShadow = true;
            leafCluster.receiveShadow = true;
            treeGroup.add(leafCluster);
        }
        
        // Large central crown
        const centralLeafGeo = new THREE.SphereGeometry(2.5 * finalScale, 14, 14);
        const centralLeafMat = new THREE.MeshStandardMaterial({
            color: colorSet.mid,
            roughness: 0.8,
            metalness: 0.0
        });
        const centralLeaf = new THREE.Mesh(centralLeafGeo, centralLeafMat);
        centralLeaf.position.y = foliageY + 0.8 * finalScale;
        centralLeaf.scale.set(1, 0.85, 1); // Slightly flatten
        centralLeaf.castShadow = true;
        centralLeaf.receiveShadow = true;
        treeGroup.add(centralLeaf);
        
    } else {
        // Detailed coniferous tree (pine/spruce)
        const numLayers = 6 + Math.floor(Math.random() * 2);
        
        for (let layer = 0; layer < numLayers; layer++) {
            const progress = layer / numLayers;
            const layerY = foliageY + (layer * 1.6 * finalScale);
            const layerRadius = (4.0 - layer * 0.55) * finalScale;
            const layerHeight = (2.2 + Math.random() * 0.6) * finalScale;
            
            // Main cone
            const coneGeo = new THREE.ConeGeometry(layerRadius, layerHeight, 12);
            let layerColor;
            if (layer % 3 === 0) layerColor = colorSet.base;
            else if (layer % 3 === 1) layerColor = colorSet.mid;
            else layerColor = colorSet.highlight;
            
            const coneMat = new THREE.MeshStandardMaterial({
                color: layerColor,
                roughness: 0.9,
                metalness: 0.0,
                flatShading: true
            });
            const cone = new THREE.Mesh(coneGeo, coneMat);
            cone.position.y = layerY;
            cone.rotation.y = (layer * 0.4) + (Math.random() * 0.3); // Twist layers
            cone.castShadow = true;
            cone.receiveShadow = true;
            treeGroup.add(cone);
            
            // Add drooping needle details on outer layers
            if (layer < numLayers - 1) {
                const needleCount = 8 + layer * 2;
                for (let n = 0; n < needleCount; n++) {
                    const needleAngle = (Math.PI * 2 * n) / needleCount;
                    const needleRadius = layerRadius * 0.85;
                    const needleSize = 0.3 * finalScale;
                    
                    const needleGeo = new THREE.ConeGeometry(needleSize, needleSize * 2, 4);
                    const needle = new THREE.Mesh(needleGeo, coneMat);
                    needle.position.set(
                        Math.cos(needleAngle) * needleRadius,
                        layerY - layerHeight * 0.3,
                        Math.sin(needleAngle) * needleRadius
                    );
                    needle.rotation.z = Math.PI / 3;
                    needle.rotation.y = needleAngle;
                    treeGroup.add(needle);
                }
            }
        }
        
        // Top spire
        const spireGeo = new THREE.ConeGeometry(0.4 * finalScale, 1.5 * finalScale, 8);
        const spireMat = new THREE.MeshStandardMaterial({
            color: colorSet.highlight,
            roughness: 0.9
        });
        const spire = new THREE.Mesh(spireGeo, spireMat);
        spire.position.y = foliageY + (numLayers * 1.6 + 0.5) * finalScale;
        spire.castShadow = true;
        treeGroup.add(spire);
    }

    // Natural variations
    treeGroup.rotation.y = Math.random() * Math.PI * 2;
    treeGroup.rotation.z = (Math.random() - 0.5) * 0.1;
    treeGroup.rotation.x = (Math.random() - 0.5) * 0.05;

    treeGroup.position.set(x, 0, z);
    scene.add(treeGroup);

    return treeGroup;
}

// Plant 15 trees strategically around the village
const treePositions = [
    // Front area (near entrance)
    [-50, 35], [50, 35],

    // Sides of main street
    [-50, 0], [50, 0],
    [-50, -30], [50, -30],

    // Behind houses
    [-60, -50], [60, -50],

    // Back area (behind product table)
    [-40, -80], [0, -85], [40, -80],

    // Near fountain
    [-25, -20], [25, -20],

    // Decorative corners
    [-35, 20], [35, 20]
];

treePositions.forEach(pos => {
    createTree(pos[0], pos[1]);
});

// Create Computer function
function createComputer(x, z) {
    const computer = new THREE.Group();

    // Large Visible Desk - Simple brown rectangle (1.5x bigger)
    const deskGeometry = new THREE.BoxGeometry(18, 2.25, 9);
    const deskMaterial = new THREE.MeshStandardMaterial({ color: 0xCD853F, metalness: 0.3, roughness: 0.7 });
    const desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.y = 1.125;
    desk.castShadow = true;
    desk.receiveShadow = true;
    computer.add(desk);

    // Large Monitor (1.5x bigger)
    const monitorGeometry = new THREE.BoxGeometry(8.25, 6, 0.75);
    const monitorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
    monitor.position.set(0, 5.25, 0);
    monitor.castShadow = true;
    monitor.receiveShadow = true;
    computer.add(monitor);

    // Bright Screen (very visible) (1.5x bigger)
    const screenGeometry = new THREE.BoxGeometry(7.5, 5.7, 0.6);

    // Create initial browser UI for this monitor
    const initialBrowserUI = new BrowserUI(1024, 768);
    initialBrowserUI.draw();

    const screenMaterial = new THREE.MeshStandardMaterial({
        map: initialBrowserUI.texture,
        emissive: 0x333333,
        emissiveIntensity: 0.2
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 5.25, 0.45);
    screen.castShadow = true;
    screen.userData = { isMonitor: true };
    clickableMonitors.push(screen);
    computer.add(screen);

    // Store the browser UI for this monitor
    monitorBrowsers.set(screen, initialBrowserUI);

    // Keyboard (1.5x bigger)
    const keyboardGeometry = new THREE.BoxGeometry(7.5, 0.6, 3);
    const keyboardMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const keyboard = new THREE.Mesh(keyboardGeometry, keyboardMaterial);
    keyboard.position.set(0, 2.25, 2.25);
    keyboard.castShadow = true;
    computer.add(keyboard);

    // Mouse (1.5x bigger)
    const mouseGeometry = new THREE.BoxGeometry(1.05, 0.6, 2.25);
    const mouseMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const mouse01 = new THREE.Mesh(mouseGeometry, mouseMaterial);
    mouse01.position.set(5.25, 2.4, 3);
    mouse01.castShadow = true;
    computer.add(mouse01);

    computer.position.set(x, 0, z);
    scene.add(computer);
    return computer;
}

// Create first computer closer to player (left side)
const computer = createComputer(-30, 5);

// Add a bright light above the computer desk
const deskLight = new THREE.PointLight(0x00ffff, 2, 50);
deskLight.position.set(-30, 10, 5);
deskLight.castShadow = true;
scene.add(deskLight);

// Create Product Table function
function createProductTable(x, z) {
    const table = new THREE.Group();

    // Table surface (wooden)
    const tableGeometry = new THREE.BoxGeometry(15, 1, 8);
    const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    const tableSurface = new THREE.Mesh(tableGeometry, tableMaterial);
    tableSurface.position.y = 3;
    tableSurface.castShadow = true;
    tableSurface.receiveShadow = true;
    table.add(tableSurface);

    // Table legs
    const legGeometry = new THREE.BoxGeometry(0.8, 3, 0.8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });

    const positions = [
        [-6.5, 1.5, 3.5],
        [6.5, 1.5, 3.5],
        [-6.5, 1.5, -3.5],
        [6.5, 1.5, -3.5]
    ];

    positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(pos[0], pos[1], pos[2]);
        leg.castShadow = true;
        table.add(leg);
    });

    // Create products with data
    const productPositions = [
        { x: -5, y: 4.5, z: 2, size: [2, 2, 2] },
        { x: -2, y: 4.75, z: 2, size: [1.5, 2.5, 1.5] },
        { x: 1, y: 4.25, z: 2, size: [2.5, 1.5, 2] },
        { x: 4.5, y: 4.4, z: 2, size: [1.8, 1.8, 1.8] },
        { x: -4, y: 4.1, z: -1.5, size: [2, 1.2, 2] },
        { x: -1, y: 4.5, z: -1.5, size: [1.5, 2, 1.5] },
        { x: 2, y: 4.25, z: -1.5, size: [2.2, 1.5, 1.8] },
        { x: 5, y: 4.3, z: -1.5, size: [1.6, 1.6, 1.6] }
    ];

    const productColors = [0xff4444, 0x4444ff, 0x44ff44, 0xffff44, 0xff8844, 0xff44ff, 0x44ffff, 0xff88cc];

    productPositions.forEach((pos, index) => {
        const productGeo = new THREE.BoxGeometry(...pos.size);
        const productMat = new THREE.MeshStandardMaterial({
            color: productColors[index],
            emissive: productColors[index],
            emissiveIntensity: 0.2
        });
        const product = new THREE.Mesh(productGeo, productMat);
        product.position.set(pos.x, pos.y, pos.z);
        product.castShadow = true;
        product.userData = { isProduct: true, productIndex: index };
        clickableProducts.push(product);
        table.add(product);
    });

    // Sign on front of table
    const signGeo = new THREE.BoxGeometry(8, 1.5, 0.2);
    const signMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2, 4.1);
    sign.castShadow = true;
    table.add(sign);

    // Sign text (using canvas texture)
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#333333';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PRODUCTOS EN VENTA', 256, 80);

    const textTexture = new THREE.CanvasTexture(canvas);
    const textGeo = new THREE.PlaneGeometry(7.5, 1.2);
    const textMat = new THREE.MeshStandardMaterial({ map: textTexture });
    const textPlane = new THREE.Mesh(textGeo, textMat);
    textPlane.position.set(0, 2, 4.2);
    table.add(textPlane);

    table.position.set(x, 0, z);
    scene.add(table);
    return table;
}

// Create product table - moved further back
const productTable = createProductTable(0, -65);

// Add light above product table
const tableLight = new THREE.PointLight(0xffffff, 3, 50);
tableLight.position.set(0, 10, -65);
tableLight.castShadow = true;
scene.add(tableLight);

// Create White Desktop PC Desk function
function createWhiteDesktop(x, z) {
    const desktop = new THREE.Group();

    // Desk (1.5x bigger)
    const deskGeometry = new THREE.BoxGeometry(12, 1.5, 5.25);
    const deskMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
    const desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.y = 0.75;
    desk.castShadow = true;
    desk.receiveShadow = true;
    desktop.add(desk);

    // White Desktop PC Tower (on the right side of desk) (1.5x bigger)
    const pcGeometry = new THREE.BoxGeometry(2.25, 5.25, 1.5);
    const pcMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
    const pc = new THREE.Mesh(pcGeometry, pcMaterial);
    pc.position.set(4.5, 3.3, 0);
    pc.castShadow = true;
    desktop.add(pc);

    // PC Front Panel (darker) (1.5x bigger)
    const panelGeometry = new THREE.BoxGeometry(2.1, 1.8, 0.225);
    const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
    panel.position.set(4.5, 1.95, 0.75);
    panel.castShadow = true;
    desktop.add(panel);

    // Monitor (1.5x bigger)
    const monitorGeometry = new THREE.BoxGeometry(6, 4.5, 0.6);
    const monitorMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
    monitor.position.set(-2.25, 4.5, 0);
    monitor.castShadow = true;
    desktop.add(monitor);

    // Monitor Screen (1.5x bigger)
    const screenGeometry = new THREE.BoxGeometry(5.7, 4.2, 0.45);

    // Create initial browser UI for this monitor
    const initialBrowserUI2 = new BrowserUI(1024, 768);
    initialBrowserUI2.draw();

    const screenMaterial = new THREE.MeshStandardMaterial({
        map: initialBrowserUI2.texture,
        emissive: 0x1a1a1a,
        emissiveIntensity: 0.2
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(-2.25, 4.5, 0.375);
    screen.castShadow = true;
    screen.userData = { isMonitor: true };
    clickableMonitors.push(screen);
    desktop.add(screen);

    // Store the browser UI for this monitor
    monitorBrowsers.set(screen, initialBrowserUI2);

    // Keyboard (1.5x bigger)
    const keyboardGeometry = new THREE.BoxGeometry(6, 0.6, 2.25);
    const keyboardMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
    const keyboard = new THREE.Mesh(keyboardGeometry, keyboardMaterial);
    keyboard.position.set(-2.25, 1.5, 1.95);
    keyboard.castShadow = true;
    desktop.add(keyboard);

    // Mouse (1.5x bigger)
    const mouseGeometry = new THREE.BoxGeometry(0.9, 0.6, 1.8);
    const mouseMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd });
    const mouse = new THREE.Mesh(mouseGeometry, mouseMaterial);
    mouse.position.set(0.75, 1.65, 2.4);
    mouse.castShadow = true;
    desktop.add(mouse);

    desktop.position.set(x, 0, z);
    scene.add(desktop);
    return desktop;
}

// Create second desk with white desktop PC (closer to player, right side)
const whiteDesktop = createWhiteDesktop(30, 5);

// Add light above second desk
const desktopLight = new THREE.PointLight(0x0066ff, 2, 50);
desktopLight.position.set(30, 10, 5);
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
            openBrowserInput(clickedMonitor);
            return;
        }
    }

    // Check for intersections with products
    const productIntersects = raycaster.intersectObjects(clickableProducts);
    if (productIntersects.length > 0) {
        const clickedProduct = productIntersects[0].object;
        if (clickedProduct.userData.isProduct) {
            showProductModal(clickedProduct.userData.productIndex);
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
    cssRenderer.render(cssScene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    cssRenderer.setSize(window.innerWidth, window.innerHeight);
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
