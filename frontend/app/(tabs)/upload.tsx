import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image, StyleSheet, Dimensions, ActivityIndicator, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { Video, ResizeMode } from 'expo-av';
import Icon from 'react-native-vector-icons/Ionicons';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import AuthRequiredWrapper from '../../components/AuthRequiredWrapper';
import { uploadVideo } from '../../services/videos';
import { useColors } from '../../hooks/useColors';
import config from '../../constants/config';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

export default function Upload() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isCustomThumbnail, setIsCustomThumbnail] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '4:3' | '1:1' | '9:16'>('16:9');
  const [videoType, setVideoType] = useState<'normal' | 'shorts'>('normal');
  const [isLoading, setIsLoading] = useState(false);
  const [thumbnailGenerating, setThumbnailGenerating] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0); // Set to 12:00 PM tomorrow
    return tomorrow;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const customAlert = useCustomAlert();
  const colors = useColors();
  const styles = createStyles(colors);

  // Initialize date/time pickers when scheduled is enabled
  const handleScheduleToggle = () => {
    if (!isScheduled) {
      // When enabling schedule, set to tomorrow at 12 PM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      setScheduledDate(tomorrow);
    }
    setIsScheduled(!isScheduled);
  };
  
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
      customAlert.show({
        title: 'Permission Required',
        message: 'Please allow access to your media library to upload videos.',
        type: 'warning',
        icon: 'warning'
      });
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
          customAlert.show({
            title: 'File Too Large',
            message: `Video size should be less than ${config.UPLOAD.MAX_VIDEO_SIZE / (1024 * 1024)}MB`,
            type: 'error',
            icon: 'error-outline'
          });
          return;
        }
        
        setVideoUri(asset.uri);
        
        // Set video duration if available (keep in milliseconds to match backend)
        if (asset.duration) {
          setVideoDuration(Math.round(asset.duration));
        }
        
        // Generate thumbnail from video
        await generateThumbnail(asset.uri);
      }
    } catch (error) {
      console.error('Error picking video:', error);
      customAlert.show({
        title: 'Error',
        message: 'Failed to select video. Please try again.',
        type: 'error',
        icon: 'error-outline'
      });
    }
  };
  
  const pickThumbnail = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      customAlert.show({
        title: 'Permission Required',
        message: 'Please allow access to your media library to select a thumbnail.',
        type: 'warning',
        icon: 'warning'
      });
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
      customAlert.show({
        title: 'Error',
        message: 'Failed to select thumbnail. Please try again.',
        type: 'error',
        icon: 'error-outline'
      });
    }
  };
  
  const handleUpload = async () => {
    if (!title.trim()) {
customAlert.show({
  title: 'Error',
  message: 'Please enter a title for your video',
  type: 'error',
  icon: 'error-outline',
  verticalButtons: true
});
      return;
    }
    
    if (!videoUri) {
customAlert.show({
  title: 'Error',
  message: 'Please select a video to upload',
  type: 'error',
  icon: 'error-outline',
  verticalButtons: true
});
      return;
    }
    
    if (videoType === 'normal' && !thumbnailUri) {
customAlert.show({
  title: 'Error',
  message: 'Please select or generate a thumbnail for normal videos',
  type: 'error',
  icon: 'error-outline',
  verticalButtons: true
});
      return;
    }
    
    // For shorts, auto-generate thumbnail if not provided
    if (videoType === 'shorts' && !thumbnailUri && videoUri) {
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(
          videoUri,
          {
            time: 1000,
            quality: 0.8,
          }
        );
        setThumbnailUri(uri);
      } catch (e) {
        console.warn('Cannot generate thumbnail for shorts', e);
      }
    }
    
    setIsLoading(true);
    setShowProgress(true);
    setUploadProgress(0);
    
    try {
      const tagsArray = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 20;
        });
      }, 200);
      
      await uploadVideo({
        title,
        description,
        tags: tagsArray,
        videoUri,
        thumbnailUri: thumbnailUri || undefined, // Include thumbnail for both shorts and normal videos
        thumbnailAspectRatio: videoType === 'shorts' ? '9:16' : aspectRatio,
        duration: videoDuration,
        type: videoType,
        isScheduled,
        scheduledDate: isScheduled ? scheduledDate : undefined
      });
      
      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Wait a moment then redirect
      setTimeout(() => {
        setShowProgress(false);
        resetForm();
        router.push('/(tabs)/home');
      }, 1000);
      
    } catch (error: any) {
      setShowProgress(false);
      customAlert.show({
        title: 'Upload Failed',
        message: error.message || 'Failed to upload video. Please try again.',
        type: 'error',
        icon: 'error-outline',
        verticalButtons: true
      });
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
    } else if (aspectRatio === '9:16') {
      return {
        width,
        height: width * (16 / 9)
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
  
  // Helper function to reset form
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTags('');
    setVideoUri(null);
    setThumbnailUri(null);
    setVideoDuration(0);
    setVideoType('normal');
    setAspectRatio('16:9');
    setIsScheduled(false);
    setIsCustomThumbnail(false);
    setThumbnailGenerating(false);
    setShowDatePicker(false);
    setShowTimePicker(false);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(12, 0, 0, 0);
    setScheduledDate(tomorrow);
  };

  const handleCancel = () => {
    customAlert.show({
      title: 'Cancel Upload',
      message: 'Are you sure you want to cancel? All progress will be lost.',
      type: 'warning',
      icon: 'warning',
      verticalButtons: true,
      buttons: [
        { text: 'Keep Editing', style: 'cancel' },
        { 
          text: 'Cancel', 
          style: 'destructive',
          onPress: () => {
            resetForm();
            router.back();
          }
        }
      ]
    });
  };
  
  const handleVideoTypeChange = (type: 'normal' | 'shorts') => {
    setVideoType(type);
    
    // For shorts, disable thumbnail and set appropriate aspect ratio
    if (type === 'shorts') {
      setAspectRatio('9:16'); // Vertical aspect ratio for shorts
      setThumbnailUri(null); // Disable thumbnail for shorts
      setIsCustomThumbnail(false);
    } else {
      setAspectRatio('16:9'); // Default horizontal aspect ratio
    }
  };
  
  return (
    <AuthRequiredWrapper>
      {(showAuthModal) => (
        <>
          <LinearGradient
            colors={[colors.gradientStart, colors.gradientEnd]}
            style={styles.container}
          >
            <SafeAreaView style={styles.safeArea} edges={Platform.OS === 'ios' ? ['top'] : []}>
              {/* Header with Back Button */}
              <View style={styles.header}>
                <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
                  <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Upload Video</Text>
                <View style={styles.headerSpacer} />
              </View>
            
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              
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
                      onPress={() => handleVideoTypeChange('normal')}
                    >
                      <Ionicons name="play-circle-outline" size={20} color={videoType === 'normal' ? colors.text.primary : colors.text.secondary} />
                      <Text style={[styles.videoTypeText, videoType === 'normal' && styles.videoTypeTextActive]}>
                        Normal Video
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.videoTypeButton, videoType === 'shorts' && styles.videoTypeButtonActive]}
                      onPress={() => handleVideoTypeChange('shorts')}
                    >
                      <Ionicons name="play-circle" size={20} color={videoType === 'shorts' ? colors.text.primary : colors.text.secondary} />
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
              
              {/* Thumbnail Section - Only for Normal Videos */}
              {videoUri && videoType === 'normal' && (
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
                    style={[styles.textInput, focusedInput === 'title' && styles.textInputFocused]}
                    placeholder="Enter video title"
                    placeholderTextColor={colors.text.secondary}
                    value={title}
                    onChangeText={setTitle}
                    onFocus={() => setFocusedInput('title')}
                    onBlur={() => setFocusedInput(null)}
                    maxLength={100}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.textInput, styles.textAreaInput, focusedInput === 'description' && styles.textInputFocused]}
                    placeholder="Enter video description"
                    placeholderTextColor={colors.text.secondary}
                    value={description}
                    onChangeText={setDescription}
                    onFocus={() => setFocusedInput('description')}
                    onBlur={() => setFocusedInput(null)}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    maxLength={1000}
                  />
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Tags (comma-separated)</Text>
                  <TextInput
                    style={[styles.textInput, focusedInput === 'tags' && styles.textInputFocused]}
                    placeholder="e.g. music, tutorial, vlog"
                    placeholderTextColor={colors.text.secondary}
                    value={tags}
                    onChangeText={setTags}
                    onFocus={() => setFocusedInput('tags')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>

                {/* Schedule Options */}
                <View style={styles.inputContainer}>
                  <View style={styles.scheduleHeader}>
                    <Text style={styles.inputLabel}>Schedule</Text>
                    <TouchableOpacity 
                      style={styles.scheduleToggle}
                      onPress={handleScheduleToggle}
                    >
                      <View style={[styles.toggleSwitch, isScheduled && styles.toggleSwitchActive]}>
                        <View style={[styles.toggleThumb, isScheduled && styles.toggleThumbActive]} />
                      </View>
                      <Text style={styles.toggleLabel}>
                        {isScheduled ? 'Scheduled' : 'Publish Now'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {isScheduled && (
                    <View style={styles.scheduleInputs}>
                      <TouchableOpacity 
                        style={styles.dateTimeButton}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <MaterialIcons name="calendar-today" size={20} color={colors.text.primary} />
                        <Text style={styles.dateTimeText}>
                          {scheduledDate.toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </Text>
                        <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.text.secondary} />
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.dateTimeButton}
                        onPress={() => setShowTimePicker(true)}
                      >
                        <MaterialIcons name="access-time" size={20} color={colors.text.primary} />
                        <Text style={styles.dateTimeText}>
                          {scheduledDate.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </Text>
                        <MaterialIcons name="keyboard-arrow-down" size={20} color={colors.text.secondary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
              
              <Button
                title={`Upload ${videoType === 'shorts' ? 'Short' : 'Video'}`}
                onPress={handleUpload}
                isLoading={isLoading}
                fullWidth
                disabled={!videoUri || (videoType === 'normal' && !thumbnailUri) || !title.trim() || isLoading}
              />
            </ScrollView>
          </SafeAreaView>
        </LinearGradient>
        
        {/* Date Picker */}
        {showDatePicker && (
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Date</Text>
                <TouchableOpacity 
                  onPress={() => setShowDatePicker(false)}
                  style={styles.datePickerCloseButton}
                >
                  <MaterialIcons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={scheduledDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event: any, selectedDate?: Date) => {
                  if (Platform.OS === 'android') {
                    setShowDatePicker(false);
                  }
                  if (selectedDate) {
                    setScheduledDate(selectedDate);
                    if (Platform.OS === 'ios') {
                      setShowDatePicker(false);
                    }
                  }
                }}
                minimumDate={new Date()}
                textColor={colors.text.primary}
                accentColor={colors.primary}
                themeVariant="dark"
              />
            </View>
          </View>
        )}
        
        {/* Time Picker */}
        {showTimePicker && (
          <View style={styles.datePickerOverlay}>
            <View style={styles.datePickerContainer}>
              <View style={styles.datePickerHeader}>
                <Text style={styles.datePickerTitle}>Select Time</Text>
                <TouchableOpacity 
                  onPress={() => setShowTimePicker(false)}
                  style={styles.datePickerCloseButton}
                >
                  <MaterialIcons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={scheduledDate}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event: any, selectedTime?: Date) => {
                  if (Platform.OS === 'android') {
                    setShowTimePicker(false);
                  }
                  if (selectedTime) {
                    const newDate = new Date(scheduledDate);
                    newDate.setHours(selectedTime.getHours());
                    newDate.setMinutes(selectedTime.getMinutes());
                    setScheduledDate(newDate);
                    if (Platform.OS === 'ios') {
                      setShowTimePicker(false);
                    }
                  }
                }}
                textColor={colors.text.primary}
                accentColor={colors.primary}
                themeVariant="dark"
              />
            </View>
          </View>
        )}
        
        {/* Upload Progress Modal */}
        <Modal
          visible={showProgress}
          transparent
          animationType="fade"
          statusBarTranslucent={Platform.OS === 'android'}
        >
          <View style={styles.progressBackdrop}>
            <View style={styles.progressContainer}>
              <View style={styles.progressIconContainer}>
                <MaterialIcons name="cloud-upload" size={48} color={colors.primary} />
              </View>
              
              <Text style={styles.progressTitle}>
                {isScheduled ? 'Scheduling Video' : 'Uploading Video'}
              </Text>
              
              <Text style={styles.progressMessage}>
                {isScheduled 
                  ? 'Your video is being scheduled...' 
                  : 'Please wait while your video uploads...'
                }
              </Text>
              
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressBarFill, 
                      { width: `${uploadProgress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(uploadProgress)}%
                </Text>
              </View>
            </View>
          </View>
        </Modal>

        {/* Custom Alert */}
        <CustomAlert
          visible={customAlert.visible}
          title={customAlert.config.title}
          message={customAlert.config.message}
          buttons={customAlert.config.buttons}
          type={customAlert.config.type}
          icon={customAlert.config.icon}
          onClose={customAlert.hide}
        />
        </>
      )}
    </AuthRequiredWrapper>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
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
    backgroundColor: colors.background.secondary,
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
    color: colors.text.primary,
    marginTop: 8,
    fontWeight: '500',
  },
  uploadLimitText: {
    color: colors.text.secondary,
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
    color: colors.text.primary,
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
    backgroundColor: colors.background.tertiary,
  },
  aspectRatioButtonActive: {
    backgroundColor: colors.primary,
  },
  aspectRatioText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '500',
  },
  aspectRatioTextActive: {
    color: colors.text.primary,
  },
  thumbnailContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailGeneratingContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  thumbnailGeneratingText: {
    color: colors.text.primary,
    marginTop: 12,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.secondary,
  },
  thumbnailPlaceholderText: {
    color: colors.text.secondary,
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
    color: colors.text.primary,
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: colors.background.tertiary,
    color: colors.text.primary,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    fontSize: 16,
    fontWeight: '500',
  },
  textInputFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.background.secondary,
  },
  videoTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  videoTypeText: {
    color: colors.text.secondary,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  videoTypeTextActive: {
    color: colors.text.primary,
  },
  videoTypeDescription: {
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40, // Same width as the back button to maintain balance
  },
  // Schedule styles
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  toggleLabel: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  scheduleInputs: {
    marginTop: 8,
    gap: 8,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.background.secondary,
    gap: 8,
  },
  dateTimeText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  // Date Picker Modal Styles
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  datePickerContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  datePickerTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  datePickerCloseButton: {
    padding: 4,
  },
  // Progress Modal Styles
  progressBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 320,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  progressIconContainer: {
    marginBottom: 20,
  },
  progressTitle: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressMessage: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  progressBarContainer: {
    width: '100%',
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: colors.background.tertiary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
});
