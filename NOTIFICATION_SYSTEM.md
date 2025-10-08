# 🔔 Streamora Notification System

## 📋 Overview

The Streamora notification system provides real-time push notifications for user interactions, keeping users engaged with the platform. The system is built with Firebase Cloud Messaging (FCM) and Expo Notifications.

## 🎯 Notification Types

### 1. **New Video Upload** 📹
- **Trigger**: When a user uploads a new video
- **Recipients**: All subscribers of the video creator
- **Message**: `"{Creator Name} uploaded a new video!" - "Check out '{Video Title}'"`

### 2. **New Comment** 💬
- **Trigger**: When someone comments on a video
- **Recipients**: Video owner (if not commenting on their own video)
- **Message**: `"{Commenter Name} commented on your video" - "{Comment text...}"`

### 3. **New Like** ❤️
- **Trigger**: When someone likes a video
- **Recipients**: Video owner (if not liking their own video)
- **Message**: `"{Liker Name} liked your video" - "{Video Title}"`

### 4. **New Subscriber** 👥
- **Trigger**: When someone subscribes to a user
- **Recipients**: The user being subscribed to
- **Message**: `"{Subscriber Name} subscribed to you!" - "You have a new subscriber"`

## 🏗️ Architecture

### Backend Components

#### 1. **Notification Service** (`backend/utils/notificationService.js`)
- Centralized notification management
- Template-based message generation
- Batch notification sending
- Subscriber-based notifications

#### 2. **FCM Controller** (`backend/controllers/notificationsController.js`)
- Device registration
- Push notification sending
- FCM token management

#### 3. **Integration Points**
- **Video Controller**: New video and like notifications
- **Comment Controller**: New comment notifications
- **User Controller**: New subscriber notifications

### Frontend Components

#### 1. **Notification Utils** (`frontend/utils/notifications.ts`)
- Device registration
- Permission handling
- Token management

#### 2. **App Layout** (`frontend/app/_layout.tsx`)
- Automatic device registration on login
- Notification listeners setup

## 🔧 Configuration

### Firebase Setup
```javascript
// app.config.js
extra: {
  firebase: {
    senderId: "856945155045" // Your Firebase Sender ID
  }
}
```

### Environment Variables
```env
# Backend (.env)
FCM_SENDER_ID=856945155045
FCM_SERVER_KEY=your_fcm_server_key
NODE_ENV=development
```

## 🚀 Usage

### Automatic Notifications
Notifications are sent automatically when users interact with the platform:

1. **Upload Video** → Subscribers get notified
2. **Like Video** → Video owner gets notified
3. **Comment on Video** → Video owner gets notified
4. **Subscribe to User** → User gets notified

### Manual Testing
```bash
# Test all notification types
cd backend
node scripts/testNotifications.js
```

## 📱 Development vs Production

### Development Mode
- Notifications are logged but not sent to avoid FCM setup complexity
- Perfect for testing without real push notifications
- No FCM server key required

### Production Mode
- Full FCM integration
- Real push notifications sent to devices
- Requires proper FCM server key configuration

## 🔍 Monitoring

### Console Logs
```javascript
// Development logs
"Development mode: Skipping FCM push notification"
"Would send to 5 tokens: 'John uploaded a new video!' - 'Check out My Amazing Video'"

// Success logs
"Notification sent to user 68cc306f3e41f4107f4d11f3: John liked your video"
"Sent 3/5 notifications: New video uploaded"
```

### Error Handling
- Non-blocking: Notification failures don't affect app functionality
- Graceful degradation: App continues if notifications fail
- Detailed error logging for debugging

## 🛠️ Troubleshooting

### Common Issues

#### 1. **No Notifications Received**
- Check if device is registered: Look for "Device registered for notifications successfully"
- Verify FCM tokens are stored in user document
- Check Firebase project configuration

#### 2. **Development Mode Notifications**
- Expected behavior: Notifications are logged but not sent
- Switch to production mode for real notifications

#### 3. **Permission Issues**
- Ensure notification permissions are granted
- Check device notification settings

### Debug Steps
1. Check console logs for notification attempts
2. Verify user has FCM tokens in database
3. Test with notification test script
4. Check Firebase project configuration

## 📊 Performance

### Optimizations
- **Non-blocking**: Notifications don't block API responses
- **Batch sending**: Multiple notifications sent efficiently
- **Error isolation**: Notification failures don't affect core functionality
- **Development mode**: Skips actual sending in development

### Scalability
- Handles multiple subscribers efficiently
- Batch notification sending for large subscriber lists
- Graceful handling of FCM rate limits

## 🔐 Security

### Token Management
- FCM tokens stored securely in user documents
- Automatic token cleanup for invalid tokens
- User-specific token isolation

### Privacy
- No sensitive data in notification payloads
- User consent required for notifications
- Opt-out capability through device settings

## 🎉 Success Metrics

The notification system is designed to:
- ✅ **Increase Engagement**: Users stay connected to content creators
- ✅ **Improve Retention**: Regular notifications bring users back
- ✅ **Enhance User Experience**: Real-time updates on interactions
- ✅ **Scale Efficiently**: Handle growing user base without performance issues

## 🔄 Future Enhancements

### Planned Features
- Notification preferences (users can choose what notifications to receive)
- Rich notifications with images
- Notification history
- Push notification analytics
- Custom notification sounds

### Integration Opportunities
- Email notifications as fallback
- SMS notifications for critical updates
- In-app notification center
- Notification scheduling for optimal delivery times

---

## 📞 Support

For issues with the notification system:
1. Check console logs for error messages
2. Verify Firebase configuration
3. Test with the provided test script
4. Check device notification permissions

The notification system is designed to be robust and user-friendly, providing a seamless experience for both content creators and viewers on the Streamora platform.
