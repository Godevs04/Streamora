import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from '../../components/Button';
import { uploadVideo } from '../../services/videos';
import colors from '../../constants/colors';
import config from '../../constants/config';

export default function Upload() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const pickVideo = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your media library to upload videos.'
      );
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: true,
        quality: 1,
        videoMaxDuration: config.UPLOAD.MAX_VIDEO_DURATION,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Check file size
        if (asset.fileSize && asset.fileSize > config.UPLOAD.MAX_VIDEO_SIZE) {
          Alert.alert(
            'File Too Large',
            `Video size should be less than ${config.UPLOAD.MAX_VIDEO_SIZE / (1024 * 1024)}MB`
          );
          return;
        }
        
        setVideoUri(asset.uri);
        
        // In a real app, you would generate a thumbnail here
        // For now, we'll just use a placeholder
        setThumbnailUri(null);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to select video. Please try again.');
    }
  };
  
  const handleUpload = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for your video');
      return;
    }
    
    if (!videoUri) {
      Alert.alert('Error', 'Please select a video to upload');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      
      await uploadVideo({
        title,
        description,
        tags: tagsArray,
        videoUri,
      });
      
      Alert.alert(
        'Upload Successful',
        'Your video has been uploaded successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset form and navigate to home
              setTitle('');
              setDescription('');
              setTags('');
              setVideoUri(null);
              setThumbnailUri(null);
              router.push('/(tabs)/home');
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to upload video. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerClassName="p-4"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="text-white text-xl font-bold mb-6">Upload New Video</Text>
          
          <TouchableOpacity
            onPress={pickVideo}
            className="bg-gray-800 rounded-lg p-4 items-center justify-center mb-6"
            style={{ height: 200 }}
          >
            {videoUri ? (
              <View className="w-full h-full items-center justify-center">
                <Icon name="checkmark-circle" size={48} color={colors.success} />
                <Text className="text-white mt-2">Video Selected</Text>
                <Text className="text-gray-400 text-sm mt-1">Tap to change</Text>
              </View>
            ) : (
              <View className="items-center justify-center">
                <Icon name="cloud-upload-outline" size={48} color={colors.primary} />
                <Text className="text-white mt-2">Select Video</Text>
                <Text className="text-gray-400 text-sm mt-1">
                  Max {config.UPLOAD.MAX_VIDEO_DURATION}s, {config.UPLOAD.MAX_VIDEO_SIZE / (1024 * 1024)}MB
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <View className="mb-4">
            <Text className="text-white mb-1">Title *</Text>
            <TextInput
              className="bg-gray-800 text-white p-3 rounded-lg"
              placeholder="Enter video title"
              placeholderTextColor={colors.gray}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-white mb-1">Description</Text>
            <TextInput
              className="bg-gray-800 text-white p-3 rounded-lg"
              placeholder="Enter video description"
              placeholderTextColor={colors.gray}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={1000}
            />
          </View>
          
          <View className="mb-6">
            <Text className="text-white mb-1">Tags (comma-separated)</Text>
            <TextInput
              className="bg-gray-800 text-white p-3 rounded-lg"
              placeholder="e.g. music, tutorial, vlog"
              placeholderTextColor={colors.gray}
              value={tags}
              onChangeText={setTags}
            />
          </View>
          
          <Button
            title="Upload Video"
            onPress={handleUpload}
            isLoading={isLoading}
            fullWidth
            disabled={!videoUri || !title.trim() || isLoading}
          />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
