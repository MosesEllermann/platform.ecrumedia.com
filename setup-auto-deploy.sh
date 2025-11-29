#!/bin/bash

# Auto-Deploy Setup Script for GitHub Actions
# This script helps you set up automatic deployments

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║     AUTOMATIC DEPLOYMENT SETUP FOR GITHUB ACTIONS            ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_HOST="ecrumedia.com"
SERVER_USER="site22570"
SERVER_PORT="6543"

echo -e "${YELLOW}This script will help you set up automatic deployments.${NC}"
echo ""
echo "You need to add these secrets to GitHub:"
echo ""
echo -e "${GREEN}1. SERVER_HOST:${NC} $SERVER_HOST"
echo -e "${GREEN}2. SERVER_USER:${NC} $SERVER_USER"
echo -e "${GREEN}3. SERVER_PORT:${NC} $SERVER_PORT"
echo -e "${GREEN}4. SERVER_PASSWORD:${NC} [your SSH password]"
echo ""

# Check if user wants to continue
read -p "Do you want to test SSH connection first? (y/n): " test_ssh

if [ "$test_ssh" = "y" ]; then
    echo ""
    echo "Testing SSH connection..."
    ssh -p $SERVER_PORT $SERVER_USER@$SERVER_HOST "echo 'SSH connection successful!' && pwd"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ SSH connection works!${NC}"
    else
        echo -e "${RED}✗ SSH connection failed. Check your credentials.${NC}"
        exit 1
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "NEXT STEPS:"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "1. Go to: https://github.com/mosesellermann/platform.ecrumedia.com/settings/secrets/actions"
echo ""
echo "2. Click 'New repository secret' and add each secret:"
echo "   - SERVER_HOST = $SERVER_HOST"
echo "   - SERVER_USER = $SERVER_USER"
echo "   - SERVER_PORT = $SERVER_PORT"
echo "   - SERVER_PASSWORD = [your password]"
echo ""
echo "3. Test deployment by pushing a commit:"
echo "   git add ."
echo "   git commit -m 'Test auto-deployment'"
echo "   git push origin main"
echo ""
echo "4. Monitor deployment at:"
echo "   https://github.com/mosesellermann/platform.ecrumedia.com/actions"
echo ""
echo "═══════════════════════════════════════════════════════════════"

# Optional: Generate SSH key
read -p "Do you want to generate an SSH key for more secure deployments? (y/n): " gen_key

if [ "$gen_key" = "y" ]; then
    echo ""
    echo "Generating SSH key..."
    
    KEY_PATH="$HOME/.ssh/github_deploy_spanel"
    
    if [ -f "$KEY_PATH" ]; then
        echo -e "${YELLOW}Key already exists at $KEY_PATH${NC}"
        read -p "Overwrite? (y/n): " overwrite
        if [ "$overwrite" != "y" ]; then
            echo "Skipping key generation."
            exit 0
        fi
    fi
    
    ssh-keygen -t ed25519 -f "$KEY_PATH" -N "" -C "github-actions-deploy"
    
    echo ""
    echo -e "${GREEN}✓ SSH key generated!${NC}"
    echo ""
    echo "Now copy the public key to your server:"
    echo ""
    echo "ssh-copy-id -i $KEY_PATH.pub -p $SERVER_PORT $SERVER_USER@$SERVER_HOST"
    echo ""
    echo "Then add the PRIVATE key to GitHub Secrets:"
    echo ""
    echo "Secret name: SERVER_SSH_KEY"
    echo "Secret value:"
    echo ""
    cat "$KEY_PATH"
    echo ""
    echo ""
    echo -e "${YELLOW}Copy everything above (including BEGIN/END lines)${NC}"
fi

echo ""
echo -e "${GREEN}Setup complete! Check AUTO_DEPLOY_GUIDE.md for detailed instructions.${NC}"
