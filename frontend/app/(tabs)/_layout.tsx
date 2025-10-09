import React, { useState } from 'react';
import { Tabs } from 'expo-router/tabs';
import { Pressable, StyleSheet, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APP_ICONS } from '../../utils/iconLoader';
import { useColors } from '../../hooks/useColors';
import useAuthStore from '../../store/useAuthStore';
import LoginPromptModal from '../../components/LoginPromptModal';

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIntent, setCurrentIntent] = useState<{ type: 'post' | 'profile' }>({ type: 'post' });
  const insets = useSafeAreaInsets();
  const colors = useColors();
  
  // Icons are now preloaded in the app's root layout

  const handleAuthRequiredTab = (tabType: 'post' | 'profile') => {
    if (!isAuthenticated) {
      setCurrentIntent({ type: tabType });
      setModalVisible(true);
      return;
    }
    
    // If authenticated, navigate to the tab
    // Use replace instead of navigate to avoid the origin error
    try {
      if (tabType === 'post') {
        router.push('/(tabs)/upload');
      } else {
        router.push(`/(tabs)/${tabType}`);
      }
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            height: 50 + insets.bottom,
            paddingBottom: insets.bottom,
            backgroundColor: colors.background.secondary,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text.secondary,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '400',
            marginBottom: 0,
          },
          tabBarIconStyle: {
            marginTop: 0,
          },
          headerStyle: {
            backgroundColor: colors.background.primary,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            height: 60,
          },
          headerTintColor: colors.text.primary,
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 20,
          },
          headerTitleAlign: 'left',
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={(focused ? APP_ICONS.HOME_FILLED : APP_ICONS.HOME) as any} color={color} size={size} />
            ),
            headerShown: false, // Disable tab header - screen has its own
          }}
        />
        
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Shorts',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name="play-circle-outline" color={color} size={size} />
            ),
            headerShown: false, // Disable tab header - screen has its own
          }}
        />
        
        <Tabs.Screen
          name="upload"
          options={{
            title: 'Post',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={focused ? "add-circle" : "add-circle-outline"} color={color} size={size} />
            ),
            headerShown: false, // Disable tab header - screen has its own
            tabBarButton: (props) => {
              return (
                <Pressable
                  onPress={() => handleAuthRequiredTab('post')}
                  style={props.style}
                >
                  {props.children}
                </Pressable>
              );
            },
          }}
        />
        
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={(focused ? APP_ICONS.PROFILE_FILLED : APP_ICONS.PROFILE) as any} color={color} size={size} />
            ),
            headerShown: false, // Disable tab header - screen has its own
            tabBarButton: (props) => {
              return (
                <Pressable
                  onPress={() => handleAuthRequiredTab('profile')}
                  style={props.style}
                >
                  {props.children}
                </Pressable>
              );
            },
          }}
        />
      </Tabs>

      <LoginPromptModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        intent={currentIntent}
      />
    </>
  );
}

const styles = StyleSheet.create({
  addButtonContainer: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF0000', // YouTube red
    borderRadius: 15,
    marginTop: 3, // Align with other icons
  },
  uploadButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});