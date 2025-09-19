import React, { useState } from 'react';
import { Tabs } from 'expo-router/tabs';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../../constants/colors';
import useAuthStore from '../../store/useAuthStore';
import LoginPromptModal from '../../components/LoginPromptModal';

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentIntent, setCurrentIntent] = useState<{ type: 'post' | 'profile' }>({ type: 'post' });

  const handleAuthRequiredTab = (tabType: 'post' | 'profile') => {
    if (!isAuthenticated) {
      setCurrentIntent({ type: tabType });
      setModalVisible(true);
      return;
    }
    
    // If authenticated, navigate to the tab
    router.navigate(`/(tabs)/${tabType}`);
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarStyle: {
            backgroundColor: '#000000',
            borderTopColor: '#222222',
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: '#9CA3AF',
          headerStyle: {
            backgroundColor: '#000000',
          },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Icon name="home" color={color} size={size} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, size }) => (
              <Icon name="compass" color={color} size={size} />
            ),
          }}
        />
        
        <Tabs.Screen
          name="upload"
          options={{
            title: 'Post',
            tabBarIcon: ({ color, size }) => (
              <Icon name="add-circle" color={color} size={size} />
            ),
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
            tabBarIcon: ({ color, size }) => (
              <Icon name="person" color={color} size={size} />
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