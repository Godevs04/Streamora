import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerFCMToken } from '../services/notifications';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications
 * @returns Promise with token
 */
export const registerForPushNotifications = async (): Promise<string | null> => {
  if (!Device.isDevice) {
    console.log('Push notifications are not available in the simulator');
    return null;
  }
  
  // Check if we're in Expo Go (which has limited notification support)
  if (__DEV__) {
    console.log('Development mode: Push notifications are limited in Expo Go');
    console.log('For full notification support, use a development build');
    return null;
  }
  
  // Check if we have permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  // If we don't have permission, ask for it
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  // If we still don't have permission, return null
  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification!');
    return null;
  }
  
  try {
    // Get the token without projectId for Expo Go compatibility
    const token = await Notifications.getExpoPushTokenAsync();
    
    // Configure Android notifications channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }
    
    return token.data;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
};

/**
 * Register FCM token with backend
 * @returns Promise with success status
 */
export const registerDeviceForNotifications = async (): Promise<boolean> => {
  try {
    const token = await registerForPushNotifications();
    
    if (!token) {
      console.log('No push token available, skipping registration');
      return false;
    }
    
    console.log('Registering device with token:', token.substring(0, 20) + '...');
    
    // Register token with backend
    await registerFCMToken(token);
    
    console.log('Device registered for notifications successfully');
    return true;
  } catch (error) {
    console.error('Error registering device for notifications:', error);
    // Don't throw the error, just return false to allow app to continue
    return false;
  }
};

/**
 * Add notification listener
 * @param callback - Callback function to handle notification
 * @returns Subscription
 */
export const addNotificationListener = (
  callback: (notification: Notifications.Notification) => void
) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Add notification response listener
 * @param callback - Callback function to handle notification response
 * @returns Subscription
 */
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};
