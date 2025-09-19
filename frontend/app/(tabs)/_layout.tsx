import React, { useState } from 'react';
import { Tabs } from 'expo-router/tabs';
import { Pressable, StyleSheet, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APP_ICONS } from '../../utils/iconLoader';
import colors from '../../constants/colors';
import useAuthStore from '../../store/useAuthStore';
import LoginPromptModal from '../../components/LoginPromptModal';

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIntent, setCurrentIntent] = useState<{ type: 'post' | 'profile' }>({ type: 'post' });
  const insets = useSafeAreaInsets();
  
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
            backgroundColor: '#0F0F0F', // YouTube's dark background
            borderTopWidth: 0,
          },
          tabBarActiveTintColor: '#FFFFFF', // White for active items like YouTube
          tabBarInactiveTintColor: '#909090', // YouTube's inactive gray
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
            backgroundColor: '#0F0F0F', // YouTube's dark background
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 0,
            height: 60,
          },
          headerTintColor: '#FFFFFF',
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
            headerTitle: 'Streamora',
            headerRight: () => (
              <View style={styles.headerRightContainer}>
                <TouchableOpacity style={styles.headerIconButton}>
                  <Ionicons name={APP_ICONS.SEARCH as any} size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerIconButton}>
                  <Ionicons name={APP_ICONS.NOTIFICATIONS as any} size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ),
          }}
        />
        
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons name={(focused ? APP_ICONS.EXPLORE_FILLED : APP_ICONS.EXPLORE) as any} color={color} size={size} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="upload"
          options={{
            title: 'Post',
            tabBarIcon: ({ color, size, focused }) => (
              <View style={styles.addButtonContainer}>
                <Ionicons name={APP_ICONS.ADD as any} color="#FFFFFF" size={size} />
              </View>
            ),
            tabBarButton: (props) => {
              return (
                <Pressable
                  onPress={() => handleAuthRequiredTab('post')}
                  style={[props.style, styles.uploadButton]}
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
  headerRightContainer: {
    flexDirection: 'row',
    marginRight: 16,
  },
  headerIconButton: {
    marginLeft: 20,
    padding: 4,
  },
});