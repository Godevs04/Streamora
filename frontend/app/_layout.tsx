import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import useAuthStore from '../store/useAuthStore';
import { 
  registerDeviceForNotifications, 
  addNotificationListener, 
  addNotificationResponseListener 
} from '../utils/notifications';
import { preloadIcons } from '../utils/iconLoader';
import { Ionicons } from '@expo/vector-icons';
import ErrorBoundary from '../components/ErrorBoundary';
import { ThemeProvider } from '../contexts/ThemeContext';
import { useColors } from '../hooks/useColors';

// Prevent auto-hiding splash screen
SplashScreen.preventAutoHideAsync().catch(err => {
  console.warn("Error preventing splash screen hide:", err);
});

// Component that uses theme-aware colors
function ThemedStack() {
  const colors = useColors();
  
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Disable headers globally - each screen handles its own
        headerStyle: {
          backgroundColor: colors.background.primary,
        },
        headerTintColor: colors.text.primary,
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        contentStyle: {
          backgroundColor: colors.background.primary,
        },
        headerShadowVisible: false,
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
      <Stack.Screen
        name="profile/[userId]"
        options={{
          title: 'Profile',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="video/[id]"
        options={{
          title: 'Video',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="edit-profile"
        options={{
          title: 'Edit Profile',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

// Component that uses theme-aware colors for loading screen
function ThemedLoadingScreen() {
  const colors = useColors();
  
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.container}
    >
      <ActivityIndicator size="large" color={colors.text.primary} />
      <Text style={{ color: colors.text.primary, marginTop: 20 }}>Loading Streamora...</Text>
    </LinearGradient>
  );
}

// Component that uses theme-aware colors for status bar
function ThemedStatusBar() {
  const colors = useColors();
  
  return (
    <StatusBar 
      style={colors.background.primary === '#FFFFFF' ? 'dark' : 'light'} 
      backgroundColor={colors.background.primary}
      translucent={false}
    />
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Add any custom fonts here if needed
  });
  
  const colorScheme = useColorScheme();
  const { checkAuth, isLoading, isAuthenticated } = useAuthStore();
  
  // Notification response listener ref
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  
  // Force UI to render after a short timeout
  const [forceRender, setForceRender] = React.useState(false);
  
  // Immediately start a timer to force UI rendering
  React.useEffect(() => {
    console.log("Starting force render timer");
    const timer = setTimeout(() => {
      console.log("Force rendering UI");
      setForceRender(true);
      
      // Also hide splash screen after a delay
      setTimeout(() => {
        console.log("Hiding splash screen");
        SplashScreen.hideAsync().catch(err => {
          console.warn("Error hiding splash screen:", err);
        });
      }, 500);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Track icon loading state
  const [iconsLoaded, setIconsLoaded] = useState(false);

  // Load icons on app start
  useEffect(() => {
    const loadAppIcons = async () => {
      try {
        await preloadIcons();
        setIconsLoaded(true);
        console.log('Icons loaded successfully');
      } catch (error) {
        console.error('Failed to load icons:', error);
        // Continue even if icon loading fails
        setIconsLoaded(true);
      }
    };
    
    loadAppIcons();
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        // Check if user is authenticated
        await checkAuth();
      } catch (error) {
        console.error('App initialization failed:', error);
        // Continue even if initialization fails
      } finally {
        // Hide splash screen when fonts and icons are loaded, regardless of auth status
        if ((fontsLoaded && iconsLoaded) || forceRender) {
          try {
            await SplashScreen.hideAsync();
          } catch (error) {
            console.error('Failed to hide splash screen:', error);
          }
        }
      }
    };
    
    initApp();
  }, [fontsLoaded, iconsLoaded, forceRender]);
  
  // Set up notification listeners when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Register device for notifications (non-blocking)
      registerDeviceForNotifications().then(success => {
        if (success) {
          console.log('Device registered for notifications successfully');
        } else {
          console.log('Notification registration skipped or failed');
        }
      }).catch(error => {
        console.log('Notification registration failed, but app continues:', error.message);
      });
      
      // Set up notification listeners
      notificationListener.current = addNotificationListener((notification) => {
        console.log('Notification received:', notification);
      });
      
      responseListener.current = addNotificationResponseListener((response) => {
        console.log('Notification response:', response);
        // Handle notification response (e.g., navigate to specific screen)
      });
      
      // Clean up listeners on unmount
      return () => {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        
        if (responseListener.current) {
          responseListener.current.remove();
        }
      };
    }
  }, [isAuthenticated]);
  
  // Always render UI, but show loading indicator if needed
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ThemeProvider>
            <ThemedStatusBar />
            {(!fontsLoaded || isLoading) && !forceRender ? (
              <ThemedLoadingScreen />
            ) : (
              <ThemedStack />
            )}
          </ThemeProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});