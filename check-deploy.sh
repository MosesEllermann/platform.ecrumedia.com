#!/bin/bash
# Simple deployment health check script

SERVER_URL="${1:-http://localhost:3000}"

echo "🔍 Checking ecrumedia platform health..."
echo "Server: $SERVER_URL"
echo ""

# Check backend API
echo -n "Backend API: "
if curl -s -f "$SERVER_URL/api" > /dev/null 2>&1; then
    echo "✅ OK"
else
    echo "❌ FAILED"
fi

echo ""
echo "💡 Usage: ./check-deploy.sh http://yourdomain.com"
