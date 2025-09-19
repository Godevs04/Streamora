import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import Avatar from '../../components/Avatar';
import VideoCard from '../../components/VideoCard';
import Button from '../../components/Button';
import AuthRequiredWrapper from '../../components/AuthRequiredWrapper';
import useAuthStore from '../../store/useAuthStore';
import { getDummyVideos } from '../../services/dummyData';
import { Video } from '../../types';
import colors from '../../constants/colors';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    fetchUserVideos();
  }, []);
  
  const fetchUserVideos = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Get dummy videos and filter by the current user
      const allVideos = getDummyVideos();
      const userVideos = allVideos.filter(video => video.owner._id === user._id);
      
      setVideos(userVideos);
    } catch (error) {
      console.error('Error fetching user videos:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  const handleEditProfile = () => {
    // In a real app, this would navigate to an edit profile screen
    Alert.alert('Edit Profile', 'This feature is not implemented yet.');
  };
  
  const handleChangeAvatar = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your media library to change your avatar.'
      );
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // In a real app, you would upload the image to your backend
        Alert.alert('Avatar Update', 'This feature is not fully implemented yet.');
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };
  
  // AuthRequiredWrapper will handle authentication check
  
  return (
    <AuthRequiredWrapper>
      {(showAuthModal) => (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <View style={{ padding: 16, alignItems: 'center' }}>
                <TouchableOpacity onPress={handleChangeAvatar}>
                  <View style={{ position: 'relative' }}>
                    <Avatar uri={user?.avatarUrl} name={user?.name || ''} size="xl" />
                    <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, borderRadius: 999, padding: 4 }}>
                      <Icon name="camera" size={16} color="white" />
                    </View>
                  </View>
                </TouchableOpacity>
                
                <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 16 }}>{user?.name}</Text>
                
                {user?.username && (
                  <Text style={{ color: '#9CA3AF', fontSize: 16 }}>@{user.username}</Text>
                )}
                
                {user?.bio && (
                  <Text style={{ color: '#9CA3AF', textAlign: 'center', marginTop: 8, paddingHorizontal: 40 }}>{user.bio}</Text>
                )}
                
                <View style={{ flexDirection: 'row', marginTop: 24 }}>
                  <Button
                    title="Edit Profile"
                    onPress={handleEditProfile}
                    variant="outline"
                    size="sm"
                    style={{ marginRight: 8 }}
                  />
                  <Button
                    title="Logout"
                    onPress={handleLogout}
                    variant="secondary"
                    size="sm"
                  />
                </View>
              </View>
              
              <View style={{ marginTop: 24 }}>
                <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold', paddingHorizontal: 16, marginBottom: 8 }}>Your Videos</Text>
                
                {isLoading ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                  </View>
                ) : videos.length > 0 ? (
                  <FlatList
                    data={videos}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => <VideoCard video={item} variant="compact" showAuthModal={(intent) => Boolean(showAuthModal(intent))} />}
                    numColumns={2}
                    scrollEnabled={false}
                    contentContainerStyle={{ paddingHorizontal: 8 }}
                  />
                ) : (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <Icon name="videocam-outline" size={48} color={colors.gray} />
                    <Text style={{ color: 'white', fontSize: 16, marginTop: 16 }}>No videos yet</Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>
                      Upload your first video to get started
                    </Text>
                    <Button
                      title="Upload Video"
                      onPress={() => {
                        const isAuthenticated = Boolean(showAuthModal({ type: 'post' }));
                        if (isAuthenticated) {
                          router.push('/(tabs)/upload');
                        }
                      }}
                      variant="primary"
                      size="sm"
                      style={{ marginTop: 16 }}
                    />
                  </View>
                )}
              </View>
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      )}
    </AuthRequiredWrapper>
  );
}
