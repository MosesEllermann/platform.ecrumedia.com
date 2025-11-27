#!/bin/bash

# Simple deployment script for ecrumedia platform
# Run this on your server to set up the initial environment

set -e

echo "🚀 Setting up ecrumedia platform..."

# Install Node.js (if not installed)
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install PM2 globally (process manager)
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Install PostgreSQL (if not installed)
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL..."
    sudo apt-get update
    sudo apt-get install -y postgresql postgresql-contrib
fi

# Create database and user
echo "🗄️  Setting up database..."
sudo -u postgres psql -c "CREATE DATABASE ecrumedia_portal;" || true
sudo -u postgres psql -c "CREATE USER ecrumedia WITH ENCRYPTED PASSWORD 'your_secure_password_here';" || true
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ecrumedia_portal TO ecrumedia;" || true

# Create app directory
mkdir -p ~/app/backend
mkdir -p ~/app/dist

# Create .env file for backend
cat > ~/app/backend/.env << 'EOF'
# Database
DATABASE_URL="postgresql://ecrumedia:your_secure_password_here@localhost:5432/ecrumedia_portal"

# JWT
JWT_SECRET="your_jwt_secret_here_change_this_in_production"
JWT_EXPIRES_IN="7d"

# Frontend URL (update with your domain)
FRONTEND_URL="https://yourdomain.com"

# Server
PORT=3000

# Email (configure if using email features)
EMAIL_HOST=""
EMAIL_PORT=587
EMAIL_USER=""
EMAIL_PASS=""
EMAIL_FROM=""
EOF

echo "✅ Initial setup complete!"
echo ""
echo "⚠️  IMPORTANT: Next steps:"
echo "1. Edit ~/app/backend/.env and update passwords and secrets"
echo "2. Configure your web server (nginx/apache) to:"
echo "   - Serve frontend files from ~/app/dist"
echo "   - Proxy /api/* requests to http://localhost:3000"
echo "3. Set up GitHub secrets in your repository:"
echo "   - SERVER_HOST: your server IP or domain"
echo "   - SERVER_USER: your SSH username"
echo "   - SERVER_SSH_KEY: your SSH private key"
echo "4. Push to main branch to trigger deployment"
