#!/bin/bash
# Manual script to restart the backend on the server
# This will immediately fix the 503 error

echo "🔧 Manually restarting backend on server..."
echo ""
echo "Please provide your server details:"
read -p "Server host (e.g., platform.ecrumedia.com or IP): " SERVER_HOST
read -p "SSH username: " SERVER_USER
read -p "SSH port (default 22): " SERVER_PORT
SERVER_PORT=${SERVER_PORT:-22}
read -p "Backend PORT (the port your Node.js app runs on): " APP_PORT

echo ""
echo "Connecting to server and restarting backend..."
echo ""

ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST << 'ENDSSH'
cd ~/platform.ecrumedia.com/backend

echo "📦 Installing PM2 if needed..."
if ! command -v pm2 &> /dev/null; then
  npm install -g pm2
fi

echo "🔄 Stopping any existing backend processes..."
pm2 stop ecrumedia-backend 2>/dev/null || pkill -f "node.*dist/main.js" || echo "No existing process found"
pm2 delete ecrumedia-backend 2>/dev/null || true

echo "🚀 Starting backend with PM2..."
pm2 start dist/main.js --name ecrumedia-backend --time

echo "💾 Saving PM2 process list..."
pm2 save

echo "✅ Backend restarted!"
echo ""
echo "📊 Current status:"
pm2 status
pm2 logs ecrumedia-backend --lines 20
ENDSSH

echo ""
echo "✅ Done! Try logging in again at https://platform.ecrumedia.com"
