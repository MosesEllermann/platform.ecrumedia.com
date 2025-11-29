# Quick Fix for sPanel Backend

The error `NodeJS Application at /home/site22570/platform.ecrumedia.com/backend/app.yml/app.yml does not exist` means sPanel's Node.js Manager is misconfigured or the app.yml wasn't deployed.

## Immediate Fix (SSH into your server and run):

```bash
# SSH into server
ssh site22570@YOUR_HOST -p6543

# Go to backend directory
cd ~/platform.ecrumedia.com/backend

# Make sure app.yml exists
ls -la app.yml

# If app.yml doesn't exist, create it:
cat > app.yml << 'EOF'
---
# sPanel Node.js Application Configuration
app:
  name: ecrumedia-backend
  version: 1.0.0
  
node:
  version: 20
  
paths:
  root: /home/site22570/platform.ecrumedia.com/backend
  startup: dist/main.js
  
server:
  port: 3146
  mode: production
  
env:
  NODE_ENV: production
  PORT: 3146
EOF

# Start the backend manually with node
pkill -f "node.*dist/main.js" || true
nohup node dist/main.js > output.log 2>&1 &

# Check if it's running
sleep 2
curl http://127.0.0.1:3146/api/health

# Check the logs
tail -f output.log
```

## Alternative: Use sPanel's Node.js Manager UI

1. Log into sPanel
2. Go to **Node.js Manager** or **Node.js Applications**
3. Look for `ecrumedia-backend`
4. If it exists: Click **Restart**
5. If it doesn't exist: Click **Create Application** and fill in:
   - **App Name**: `ecrumedia-backend`
   - **Node Version**: 20.x
   - **App Root**: `/home/site22570/platform.ecrumedia.com/backend`
   - **Startup File**: `dist/main.js`
   - **Port**: `3146` (or whatever your APP_PORT secret is set to)
   - **Mode**: Production

## Check if Backend is Running

```bash
# Check process
ps aux | grep "node.*dist/main.js"

# Check if port is listening
netstat -tlnp | grep 3146

# Test the API
curl http://127.0.0.1:3146/api/health

# Check logs
tail -f ~/platform.ecrumedia.com/backend/output.log
```

## The deployment just pushed will:
1. ✅ Deploy `app.yml` to the server
2. ✅ Try multiple restart methods (nodeapp, PM2, direct node)
3. ✅ Verify the backend is responding

Wait 2-3 minutes for the GitHub Action to complete, then try logging in again!
