import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, Image, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Video, ResizeMode } from 'expo-av';
import Icon from 'react-native-vector-icons/Ionicons';
import { MaterialIcons } from '@expo/vector-icons';
import Button from '../../components/Button';
import AuthRequiredWrapper from '../../components/AuthRequiredWrapper';
import { uploadVideo } from '../../services/videos';
import colors from '../../constants/colors';
import config from '../../constants/config';

export default function Upload() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isCustomThumbnail, setIsCustomThumbnail] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '1:1'>('16:9');
  const [videoType, setVideoType] = useState<'normal' | 'shorts'>('normal');
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnailGenerating, setThumbnailGenerating] = useState(false);
  
  const screenWidth = Dimensions.get('window').width;
  
  // Generate thumbnail from video
  const generateThumbnail = async (videoUri: string) => {
    try {
      setThumbnailGenerating(true);
      const { uri } = await VideoThumbnails.getThumbnailAsync(
        videoUri,
        {
          time: 1000,
          quality: 0.8,
        }
      );
      setThumbnailUri(uri);
      setIsCustomThumbnail(false);
      setThumbnailGenerating(false);
    } catch (e) {
      console.warn('Cannot generate thumbnail', e);
      setThumbnailGenerating(false);
    }
  };
  
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
        
        // Set video duration if available
        if (asset.duration) {
          setVideoDuration(Math.round(asset.duration));
        }
        
        // Generate thumbnail from video
        await generateThumbnail(asset.uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      Alert.alert('Error', 'Failed to select video. Please try again.');
    }
  };
  
  const pickThumbnail = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your media library to select a thumbnail.'
      );
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspectRatio === '16:9' ? [16, 9] : aspectRatio === '4:3' ? [4, 3] : [1, 1],
        quality: 1,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setThumbnailUri(result.assets[0].uri);
        setIsCustomThumbnail(true);
      }
    } catch (error) {
      console.error('Error picking thumbnail:', error);
      Alert.alert('Error', 'Failed to select thumbnail. Please try again.');
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
    
    if (!thumbnailUri) {
      Alert.alert('Error', 'Please select or generate a thumbnail');
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
        thumbnailUri,
        thumbnailAspectRatio: aspectRatio,
        duration: videoDuration,
        type: videoType
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
              setVideoDuration(0);
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
  
  // Calculate thumbnail dimensions based on aspect ratio
  const getThumbnailDimensions = () => {
    const width = screenWidth - 32; // Full width with padding
    
    if (aspectRatio === '16:9') {
      return {
        width,
        height: width * (9 / 16)
      };
    } else if (aspectRatio === '4:3') {
      return {
        width,
        height: width * (3 / 4)
      };
    } else {
      return {
        width,
        height: width
      };
    }
  };
  
  const { width, height } = getThumbnailDimensions();
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  return (
    <AuthRequiredWrapper>
      {(showAuthModal) => (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.container}
        >
          <SafeAreaView style={styles.safeArea}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.headerText}>Upload New Video</Text>
              
              {/* Video Selection */}
              <TouchableOpacity
                onPress={pickVideo}
                style={styles.videoPickerContainer}
              >
                {videoUri ? (
                  <View style={styles.videoSelectedContainer}>
                    <Video
                      source={{ uri: videoUri }}
                      style={styles.videoPreview}
                      resizeMode={ResizeMode.CONTAIN}
                      useNativeControls={false}
                      isLooping={false}
                      shouldPlay={false}
                    />
                    <View style={styles.videoOverlay}>
                      <Icon name="checkmark-circle" size={48} color={colors.success} />
                      <Text style={styles.videoSelectedText}>Video Selected</Text>
                      <Text style={styles.videoChangeText}>Tap to change</Text>
                      {videoDuration > 0 && (
                        <View style={styles.durationBadge}>
                          <Text style={styles.durationText}>{formatDuration(videoDuration)}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={styles.uploadPromptContainer}>
                    <Icon name="cloud-upload-outline" size={48} color={colors.primary} />
                    <Text style={styles.uploadPromptText}>Select Video</Text>
                    <Text style={styles.uploadLimitText}>
                      Max {config.UPLOAD.MAX_VIDEO_DURATION}s, {config.UPLOAD.MAX_VIDEO_SIZE / (1024 * 1024)}MB
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {/* Video Type Selection */}
              {videoUri && (
                <View style={styles.videoTypeSection}>
                  <Text style={styles.sectionTitle}>Video Type</Text>
                  <View style={styles.videoTypeSelector}>
                    <TouchableOpacity 
                      style={[styles.videoTypeButton, videoType === 'normal' && styles.videoTypeButtonActive]}
                      onPress={() => setVideoType('normal')}
                    >
                      <Icon name="play-circle-outline" size={20} color={videoType === 'normal' ? '#FFFFFF' : colors.gray} />
                      <Text style={[styles.videoTypeText, videoType === 'normal' && styles.videoTypeTextActive]}>
                        Normal Video
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.videoTypeButton, videoType === 'shorts' && styles.videoTypeButtonActive]}
                      onPress={() => setVideoType('shorts')}
                    >
                      <Icon name="play-circle" size={20} color={videoType === 'shorts' ? '#FFFFFF' : colors.gray} />
                      <Text style={[styles.videoTypeText, videoType === 'shorts' && styles.videoTypeTextActive]}>
                        Shorts
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.videoTypeDescription}>
                    {videoType === 'shorts' 
                      ? 'Shorts are vertical videos under 60 seconds, perfect for quick content!'
                      : 'Normal videos are traditional horizontal videos for longer content.'
                    }
                  </Text>
                </View>
              )}
              
              {/* Thumbnail Section */}
              {videoUri && (
                <View style={styles.thumbnailSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Thumbnail</Text>
                    <View style={styles.aspectRatioSelector}>
                      <TouchableOpacity 
                        style={[styles.aspectRatioButton, aspectRatio === '16:9' && styles.aspectRatioButtonActive]}
                        onPress={() => setAspectRatio('16:9')}
                      >
                        <Text style={[styles.aspectRatioText, aspectRatio === '16:9' && styles.aspectRatioTextActive]}>16:9</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.aspectRatioButton, aspectRatio === '4:3' && styles.aspectRatioButtonActive]}
                        onPress={() => setAspectRatio('4:3')}
                      >
                        <Text style={[styles.aspectRatioText, aspectRatio === '4:3' && styles.aspectRatioTextActive]}>4:3</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.aspectRatioButton, aspectRatio === '1:1' && styles.aspectRatioButtonActive]}
                        onPress={() => setAspectRatio('1:1')}
                      >
                        <Text style={[styles.aspectRatioText, aspectRatio === '1:1' && styles.aspectRatioTextActive]}>1:1</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={[styles.thumbnailContainer, { width, height }]}>
                    {thumbnailGenerating ? (
                      <View style={styles.thumbnailGeneratingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.thumbnailGeneratingText}>Generating thumbnail...</Text>
                      </View>
                    ) : thumbnailUri ? (
                      <Image
                        source={{ uri: thumbnailUri }}
                        style={{ width, height }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.thumbnailPlaceholder}>
                        <MaterialIcons name="image" size={48} color="#666" />
                        <Text style={styles.thumbnailPlaceholderText}>No thumbnail</Text>
                      </View>
                    )}
                    
                    <View style={styles.thumbnailActions}>
                      <TouchableOpacity 
                        style={styles.thumbnailActionButton}
                        onPress={() => generateThumbnail(videoUri)}
                      >
                        <MaterialIcons name="refresh" size={24} color="white" />
                        <Text style={styles.thumbnailActionText}>Generate</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.thumbnailActionButton}
                        onPress={pickThumbnail}
                      >
                        <MaterialIcons name="add-photo-alternate" size={24} color="white" />
                        <Text style={styles.thumbnailActionText}>Custom</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
              
              {/* Video Details */}
              <View style={styles.formSection}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Title *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter video title"
                    placeholderTextColor={colors.gray}
                    value={title}
                    onChangeText={setTitle}
                    maxLength={100}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.textInput, styles.textAreaInput]}
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
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Tags (comma-separated)</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. music, tutorial, vlog"
                    placeholderTextColor={colors.gray}
                    value={tags}
                    onChangeText={setTags}
                  />
                </View>
              </View>
              
              <Button
                title="Upload Video"
                onPress={handleUpload}
                isLoading={isLoading}
                fullWidth
                disabled={!videoUri || !thumbnailUri || !title.trim() || isLoading}
              />
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
      )}
    </AuthRequiredWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Extra padding for bottom tab bar
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  videoPickerContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 24,
    height: 200,
  },
  videoSelectedContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  videoPreview: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoSelectedText: {
    color: 'white',
    marginTop: 8,
    fontWeight: '500',
  },
  videoChangeText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  uploadPromptContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPromptText: {
    color: 'white',
    marginTop: 8,
    fontWeight: '500',
  },
  uploadLimitText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  thumbnailSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  aspectRatioSelector: {
    flexDirection: 'row',
  },
  aspectRatioButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 8,
    backgroundColor: '#374151',
  },
  aspectRatioButtonActive: {
    backgroundColor: colors.primary,
  },
  aspectRatioText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  aspectRatioTextActive: {
    color: 'white',
  },
  thumbnailContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailGeneratingContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
  },
  thumbnailGeneratingText: {
    color: 'white',
    marginTop: 12,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
  },
  thumbnailPlaceholderText: {
    color: '#9CA3AF',
    marginTop: 8,
  },
  thumbnailActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
  },
  thumbnailActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  thumbnailActionText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 14,
  },
  formSection: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: 'white',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#1F2937',
    color: 'white',
    padding: 12,
    borderRadius: 8,
  },
  textAreaInput: {
    minHeight: 100,
  },
  videoTypeSection: {
    marginBottom: 24,
  },
  videoTypeSelector: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  videoTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    backgroundColor: '#374151',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  videoTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  videoTypeText: {
    color: colors.gray,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  videoTypeTextActive: {
    color: '#FFFFFF',
  },
  videoTypeDescription: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
});
