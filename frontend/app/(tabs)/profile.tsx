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
import useAuthStore from '../../store/useAuthStore';
import { getVideos } from '../../services/videos';
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
      // In a real app, you would have a getUserVideos endpoint
      // For now, we'll just filter by owner using the existing endpoint
      const response = await getVideos({
        page: 1,
        limit: 50,
      });
      
      // Client-side filtering as a fallback
      // In a real app, this would be done on the server
      const userVideos = response.data.filter(video => video.owner._id === user._id);
      
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
  
  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-black">
        <Text className="text-white">Please log in to view your profile</Text>
        <Button
          title="Go to Login"
          onPress={() => router.replace('/(auth)/login')}
          variant="primary"
          size="md"
          className="mt-4"
        />
      </View>
    );
  }
  
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <ScrollView contentContainerClassName="pb-6">
          <View className="p-4 items-center">
            <TouchableOpacity onPress={handleChangeAvatar}>
              <View className="relative">
                <Avatar uri={user.avatarUrl} name={user.name} size="xl" />
                <View className="absolute bottom-0 right-0 bg-primary rounded-full p-1">
                  <Icon name="camera" size={16} color="white" />
                </View>
              </View>
            </TouchableOpacity>
            
            <Text className="text-white text-xl font-bold mt-4">{user.name}</Text>
            
            {user.username && (
              <Text className="text-gray-300 text-base">@{user.username}</Text>
            )}
            
            {user.bio && (
              <Text className="text-gray-300 text-center mt-2 px-10">{user.bio}</Text>
            )}
            
            <View className="flex-row mt-6">
              <Button
                title="Edit Profile"
                onPress={handleEditProfile}
                variant="outline"
                size="sm"
                className="mr-2"
              />
              <Button
                title="Logout"
                onPress={handleLogout}
                variant="secondary"
                size="sm"
              />
            </View>
          </View>
          
          <View className="mt-6">
            <Text className="text-white text-lg font-bold px-4 mb-2">Your Videos</Text>
            
            {isLoading ? (
              <View className="py-10 items-center">
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : videos.length > 0 ? (
              <FlatList
                data={videos}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => <VideoCard video={item} variant="compact" />}
                numColumns={2}
                scrollEnabled={false}
                contentContainerClassName="px-2"
              />
            ) : (
              <View className="py-10 items-center">
                <Icon name="videocam-outline" size={48} color={colors.gray} />
                <Text className="text-white text-base mt-4">No videos yet</Text>
                <Text className="text-gray-400 text-sm mt-1">
                  Upload your first video to get started
                </Text>
                <Button
                  title="Upload Video"
                  onPress={() => router.push('/(tabs)/upload')}
                  variant="primary"
                  size="sm"
                  className="mt-4"
                />
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
