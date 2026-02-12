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

// Simple solid grass ground
const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a7c59,
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
        this.tabs = [{ url: 'https://google.com', title: 'Google' }];
        this.activeTabIndex = 0;
        this.history = ['https://google.com'];
        this.historyIndex = 0;
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.magFilter = THREE.LinearFilter;
        this.texture.minFilter = THREE.LinearFilter;
        this.isLoading = false;
        this.draw();
    }

    get currentURL() {
        return this.tabs[this.activeTabIndex]?.url || 'https://google.com';
    }

    get currentSite() {
        const url = this.currentURL.toLowerCase();
        if (url.includes('google')) return 'google';
        if (url.includes('youtube')) return 'youtube';
        if (url.includes('wikipedia')) return 'wikipedia';
        if (url.includes('github')) return 'github';
        if (url.includes('twitter') || url.includes('x.com')) return 'twitter';
        if (url.includes('reddit')) return 'reddit';
        if (url.includes('amazon')) return 'amazon';
        if (url.includes('linkedin')) return 'linkedin';
        if (url.includes('netflix')) return 'netflix';
        if (url.includes('twitch')) return 'twitch';
        if (url.includes('facebook')) return 'facebook';
        if (url.includes('instagram')) return 'instagram';
        return 'generic';
    }

    loadURL(url) {
        if (!url.startsWith('http')) {
            url = 'https://' + url;
        }

        // Update current tab
        this.tabs[this.activeTabIndex].url = url;
        this.tabs[this.activeTabIndex].title = this.getTitleFromURL(url);

        // Update history
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(url);
        this.historyIndex = this.history.length - 1;

        this.draw();
    }

    getTitleFromURL(url) {
        const urlLower = url.toLowerCase();
        if (urlLower.includes('google')) return 'Google';
        if (urlLower.includes('youtube')) return 'YouTube';
        if (urlLower.includes('wikipedia')) return 'Wikipedia';
        if (urlLower.includes('github')) return 'GitHub';
        if (urlLower.includes('twitter') || urlLower.includes('x.com')) return 'X';
        if (urlLower.includes('reddit')) return 'Reddit';
        if (urlLower.includes('amazon')) return 'Amazon';
        if (urlLower.includes('linkedin')) return 'LinkedIn';
        if (urlLower.includes('netflix')) return 'Netflix';
        if (urlLower.includes('twitch')) return 'Twitch';
        if (urlLower.includes('facebook')) return 'Facebook';
        if (urlLower.includes('instagram')) return 'Instagram';
        return 'Website';
    }

    addNewTab(url = 'https://google.com') {
        this.tabs.push({ url, title: this.getTitleFromURL(url) });
        this.activeTabIndex = this.tabs.length - 1;
        this.history = [url];
        this.historyIndex = 0;
        this.draw();
    }

    closeTab(index) {
        if (this.tabs.length > 1) {
            this.tabs.splice(index, 1);
            if (this.activeTabIndex >= this.tabs.length) {
                this.activeTabIndex = this.tabs.length - 1;
            }
            this.draw();
        }
    }

    switchTab(index) {
        if (index >= 0 && index < this.tabs.length) {
            this.activeTabIndex = index;
            this.draw();
        }
    }

    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.tabs[this.activeTabIndex].url = this.history[this.historyIndex];
            this.draw();
        }
    }

    goForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.tabs[this.activeTabIndex].url = this.history[this.historyIndex];
            this.draw();
        }
    }

    reload() {
        this.isLoading = true;
        setTimeout(() => {
            this.isLoading = false;
            this.draw();
        }, 500);
        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;

        // Background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);

        // Tab bar
        ctx.fillStyle = '#e0e0e0';
        ctx.fillRect(0, 0, w, 35);

        let tabX = 10;
        this.tabs.forEach((tab, index) => {
            const tabWidth = 150;
            const isActive = index === this.activeTabIndex;

            if (isActive) {
                ctx.fillStyle = '#ffffff';
            } else {
                ctx.fillStyle = '#d0d0d0';
            }
            ctx.fillRect(tabX, 5, tabWidth, 25);
            ctx.strokeStyle = '#999';
            ctx.lineWidth = 1;
            ctx.strokeRect(tabX, 5, tabWidth, 25);

            ctx.fillStyle = '#000000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            const title = tab.title.substring(0, 12);
            ctx.fillText(title, tabX + 8, 20);

            // Close button on tabs
            if (this.tabs.length > 1) {
                ctx.fillStyle = '#666';
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('✕', tabX + tabWidth - 10, 19);
            }

            tabX += tabWidth + 3;
        });

        // New tab button
        ctx.fillStyle = '#d0d0d0';
        ctx.fillRect(tabX, 5, 30, 25);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.strokeRect(tabX, 5, 30, 25);
        ctx.fillStyle = '#333';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+', tabX + 15, 20);

        // Browser chrome (navigation bar)
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 35, w, 50);

        // Back button
        ctx.fillStyle = this.historyIndex > 0 ? '#cccccc' : '#e8e8e8';
        ctx.fillRect(10, 40, 35, 40);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 40, 35, 40);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('←', 27, 60);

        // Forward button
        ctx.fillStyle = this.historyIndex < this.history.length - 1 ? '#cccccc' : '#e8e8e8';
        ctx.fillRect(50, 40, 35, 40);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.strokeRect(50, 40, 35, 40);
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('→', 67, 60);

        // Reload button
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(90, 40, 35, 40);
        ctx.strokeStyle = '#999';
        ctx.lineWidth = 1;
        ctx.strokeRect(90, 40, 35, 40);
        ctx.fillStyle = this.isLoading ? '#ff6b6b' : '#000000';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.isLoading ? '⊙' : '⟳', 107, 60);

        // Address bar
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 2;
        ctx.fillRect(130, 40, w - 140, 40);
        ctx.strokeRect(130, 40, w - 140, 40);

        ctx.fillStyle = '#666666';
        ctx.font = '13px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(this.currentURL.substring(8, 50) + '...', 140, 65);

        // Content area
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 85, w, h - 85);

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
    }
];

