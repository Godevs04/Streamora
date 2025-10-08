#!/bin/bash

# Script to update IP address for mobile development
# Run this script whenever your IP address changes

echo "🔍 Detecting your current IP address..."

# Get the current IP address
CURRENT_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')

if [ -z "$CURRENT_IP" ]; then
    echo "❌ Could not detect IP address. Please check your network connection."
    exit 1
fi

echo "📍 Current IP address: $CURRENT_IP"

# Update frontend config.ts
FRONTEND_CONFIG="frontend/constants/config.ts"
if [ -f "$FRONTEND_CONFIG" ]; then
    echo "📝 Updating frontend config.ts..."
    sed -i '' "s|http://[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*:5001/api|http://$CURRENT_IP:5001/api|g" "$FRONTEND_CONFIG"
    echo "✅ Frontend config updated"
else
    echo "⚠️  Frontend config file not found: $FRONTEND_CONFIG"
fi

# Update frontend .env file
FRONTEND_ENV="frontend/.env"
if [ -f "$FRONTEND_ENV" ]; then
    echo "📝 Updating frontend .env..."
    sed -i '' "s|http://[0-9]*\.[0-9]*\.[0-9]*\.[0-9]*:5001/api|http://$CURRENT_IP:5001/api|g" "$FRONTEND_ENV"
    echo "✅ Frontend .env updated"
else
    echo "⚠️  Frontend .env file not found: $FRONTEND_ENV"
fi

echo ""
echo "🎉 IP address update complete!"
echo "📍 New IP: $CURRENT_IP"
echo ""
echo "📱 Next steps:"
echo "1. Restart your Expo Go app to pick up the new IP"
echo "2. Make sure your mobile device is on the same WiFi network"
echo "3. Test the connection"
echo ""
echo "💡 Tip: Run this script whenever your IP address changes"
