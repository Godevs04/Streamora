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
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 24 }}>Upload New Video</Text>
          
          <TouchableOpacity
            onPress={pickVideo}
            style={{ 
              backgroundColor: '#1F2937', 
              borderRadius: 8, 
              padding: 16, 
              alignItems: 'center', 
              justifyContent: 'center', 
              marginBottom: 24,
              height: 200 
            }}
          >
            {videoUri ? (
              <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="checkmark-circle" size={48} color={colors.success} />
                <Text style={{ color: 'white', marginTop: 8 }}>Video Selected</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>Tap to change</Text>
              </View>
            ) : (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="cloud-upload-outline" size={48} color={colors.primary} />
                <Text style={{ color: 'white', marginTop: 8 }}>Select Video</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 4 }}>
                  Max {config.UPLOAD.MAX_VIDEO_DURATION}s, {config.UPLOAD.MAX_VIDEO_SIZE / (1024 * 1024)}MB
                </Text>
              </View>
            )}
          </TouchableOpacity>
          
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: 'white', marginBottom: 4 }}>Title *</Text>
            <TextInput
              style={{ backgroundColor: '#1F2937', color: 'white', padding: 12, borderRadius: 8 }}
              placeholder="Enter video title"
              placeholderTextColor={colors.gray}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
          </View>
          
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: 'white', marginBottom: 4 }}>Description</Text>
            <TextInput
              style={{ backgroundColor: '#1F2937', color: 'white', padding: 12, borderRadius: 8 }}
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
          
          <View style={{ marginBottom: 24 }}>
            <Text style={{ color: 'white', marginBottom: 4 }}>Tags (comma-separated)</Text>
            <TextInput
              style={{ backgroundColor: '#1F2937', color: 'white', padding: 12, borderRadius: 8 }}
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
