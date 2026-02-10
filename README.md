# Three.js Metaverse 🌐

An immersive 3D metaverse built with Three.js featuring first-person exploration, interactive environments, and a vibrant virtual world.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

### Running the Project

To run with multiplayer support:

1. Start the WebSocket server (in one terminal):
```bash
npm run server
```

2. Start the development server (in another terminal):
```bash
npm run dev
```

The metaverse will be available at `http://localhost:5173`

**Note:** Both servers need to be running for multiplayer features to work. You can still use the app without the WebSocket server, but multiplayer and chat features won't be available.

### Build for Production

```bash
npm run build
```

## 🚀 Deployment

Your metaverse is now deployed to Firebase Hosting at:
**https://metaverse-app3.web.app**

### To enable multiplayer features online:

1. **Deploy the WebSocket server** (see [DEPLOYMENT.md](DEPLOYMENT.md) for detailed steps)
   - Easiest option: Use Render.com (free tier available)
   - Alternative: Railway.app or Heroku

2. **Update the WebSocket URL**
   - After deploying your WebSocket server, you'll get a URL
   - Update `.env.production` with your WebSocket URL:
     ```
     VITE_WS_URL=wss://your-websocket-server.onrender.com
     ```
   - Rebuild and redeploy:
     ```bash
     npm run build
     npx firebase deploy --only hosting
     ```

**Quick Start for WebSocket Deployment:**
See [DEPLOYMENT.md](DEPLOYMENT.md) for complete step-by-step instructions.

## Features

### 🎮 Controls
- **WASD / Arrow Keys** - Move around the world
- **Mouse** - Look around (360° view)
- **Space** - Jump
- **T** - Focus chat input (when in-game)
- **ESC** - Exit pointer lock mode

### 🌍 World Features
- **First-person exploration** - Immersive camera controls with pointer lock
- **Dynamic city** - Multiple colorful buildings with varying heights
- **Natural environment** - Trees scattered throughout the landscape
- **Realistic lighting** - Ambient and directional lights with dynamic shadows
- **Physics simulation** - Gravity and jumping mechanics
- **Atmospheric effects** - Fog and sky rendering
- **Decorative objects** - Floating platforms and structures

### 🌐 Multiplayer Features
- **Real-time multiplayer** - See other players moving in real-time
- **Player avatars** - Each player has a unique colored avatar with username
- **Live chat system** - Text chat with all players in the metaverse
- **Connection status** - See how many players are online
- **Automatic reconnection** - Reconnects automatically if connection is lost
- **Player join/leave notifications** - System messages when players connect or disconnect

### 🏗️ Technical Features
- Pointer lock controls for immersive first-person experience
- Real-time shadow mapping
- Collision detection with ground
- Smooth movement with WASD controls
- Responsive canvas that adapts to window resize
- Optimized rendering with Vite

### Project Structure

- `index.html` - Main HTML with metaverse UI and instructions
- `main.js` - Complete metaverse implementation with controls and world building
- `package.json` - Project dependencies and scripts

## Future Enhancements

- ~~Multiplayer support~~ ✅ **IMPLEMENTED**
- ~~Text chat~~ ✅ **IMPLEMENTED**
- Avatar customization (choose colors, outfits)
- Interactive objects and NPCs with AI
- Teleportation between locations
- Voice chat integration
- User-created content and building tools
- Private rooms and friend system
- Emotes and gestures
