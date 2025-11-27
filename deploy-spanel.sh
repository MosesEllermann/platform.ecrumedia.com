#!/bin/bash
# Simple deployment script for sPanel hosting

set -e

echo "🚀 Deploying ecrumedia platform to sPanel..."

# Configuration - UPDATE THESE
SERVER_USER="yourusername"
SERVER_HOST="yourserver.com"
BACKEND_PATH="~/ecrumedia/backend"
FRONTEND_PATH="~/public_html"

echo "📦 Building frontend..."
npm run build

echo "📦 Building backend..."
cd backend
npm run build
cd ..

echo "📤 Uploading frontend..."
scp -r dist/* $SERVER_USER@$SERVER_HOST:$FRONTEND_PATH/

echo "📤 Uploading backend..."
ssh $SERVER_USER@$SERVER_HOST "mkdir -p $BACKEND_PATH"
scp -r backend/dist $SERVER_USER@$SERVER_HOST:$BACKEND_PATH/
scp backend/package*.json $SERVER_USER@$SERVER_HOST:$BACKEND_PATH/
scp -r backend/prisma $SERVER_USER@$SERVER_HOST:$BACKEND_PATH/

echo "🔧 Installing dependencies and running migrations..."
ssh $SERVER_USER@$SERVER_HOST << 'ENDSSH'
cd ~/ecrumedia/backend
npm ci --omit=dev
npx prisma generate
npx prisma migrate deploy
ENDSSH

echo "✅ Deployment complete!"
echo ""
echo "⚠️  Next steps:"
echo "1. Go to sPanel Node.js Manager"
echo "2. Restart 'ecrumedia-backend' application"
echo "3. Test: curl https://yourdomain.com/api"
