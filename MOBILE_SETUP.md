# 📱 Mobile Development Setup Guide

## 🔧 IP Address Management

Your IP address can change daily when using DHCP. Here's how to easily update it:

### 🚀 Quick Update (Recommended)

Run the automated script:
```bash
./update-ip.sh
```

This script will:
- ✅ Automatically detect your current IP address
- ✅ Update `frontend/constants/config.ts`
- ✅ Update `frontend/.env`
- ✅ Show you the new IP address

### 📝 Manual Update (Alternative)

If you prefer to update manually:

1. **Get your current IP address:**
   ```bash
   ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}'
   ```

2. **Update frontend/constants/config.ts:**
   ```typescript
   BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://YOUR_NEW_IP:5001/api',
   ```

3. **Update frontend/.env:**
   ```
   API_BASE_URL=http://YOUR_NEW_IP:5001/api
   ```

### 🔄 After Updating IP

1. **Restart your Expo Go app** to pick up the new configuration
2. **Make sure both devices are on the same WiFi network**
3. **Test the connection**

### 🎯 Current Configuration

- **Backend Server**: Running on `0.0.0.0:5001` (accessible from network)
- **Frontend API**: Points to your network IP address
- **CORS**: Properly configured for cross-origin requests

### 💡 Tips

- Run `./update-ip.sh` whenever you get network errors
- Keep both your computer and mobile device on the same WiFi
- The script is safe to run multiple times
- Your simulator will continue to work with localhost

### 🆘 Troubleshooting

**If you still get network errors:**
1. Check if both devices are on the same WiFi network
2. Verify your IP address hasn't changed
3. Restart the backend server: `cd backend && npm run dev`
4. Restart your Expo Go app

**To check if backend is accessible:**
```bash
curl http://YOUR_IP:5001/health
```
