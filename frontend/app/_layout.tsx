import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import * as Notifications from 'expo-notifications';
import useAuthStore from '../store/useAuthStore';
import { 
  registerDeviceForNotifications, 
  addNotificationListener, 
  addNotificationResponseListener 
} from '../utils/notifications';

// Prevent auto-hiding splash screen
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Add any custom fonts here if needed
  });
  
  const colorScheme = useColorScheme();
  const { checkAuth, isLoading, isAuthenticated } = useAuthStore();
  
  // Notification response listener ref
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  
  useEffect(() => {
    const initApp = async () => {
      // Check if user is authenticated
      await checkAuth();
      
      // Hide splash screen when fonts are loaded and auth check is complete
      if (fontsLoaded) {
        SplashScreen.hideAsync();
      }
    };
    
    initApp();
  }, [fontsLoaded]);
  
  // Set up notification listeners when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Register device for notifications
      registerDeviceForNotifications();
      
      // Set up notification listeners
      notificationListener.current = addNotificationListener(notification => {
        console.log('Notification received:', notification);
      });
      
      responseListener.current = addNotificationResponseListener(response => {
        console.log('Notification response:', response);
        // Handle notification response (e.g., navigate to specific screen)
      });
      
      // Clean up listeners on unmount
      return () => {
        if (notificationListener.current) {
          Notifications.removeNotificationSubscription(notificationListener.current);
        }
        
        if (responseListener.current) {
          Notifications.removeNotificationSubscription(responseListener.current);
        }
      };
    }
  }, [isAuthenticated]);
  
  // If fonts are still loading or auth check is in progress, keep splash screen visible
  if (!fontsLoaded || isLoading) {
    return null;
  }
  
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#000000',
          },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="(auth)/login"
          options={{
            title: 'Login',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(auth)/register"
          options={{
            title: 'Register',
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}