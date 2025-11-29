# 🔧 Fix 503 Service Unavailable Error - IMMEDIATE ACTION

## Problem
Your backend Node.js application is **NOT RUNNING** on the server. That's why you get:
- `503 Service Unavailable`
- `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

## Quick Fix (Do this NOW)

### Option 1: Automated Script
Run this from your local machine:
```bash
./manual-restart-backend.sh
```

### Option 2: Manual SSH Commands
1. **SSH into your server:**
   ```bash
   ssh -p YOUR_SSH_PORT YOUR_USERNAME@YOUR_SERVER_HOST
   ```

2. **Navigate to backend directory:**
   ```bash
   cd ~/platform.ecrumedia.com/backend
   ```

3. **Check if backend is running:**
   ```bash
   ps aux | grep "node.*dist/main.js"
   ```
   - If nothing shows up, the backend is NOT running ❌

4. **Install PM2 (if not installed):**
   ```bash
   npm install -g pm2
   ```

5. **Check if .env file exists:**
   ```bash
   cat .env
   ```
   - If it doesn't exist or is empty, you need to create it (see below)

6. **Create .env file (REQUIRED):**
   ```bash
   cat > .env << 'EOF'
   DATABASE_URL="mysql://YOUR_DB_USER:YOUR_DB_PASS@localhost:3306/YOUR_DB_NAME"
   JWT_SECRET="your-secret-key-here"
   JWT_EXPIRES_IN="7d"
   PORT="3000"
   NODE_ENV="production"
   FRONTEND_URL="https://platform.ecrumedia.com"
   EOF
   ```
   **⚠️ Replace with your actual values!**

7. **Start the backend with PM2:**
   ```bash
   pm2 start dist/main.js --name ecrumedia-backend --time
   pm2 save
   pm2 startup
   ```

8. **Check status:**
   ```bash
   pm2 status
   pm2 logs ecrumedia-backend --lines 50
   ```

9. **Test the backend:**
   ```bash
   curl http://localhost:3000/api/health
   ```
   - Should return JSON, not an error

## What Port Should I Use?

Check your GitHub Secrets for `APP_PORT`:
- Go to: https://github.com/mosesellermann/platform.ecrumedia.com/settings/secrets/actions
- Look for `APP_PORT` secret
- Use that value in step 6 above for the `PORT` variable

## Verify It's Working

1. **On the server, check PM2:**
   ```bash
   pm2 status
   ```
   Should show `ecrumedia-backend` as `online`

2. **Check logs:**
   ```bash
   pm2 logs ecrumedia-backend
   ```
   Should show: `🚀 ecrumedia API running on: http://localhost:XXXX/api`

3. **Test the API from server:**
   ```bash
   curl http://localhost:YOUR_PORT/api/health
   ```

4. **Test from browser:**
   Open: `https://platform.ecrumedia.com/api/health`
   Should return JSON (not 503 error)

## Then Commit the Deploy Fix

After the backend is running, commit the workflow changes:
```bash
git add .github/workflows/deploy.yml
git commit -m "Fix: Use PM2 to keep backend running persistently"
git push origin main
```

This ensures future deployments will use PM2 properly.

## Why This Happened

1. Your deployment script was killing the process but **not restarting it properly**
2. sPanel doesn't auto-restart Node.js apps like Heroku/Vercel do
3. Without a process manager (PM2), the app stays dead after the script exits

## PM2 Cheat Sheet

```bash
pm2 list                    # Show all processes
pm2 status                  # Same as list
pm2 logs ecrumedia-backend  # Show logs
pm2 restart ecrumedia-backend  # Restart the app
pm2 stop ecrumedia-backend  # Stop the app
pm2 start ecrumedia-backend # Start the app
pm2 delete ecrumedia-backend # Remove from PM2
pm2 monit                   # Monitor CPU/Memory
```
