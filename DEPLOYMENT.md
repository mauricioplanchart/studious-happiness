# Deployment Guide

This guide will help you deploy your Three.js Metaverse to Firebase Hosting and the WebSocket server to Render.com.

## Part 1: Deploy WebSocket Server to Render.com (Free)

1. **Create a Render.com account**
   - Go to https://render.com and sign up (free)
   - Connect your GitHub account

2. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

3. **Deploy on Render**
   - Go to https://dashboard.render.com
   - Click "New +" and select "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: metaverse-websocket-server
     - **Runtime**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `node server.js`
   - Click "Create Web Service"

4. **Get your WebSocket URL**
   - Once deployed, Render will give you a URL like: `https://metaverse-websocket-server.onrender.com`
   - Your WebSocket URL will be: `wss://metaverse-websocket-server.onrender.com` (note: wss not ws)

5. **Update .env.production**
   - Open `.env.production` file
   - Replace the placeholder URL with your Render WebSocket URL:
     ```
     VITE_WS_URL=wss://your-app-name.onrender.com
     ```

## Part 2: Deploy Frontend to Firebase Hosting

1. **Login to Firebase**
   ```bash
   npx firebase login
   ```

2. **Initialize Firebase project**
   - Go to https://console.firebase.google.com
   - Create a new project or select an existing one
   - Copy your project ID

3. **Create .firebaserc file** (if not exists)
   ```json
   {
     "projects": {
       "default": "your-firebase-project-id"
     }
   }
   ```

4. **Build your project**
   ```bash
   npm run build
   ```

5. **Deploy to Firebase**
   ```bash
   npx firebase deploy --only hosting
   ```

6. **Access your metaverse**
   - Firebase will provide a URL like: `https://your-project-id.web.app`
   - Visit that URL to access your deployed metaverse!

## Important Notes

- **Free Tier Limitations**:
  - Render free tier spins down after 15 minutes of inactivity
  - First connection after inactivity may take 30-60 seconds to wake up
  - Consider upgrading for production use

- **WebSocket Connection**:
  - Make sure to use `wss://` (not `ws://`) for production
  - The WebSocket server URL must be updated in `.env.production` before building

- **Testing**:
  - Test locally first: `npm run dev` + `node server.js`
  - Build and test: `npm run build` + `npx vite preview`

## Alternative Deployment Options

### Railway.app (Alternative to Render)
- Similar to Render but with different free tier
- URL format: `wss://your-app-name.railway.app`

### Heroku
- Requires credit card for verification
- Free tier available with limitations

## Troubleshooting

**WebSocket won't connect:**
- Check that your WebSocket server is running on Render
- Verify the URL in `.env.production` is correct
- Check browser console for specific error messages
- Make sure you rebuilt the project after updating `.env.production`

**Firebase deployment fails:**
- Make sure you've run `npm run build` first
- Check that `firebase.json` points to the correct `dist` folder
- Verify you're logged in: `npx firebase login`

**Players can't see each other:**
- WebSocket server might be sleeping (free tier)
- Check connection status indicator in top-right of the metaverse
- Wait 30-60 seconds for server to wake up on Render free tier
