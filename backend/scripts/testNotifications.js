/**
 * Test script for notification system
 * Run with: node scripts/testNotifications.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { notifyNewVideo, notifyNewComment, notifyNewLike, notifyNewSubscriber } = require('../utils/notificationService');

async function testNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Test notification functions
    console.log('\n🧪 Testing notification system...\n');

    // Test 1: New Video Notification
    console.log('1️⃣ Testing new video notification...');
    const videoResult = await notifyNewVideo(
      '68cc306f3e41f4107f4d11f3', // Creator ID
      'Test Video Title',
      '68e6a8a67bc17b078862f495' // Video ID
    );
    console.log(`✅ New video notifications sent: ${videoResult}`);

    // Test 2: New Comment Notification
    console.log('\n2️⃣ Testing new comment notification...');
    const commentResult = await notifyNewComment(
      '68cc306f3e41f4107f4d11f3', // Video owner ID
      '68d426e2c82966e48f7f071d', // Commenter ID
      'This is a test comment!',
      '68e6a8a67bc17b078862f495' // Video ID
    );
    console.log(`✅ New comment notification sent: ${commentResult}`);

    // Test 3: New Like Notification
    console.log('\n3️⃣ Testing new like notification...');
    const likeResult = await notifyNewLike(
      '68cc306f3e41f4107f4d11f3', // Video owner ID
      '68d426e2c82966e48f7f071d', // Liker ID
      'Test Video Title',
      '68e6a8a67bc17b078862f495' // Video ID
    );
    console.log(`✅ New like notification sent: ${likeResult}`);

    // Test 4: New Subscriber Notification
    console.log('\n4️⃣ Testing new subscriber notification...');
    const subscriberResult = await notifyNewSubscriber(
      '68cc306f3e41f4107f4d11f3', // Creator ID
      '68d426e2c82966e48f7f071d' // Subscriber ID
    );
    console.log(`✅ New subscriber notification sent: ${subscriberResult}`);

    console.log('\n🎉 All notification tests completed!');
    console.log('\n📱 Check your mobile device for notifications (if FCM is properly configured)');
    console.log('💡 In development mode, notifications are logged but not sent to avoid errors');

  } catch (error) {
    console.error('❌ Error testing notifications:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the test
testNotifications();