// Browser URL tracking
let selectedMonitor = null;

// Create browser URL input UI (simple floating address bar)
const browserInputHTML = `
    <input type="text" id="browserURLInput" placeholder="Escribe URL aquí... (google, youtube, wikipedia, github, twitter, reddit, amazon)" 
        style="display: none; position: fixed; top: 20px; left: 20px; z-index: 9999; 
        width: 400px; padding: 12px 15px; border: 2px solid #4a90e2; border-radius: 8px; 
        font-size: 14px; box-sizing: border-box; font-family: Arial, sans-serif;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15); background: white;">
    
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

// Browser URL input event listener
document.getElementById('browserURLInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const url = document.getElementById('browserURLInput').value.trim();
        if (url) {
            loadBrowserURL(url);
        }
    }
});

// Close on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeBrowserInput();
    }
});

function openBrowserInput(monitor) {
    selectedMonitor = monitor;
    const input = document.getElementById('browserURLInput');
    input.style.display = 'block';
    input.focus();
    input.setSelectionRange(0, input.value.length); // Select all text

    // Show current URL if monitor has one
    const iframe = monitorIframes.get(monitor);
    if (iframe && iframe.element) {
        try {
            const currentUrl = iframe.element.src.replace('https://', '').replace('http://', '');
            input.value = currentUrl;
        } catch (e) {
            input.value = '';
        }
    } else {
        input.value = '';
    }
}

function closeBrowserInput() {
    const input = document.getElementById('browserURLInput');
    input.style.display = 'none';
    input.value = '';
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

    // House walls - simple
    const wallsGeo = new THREE.BoxGeometry(12, 6, 12);
    const wallsMat = new THREE.MeshStandardMaterial({ color: color || 0xf5deb3 });
    const walls = new THREE.Mesh(wallsGeo, wallsMat);
    walls.position.y = 3;
    walls.castShadow = true;
    walls.receiveShadow = true;
    house.add(walls);

    // Roof - simple
    const roofGeo = new THREE.ConeGeometry(10, 4, 4);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 8;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(roof);

    house.position.set(x, 0, z);
    scene.add(house);
    return house;
}

// Create small village - 2 houses
// Left side of main street
createHouse(-40, -40, 0xffe4b5);

// Right side of main street
createHouse(40, -50, 0xffd9b3);



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

// Simple tree - trunk + foliage sphere
function createTree(x, z, scale = 1) {
    const treeGroup = new THREE.Group();

    // Trunk - simple cylinder
    const trunkGeo = new THREE.CylinderGeometry(0.4 * scale, 0.5 * scale, 4 * scale, 8);
    const trunkMat = new THREE.MeshStandardMaterial({
        color: 0x8b6914,
        roughness: 0.9
    });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2 * scale;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    treeGroup.add(trunk);

    // Foliage - simple sphere
    const foliageGeo = new THREE.SphereGeometry(2.5 * scale, 8, 8);
    const foliageMat = new THREE.MeshStandardMaterial({
        color: 0x2d5016,
        roughness: 0.8,
        metalness: 0.0
    });
    const foliage = new THREE.Mesh(foliageGeo, foliageMat);
    foliage.position.y = 5 * scale;
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    treeGroup.add(foliage);

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

    // Desk - Simple brown rectangle
    const deskGeometry = new THREE.BoxGeometry(12, 1.5, 6);
    const deskMaterial = new THREE.MeshStandardMaterial({ color: 0xCD853F, metalness: 0.3, roughness: 0.7 });
    const desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.y = 0.75;
    desk.castShadow = true;
    desk.receiveShadow = true;
    computer.add(desk);

    // Monitor
    const monitorGeometry = new THREE.BoxGeometry(5.5, 4, 0.5);
    const monitorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
    const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
    monitor.position.set(0, 4, 0);
    monitor.castShadow = true;
    computer.add(monitor);

    // Screen with browser UI
    const screenGeometry = new THREE.BoxGeometry(5, 3.6, 0.4);
    const initialBrowserUI = new BrowserUI(1024, 768);
    initialBrowserUI.draw();

    const screenMaterial = new THREE.MeshStandardMaterial({
        map: initialBrowserUI.texture,
        emissive: 0x333333,
        emissiveIntensity: 0.2
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 4, 0.3);
    screen.castShadow = true;
    screen.userData = { isMonitor: true };
    clickableMonitors.push(screen);
    computer.add(screen);

    monitorBrowsers.set(screen, initialBrowserUI);

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




// Create White Desktop PC Desk function
function createWhiteDesktop(x, z) {
    const desktop = new THREE.Group();

    // Desk - white/light color
    const deskGeometry = new THREE.BoxGeometry(10, 1.2, 5);
    const deskMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f0f0 });
    const desk = new THREE.Mesh(deskGeometry, deskMaterial);
    desk.position.y = 0.6;
    desk.castShadow = true;
    desk.receiveShadow = true;
    desktop.add(desk);

    // Monitor
    const monitorGeometry = new THREE.BoxGeometry(5, 3.5, 0.5);
    const monitorMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const monitor = new THREE.Mesh(monitorGeometry, monitorMaterial);
    monitor.position.set(-1.5, 3.5, 0);
    monitor.castShadow = true;
    desktop.add(monitor);

    // Monitor Screen
    const screenGeometry = new THREE.BoxGeometry(4.5, 3.1, 0.35);

    const initialBrowserUI2 = new BrowserUI(1024, 768);
    initialBrowserUI2.draw();

    const screenMaterial = new THREE.MeshStandardMaterial({
        map: initialBrowserUI2.texture,
        emissive: 0x1a1a1a,
        emissiveIntensity: 0.2
    });
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(-1.5, 3.5, 0.3);
    screen.castShadow = true;
    screen.userData = { isMonitor: true };
    clickableMonitors.push(screen);
    desktop.add(screen);

    monitorBrowsers.set(screen, initialBrowserUI2);

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

// Create brown rectangular table
const brownTable = createBrownTable(-50, -20);

// Add light above brown table
const brownTableLight = new THREE.PointLight(0xffa500, 2.5, 50);
brownTableLight.position.set(-50, 10, -20);
brownTableLight.castShadow = true;
scene.add(brownTableLight);

// Create a simple brown rectangular table
function createBrownTable(x, z) {
    const table = new THREE.Group();

    // Table surface (rectangular, brown)
    const tableGeometry = new THREE.BoxGeometry(12, 1, 6);
    const tableMaterial = new THREE.MeshStandardMaterial({
        color: 0x8B4513,  // Brown color
        roughness: 0.7,
        metalness: 0.1
    });
    const tableSurface = new THREE.Mesh(tableGeometry, tableMaterial);
    tableSurface.position.y = 3;
    tableSurface.castShadow = true;
    tableSurface.receiveShadow = true;
    table.add(tableSurface);

    // Table legs (4 legs)
    const legGeometry = new THREE.BoxGeometry(0.6, 3, 0.6);
    const legMaterial = new THREE.MeshStandardMaterial({
        color: 0x654321
    });

    const positions = [
        [-5, 1.5, 2.5],
        [5, 1.5, 2.5],
        [-5, 1.5, -2.5],
        [5, 1.5, -2.5]
    ];

    positions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(pos[0], pos[1], pos[2]);
        leg.castShadow = true;
        table.add(leg);
    });

    // Add folded shirt/playera on top of the table (flat, store style)
    const shirtGroup = new THREE.Group();

    // Procedural fabric texture for more realistic cloth look
    const fabricCanvas = document.createElement('canvas');
    fabricCanvas.width = 256;
    fabricCanvas.height = 256;
    const fabricCtx = fabricCanvas.getContext('2d');

    fabricCtx.fillStyle = '#c61f2a';
    fabricCtx.fillRect(0, 0, 256, 256);

    fabricCtx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    fabricCtx.lineWidth = 1;
    for (let i = 0; i < 256; i += 8) {
        fabricCtx.beginPath();
        fabricCtx.moveTo(i, 0);
        fabricCtx.lineTo(i, 256);
        fabricCtx.stroke();

        fabricCtx.beginPath();
        fabricCtx.moveTo(0, i);
        fabricCtx.lineTo(256, i);
        fabricCtx.stroke();
    }

    for (let i = 0; i < 1200; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const alpha = 0.05 + Math.random() * 0.12;
        fabricCtx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        fabricCtx.fillRect(x, y, 2, 2);
    }

    const fabricTexture = new THREE.CanvasTexture(fabricCanvas);
    fabricTexture.wrapS = THREE.RepeatWrapping;
    fabricTexture.wrapT = THREE.RepeatWrapping;
    fabricTexture.repeat.set(2, 2);

    const shirtMaterial = new THREE.MeshStandardMaterial({
        color: 0xd72631,
        map: fabricTexture,
        roughness: 0.93,
        metalness: 0.0
    });
    const shirtShadowMaterial = new THREE.MeshStandardMaterial({
        color: 0xa81923,
        map: fabricTexture,
        roughness: 0.96,
        metalness: 0.0
    });

    // Base folded body
    const baseGeometry = new THREE.BoxGeometry(3.8, 0.09, 2.6);
    const shirtBase = new THREE.Mesh(baseGeometry, shirtMaterial);
    shirtBase.castShadow = true;
    shirtBase.receiveShadow = true;
    shirtGroup.add(shirtBase);

    // Sleeves folded inward
    const sleeveGeometry = new THREE.BoxGeometry(1.1, 0.08, 1.0);
    const leftSleeve = new THREE.Mesh(sleeveGeometry, shirtMaterial);
    leftSleeve.position.set(-1.14, 0.03, 0.47);
    leftSleeve.rotation.y = 0.48;
    leftSleeve.castShadow = true;
    shirtGroup.add(leftSleeve);

    const rightSleeve = new THREE.Mesh(sleeveGeometry, shirtMaterial);
    rightSleeve.position.set(1.14, 0.03, 0.47);
    rightSleeve.rotation.y = -0.48;
    rightSleeve.castShadow = true;
    shirtGroup.add(rightSleeve);

    // Side folded panels
    const sideFoldGeometry = new THREE.BoxGeometry(0.66, 0.07, 2.25);
    const leftFold = new THREE.Mesh(sideFoldGeometry, shirtShadowMaterial);
    leftFold.position.set(-1.2, 0.08, 0.04);
    leftFold.castShadow = true;
    shirtGroup.add(leftFold);

    const rightFold = new THREE.Mesh(sideFoldGeometry, shirtShadowMaterial);
    rightFold.position.set(1.2, 0.08, 0.04);
    rightFold.castShadow = true;
    shirtGroup.add(rightFold);

    // Bottom fold layer
    const bottomFoldGeometry = new THREE.BoxGeometry(2.92, 0.08, 0.92);
    const bottomFold = new THREE.Mesh(bottomFoldGeometry, shirtShadowMaterial);
    bottomFold.position.set(0, 0.12, -0.78);
    bottomFold.castShadow = true;
    shirtGroup.add(bottomFold);

    // Central soft fold band
    const centerFoldGeometry = new THREE.BoxGeometry(3.15, 0.05, 0.3);
    const centerFold = new THREE.Mesh(centerFoldGeometry, shirtShadowMaterial);
    centerFold.position.set(0, 0.13, -0.08);
    shirtGroup.add(centerFold);

    // Collar / neck area
    const collarMaterial = new THREE.MeshStandardMaterial({
        color: 0xf2f2f2,
        roughness: 0.82,
        metalness: 0.0
    });

    const neckOpeningGeometry = new THREE.TorusGeometry(0.4, 0.05, 12, 24);
    const neckOpening = new THREE.Mesh(neckOpeningGeometry, collarMaterial);
    neckOpening.position.set(0, 0.1, 0.95);
    neckOpening.rotation.x = Math.PI / 2;
    neckOpening.castShadow = true;
    shirtGroup.add(neckOpening);

    const flapGeometry = new THREE.BoxGeometry(0.55, 0.035, 0.42);
    const leftFlap = new THREE.Mesh(flapGeometry, collarMaterial);
    leftFlap.position.set(-0.22, 0.11, 0.67);
    leftFlap.rotation.y = 0.42;
    shirtGroup.add(leftFlap);

    const rightFlap = new THREE.Mesh(flapGeometry, collarMaterial);
    rightFlap.position.set(0.22, 0.11, 0.67);
    rightFlap.rotation.y = -0.42;
    shirtGroup.add(rightFlap);

    // Placket and buttons
    const placketGeometry = new THREE.BoxGeometry(0.22, 0.03, 0.74);
    const placket = new THREE.Mesh(placketGeometry, shirtShadowMaterial);
    placket.position.set(0, 0.11, 0.28);
    shirtGroup.add(placket);

    const buttonGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16);
    const buttonMaterial = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.5, metalness: 0.0 });
    [0.52, 0.34, 0.16].forEach((zPos) => {
        const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
        button.position.set(0, 0.12, zPos);
        button.rotation.x = Math.PI / 2;
        shirtGroup.add(button);
    });

    // Small stitched logo patch
    const logoGeometry = new THREE.BoxGeometry(0.65, 0.03, 0.62);
    const logoMaterial = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.75,
        metalness: 0.0
    });
    const logoPatch = new THREE.Mesh(logoGeometry, logoMaterial);
    logoPatch.position.set(0.8, 0.1, 0.14);
    logoPatch.castShadow = true;
    shirtGroup.add(logoPatch);

    // Visible seam strips
    const seamGeometry = new THREE.BoxGeometry(0.06, 0.02, 2.2);
    const seamMaterial = new THREE.MeshStandardMaterial({ color: 0x8f111b, roughness: 0.98, metalness: 0.0 });
    const leftSeam = new THREE.Mesh(seamGeometry, seamMaterial);
    leftSeam.position.set(-1.5, 0.1, -0.04);
    shirtGroup.add(leftSeam);

    const rightSeam = new THREE.Mesh(seamGeometry, seamMaterial);
    rightSeam.position.set(1.5, 0.1, -0.04);
    shirtGroup.add(rightSeam);

    // Position shirt centered and flat on top of table surface
    shirtGroup.position.set(0, 3.56, 0.45);
    shirtGroup.rotation.y = 0.08;
    table.add(shirtGroup);

    table.position.set(x, 0, z);
    scene.add(table);
    return table;
}

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

// Create local player avatar (will be created when joining game)
try {
    localPlayer = null; // Will be created when game starts
} catch (e) {
    console.error('Error initializing player:', e.message);
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

// Create local player avatar on page load
try {
    localPlayer = createAvatar(0, 30, 0x00ff00); // Green color for local player
    localPlayer.position.y = 0;
    console.log('Local player avatar created');
} catch (e) {
    console.error('Error creating local player avatar:', e.message);
}

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
    if (!hasInit || !ws || ws.readyState !== WebSocket.OPEN || nameSent || !localPlayer) {
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
    if (ws && ws.readyState === WebSocket.OPEN && localPlayer && Date.now() - lastPositionUpdate > 50) {
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

    if (gameStarted && localPlayer) {
        // Apply gravity
        velocity.y += gravity;

        // Calculate movement direction based on camera angle
        direction.z = Number(keys.backward) - Number(keys.forward);
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
        if (localPlayer) {
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
