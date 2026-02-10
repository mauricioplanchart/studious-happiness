# Quick Deploy WebSocket Server to Render.com

Follow these steps to deploy your WebSocket server and enable multiplayer:

## Step 1: Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Add multiplayer metaverse with WebSocket server"

# Create a repo on GitHub, then:
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## Step 2: Deploy on Render.com

1. Go to https://render.com and **Sign Up** (free)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub account and select your repository
4. Configure the service:
   - **Name**: `metaverse-websocket` (or any name you like)
   - **Region**: Choose closest to you
   - **Branch**: `main`
   - **Root Directory**: Leave blank
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

5. Click **"Create Web Service"**
6. Wait 2-3 minutes for deployment

## Step 3: Get Your WebSocket URL

After deployment, Render will show you a URL like:
```
https://metaverse-websocket.onrender.com
```

Your WebSocket URL will be (note the **wss://** prefix):
```
wss://metaverse-websocket.onrender.com
```

## Step 4: Update Your Frontend

1. Open `.env.production` in your project
2. Replace the placeholder URL with your actual Render URL:
   ```
   VITE_WS_URL=wss://metaverse-websocket.onrender.com
   ```

3. Rebuild and redeploy your frontend:
   ```bash
   npm run build
   npx firebase deploy --only hosting
   ```

## Step 5: Test!

Visit your Firebase URL: https://metaverse-app3.web.app

- Open in multiple browser tabs or different devices
- Click "Click to Enter" in each
- You should see other players and be able to chat!

## Important Notes

⚠️ **Free Tier Limitation**: 
- Render's free tier "spins down" after 15 minutes of inactivity
- First connection may take 30-60 seconds to wake up
- This is normal for the free tier!

✅ **To keep it always active**: Upgrade to paid tier (~$7/month)

## Troubleshooting

**"Cannot connect to server"**
- Wait 30-60 seconds for the free tier server to wake up
- Check the URL in `.env.production` is correct
- Make sure you rebuilt after updating the env file

**Players can't see each other**
- Check connection status in top-right corner
- Open browser console (F12) to see connection logs
- Verify WebSocket server is running on Render dashboard

**Need help?**
See the full [DEPLOYMENT.md](DEPLOYMENT.md) guide for more details.
