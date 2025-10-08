# 🔥 Firebase Configuration Guide for Streamora

## 📋 Your Firebase Project Details
- **Project ID**: `streamora-7bcb1`
- **Project Number**: `856945155045`
- **Sender ID**: `856945155045`
- **Web App ID**: `1:856945155045:web:b36130bed166b18cfe6d0c`

## 🔧 Backend Environment Variables

Add these to your `backend/.env` file:

```env
# Firebase Project Configuration
FIREBASE_PROJECT_ID=streamora-7bcb1
FIREBASE_PROJECT_NUMBER=856945155045
FIREBASE_SENDER_ID=856945155045

# FCM Configuration (for production)
FCM_SERVER_KEY=your_fcm_server_key_here

# Environment
NODE_ENV=development
```

## 🔑 Getting Your FCM Server Key

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your "Streamora" project
3. Go to **Project Settings** (gear icon)

### Step 2: Get Server Key
1. Click on **"Cloud Messaging"** tab
2. Look for **"Server Key"** section
3. Copy the server key
4. Replace `your_fcm_server_key_here` in your `.env` file

### Step 3: Enable Cloud Messaging API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project `streamora-7bcb1`
3. Enable **"Firebase Cloud Messaging API"**

## 🚀 Testing Your Configuration

### Development Mode (Current)
- ✅ Notifications are logged but not sent
- ✅ No FCM server key required
- ✅ Perfect for testing without real notifications

### Production Mode
- 🔔 Real push notifications sent to devices
- 🔑 Requires FCM server key
- 📱 Works with production builds

## 🧪 Test Your Setup

Run the notification test script:
```bash
cd backend
node scripts/testNotifications.js
```

Expected output:
```
🧪 Testing notification system...

1️⃣ Testing new video notification...
Development mode: Skipping FCM push notification
Would send to 3 tokens: "John uploaded a new video!" - "Check out My Amazing Video"
✅ New video notifications sent: 3

2️⃣ Testing new comment notification...
Development mode: Skipping FCM push notification
Would send to 1 tokens: "Jane commented on your video" - "Great video!"
✅ New comment notification sent: true

3️⃣ Testing new like notification...
Development mode: Skipping FCM push notification
Would send to 1 tokens: "Bob liked your video" - "My Amazing Video"
✅ New like notification sent: true

4️⃣ Testing new subscriber notification...
Development mode: Skipping FCM push notification
Would send to 1 tokens: "Alice subscribed to you!" - "You have a new subscriber"
✅ New subscriber notification sent: true

🎉 All notification tests completed!
```

## 📱 Mobile App Configuration

Your frontend is already configured with:
- ✅ **Project ID**: `streamora-7bcb1`
- ✅ **Sender ID**: `856945155045`
- ✅ **Automatic device registration**
- ✅ **Error handling**

## 🔄 Next Steps

### For Development (Current)
- ✅ Everything works perfectly
- ✅ Notifications are logged for testing
- ✅ No additional setup needed

### For Production
1. **Get FCM Server Key** from Firebase Console
2. **Add to backend/.env**:
   ```env
   FCM_SERVER_KEY=your_actual_server_key
   NODE_ENV=production
   ```
3. **Build with EAS** for proper FCM integration
4. **Test on production build**

## 🎯 What Happens Now

### When Users Interact:
1. **Upload Video** → Console: `"Would send to X tokens: 'John uploaded a new video!'"`
2. **Like Video** → Console: `"Would send to 1 tokens: 'John liked your video'"`
3. **Comment** → Console: `"Would send to 1 tokens: 'John commented on your video'"`
4. **Subscribe** → Console: `"Would send to 1 tokens: 'John subscribed to you!'"`

### In Production:
- Same interactions will send real push notifications
- Users will receive notifications on their devices
- Full engagement tracking and analytics

## 🎉 Ready to Go!

Your notification system is now properly configured with your Firebase project! The app will work perfectly in development mode, and when you're ready for production, just add the FCM server key.

**Test it now by:**
1. Uploading a video
2. Liking someone's video
3. Commenting on a video
4. Subscribing to a user

Check your console logs to see the notification system working! 🚀
