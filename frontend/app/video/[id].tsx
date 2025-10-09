import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Share, Platform, Modal } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { getVideoComments, addComment, toggleLikeComment } from '../../services/videos';
import { useLocalSearchParams, useRouter, Stack, useNavigation, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import Avatar from '../../components/Avatar';
import { getVideoById, incrementVideoView, toggleLikeVideo } from '../../services/videos';
import { checkSubscriptionStatus, subscribeToUser, unsubscribeFromUser } from '../../services/user';
import { formatCount, formatRelativeTime, formatDuration } from '../../utils/formatDate';
import { Video as VideoType } from '../../types';
import { useColors } from '../../hooks/useColors';
import config from '../../constants/config';
import useAuthStore from '../../store/useAuthStore';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

export default function VideoPlayer() {
  const { id, focus } = useLocalSearchParams();
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const customAlert = useCustomAlert();
  const colors = useColors();
  const styles = createStyles(colors);
  const { user } = useAuthStore();
  const [video, setVideo] = useState<VideoType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [disliked, setDisliked] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<any[]>([]);
  const [commentsSort, setCommentsSort] = useState<'top' | 'newest'>('top');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [moreExpanded, setMoreExpanded] = useState(false);
  const toggleMore = () => setMoreExpanded((v) => !v);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [qualityLabel, setQualityLabel] = useState<'Auto (360p)' | 'Auto'>('Auto (360p)');
  const [selectedQuality, setSelectedQuality] = useState('auto');
  const [selectedSpeed, setSelectedSpeed] = useState(1.0);
  const [moreSettingsVisible, setMoreSettingsVisible] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(true);
  const [dataSaverEnabled, setDataSaverEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(true);
  const [qualitySelectionVisible, setQualitySelectionVisible] = useState(false);
  const [speedSelectionVisible, setSpeedSelectionVisible] = useState(false);
  
  const videoId = Array.isArray(id) ? id[0] : id;
  
  // Quality options
  const qualityOptions = [
    { value: 'auto', label: 'Auto (360p)', description: 'Automatically adjusts quality' },
    { value: '144p', label: '144p', description: 'Lowest quality, saves data' },
    { value: '240p', label: '240p', description: 'Low quality' },
    { value: '360p', label: '360p', description: 'Standard quality' },
    { value: '480p', label: '480p', description: 'Good quality' },
    { value: '720p', label: '720p', description: 'HD quality' },
    { value: '1080p', label: '1080p', description: 'Full HD quality' },
  ];
  
  // Playback speed options
  const speedOptions = [
    { value: 0.25, label: '0.25x', description: 'Very slow' },
    { value: 0.5, label: '0.5x', description: 'Slow' },
    { value: 0.75, label: '0.75x', description: 'Slightly slow' },
    { value: 1.0, label: 'Normal', description: 'Normal speed' },
    { value: 1.25, label: '1.25x', description: 'Slightly fast' },
    { value: 1.5, label: '1.5x', description: 'Fast' },
    { value: 2.0, label: '2x', description: 'Very fast' },
  ];
  
  // RadioButton component for elegant selection
  const RadioButton = ({ selected, onPress, label, description, value }: {
    selected: boolean;
    onPress: () => void;
    label: string;
    description: string;
    value: any;
  }) => (
    <TouchableOpacity style={styles.radioOption} onPress={onPress}>
      <View style={styles.radioContent}>
        <View style={styles.radioInfo}>
          <Text style={[styles.radioLabel, selected && styles.radioLabelSelected]}>{label}</Text>
          <Text style={styles.radioDescription}>{description}</Text>
        </View>
        <View style={[styles.radioButton, selected && styles.radioButtonSelected]}>
          {selected && <View style={styles.radioButtonInner} />}
        </View>
      </View>
    </TouchableOpacity>
  );
  
  useEffect(() => {
    fetchVideo();
    
    // Return cleanup function to restore orientation when leaving the screen
    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [videoId]);

  // Open comments if navigated with focus=comments
  useEffect(() => {
    if (focus === 'comments') {
      setCommentsVisible(true);
    }
  }, [focus]);

  const loadComments = async (sort: 'top' | 'newest' = commentsSort) => {
    if (!video?._id) return;
    
    try {
      setCommentsLoading(true);
      const res = await getVideoComments(video._id, { page: 1, limit: 50, sort: sort as any });
      
      // The API interceptor returns response.data directly, so res is already the data
      let commentsList: any[] = [];
      
      if ((res as any)?.data?.comments && Array.isArray((res as any).data.comments)) {
        // Structure: { data: { comments: [...] } }
        commentsList = (res as any).data.comments;
      } else if (Array.isArray((res as any)?.comments)) {
        // Structure: { comments: [...] }
        commentsList = (res as any).comments;
      } else if (Array.isArray((res as any)?.data)) {
        // Structure: { data: [...] }
        commentsList = (res as any).data;
      }
      
      setComments(commentsList);
    } catch (e) {
      console.error('Error loading comments:', e);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (commentsVisible && video?._id) {
      loadComments('top');
    }
  }, [commentsVisible, video?._id]);

  // Also load comments when video is first loaded (for better UX)
  useEffect(() => {
    if (video?._id && !commentsVisible) {
      // Preload comments in background
      loadComments('top');
    }
  }, [video?._id]);

  // Check subscription status when video loads
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !video?.owner?._id) return;
      
      try {
        const { token } = useAuthStore.getState();
        if (!token) return;
        
        const response = await checkSubscriptionStatus(video.owner._id, token);
        if (response?.data?.isSubscribed) {
          setIsSubscribed(true);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    };
    
    checkSubscription();
  }, [user, video?.owner?._id]);
  
  const fetchVideo = async () => {
    if (!videoId) {
      setError('Video ID is required');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      setIsVideoLoading(true);
      const response = await getVideoById(videoId);
      
      // Make sure we have a valid response with data
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      const responseData = response.data;
      
      // Log the received video data to help debug
      console.log('Received video data:', JSON.stringify(responseData));
      
      // Extract video data from the response - it's nested under 'video' property
      const fetchedVideo = (responseData as any).video || responseData;
      
      console.log('Video URL:', fetchedVideo.videoUrl);
      console.log('Video ID:', fetchedVideo._id);
      
      // Only validate that we have some video data, don't be too strict
      if (!fetchedVideo) {
        throw new Error('No video data received');
      }
      
      // Ensure all required properties exist to prevent undefined errors
      const validatedVideo = {
        ...fetchedVideo,
        _id: fetchedVideo._id || fetchedVideo.id,
        videoUrl: fetchedVideo.videoUrl,
        owner: fetchedVideo.owner || { name: 'Unknown User', avatarUrl: null },
        likes: fetchedVideo.likes || [],
        likesCount: fetchedVideo.likesCount || 0,
        commentsCount: typeof fetchedVideo.commentsCount === 'number' ? fetchedVideo.commentsCount : (Array.isArray(fetchedVideo.comments) ? fetchedVideo.comments.length : 0),
        views: fetchedVideo.views || 0,
        duration: fetchedVideo.duration || 0,
        description: fetchedVideo.description || '',
        createdAt: fetchedVideo.createdAt || new Date().toISOString(),
        updatedAt: fetchedVideo.updatedAt || new Date().toISOString(),
      };
      
      // Validate that we have the essential video data
      if (!validatedVideo._id) {
        throw new Error('Video ID is missing from response');
      }
      
      if (!validatedVideo.videoUrl) {
        throw new Error('Video URL is missing from response');
      }
      
      console.log('Validated video data:', {
        id: validatedVideo._id,
        videoUrl: validatedVideo.videoUrl,
        title: validatedVideo.title
      });
      
      setVideo(validatedVideo);
      
      // Safely check if likes array exists before calling includes
      setLiked(user && validatedVideo.likes && Array.isArray(validatedVideo.likes) ? 
        validatedVideo.likes.includes(user._id) : false);
      setLikesCount(validatedVideo.likesCount);
      
      // Increment view count
      try {
        if (validatedVideo._id) {
          await incrementVideoView(validatedVideo._id);
        }
      } catch (viewError) {
        console.error('Error incrementing view count:', viewError);
      }
    } catch (error: any) {
      console.error('Error fetching video:', error);
      setError(error.message || 'Failed to load video');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    setStatus(status);
    
    if (status.isLoaded) {
      setIsVideoLoading(false);
      
      // Auto-hide controls after 3 seconds of playback
      if (status.isPlaying && showControls) {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      }
      
      // If video ended, show play button for replay
      if ((status as any).didJustFinish) {
        setShowControls(true);
      }
    }
  };
  
  const togglePlay = async () => {
    if (!videoRef.current) return;
    
    if (status?.isLoaded) {
      if (status.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    }
    
    // Show controls when toggling play state
    setShowControls(true);
  };

  const replayVideo = async () => {
    if (!videoRef.current) return;
    
    await videoRef.current.setPositionAsync(0);
    await videoRef.current.playAsync();
    setShowControls(true);
  };

  const toggleMute = async () => {
    if (!videoRef.current) return;
    
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (newMutedState) {
      await videoRef.current.setVolumeAsync(0);
    } else {
      await videoRef.current.setVolumeAsync(volume);
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    if (!videoRef.current) return;
    
    setVolume(newVolume);
    if (!isMuted) {
      await videoRef.current.setVolumeAsync(newVolume);
    }
  };
  
  const toggleFullscreen = async () => {
    if (isFullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    }
    
    setIsFullscreen(!isFullscreen);
  };
  
  const handleLikePress = async () => {
    if (!user || !video) return;
    
    if (!video._id) {
      console.error('Video ID is missing');
      return;
    }
    
    try {
      const response = await toggleLikeVideo(video._id);
      const { liked: isLiked, likesCount: newLikesCount } = response.data;
      
      setLiked(isLiked);
      setLikesCount(newLikesCount || 0);
    } catch (error) {
      console.error('Error toggling like:', error);
      // Fallback behavior - toggle like locally if API fails
      setLiked(!liked);
      setLikesCount(liked ? Math.max(0, likesCount - 1) : likesCount + 1);
    }
  };
  
  const handleSharePress = async () => {
    if (!video) return;
    
    if (!video._id) {
      console.error('Video ID is missing for sharing');
      return;
    }
    
    try {
      // Use the configured APP_URL instead of hardcoded URL
      const shareUrl = `${config.API.BASE_URL}/video/${video._id}`;
      console.log('Sharing video with URL:', shareUrl);
      
      await Share.share({
        message: `Check out this video: ${video.title}`,
        url: shareUrl,
        title: video.title,
      });
    } catch (error) {
      console.error('Error sharing video:', error);
    }
  };

  const handleDislikePress = () => {
    // simple local toggle; backend dislike not implemented
    setDisliked(!disliked);
  };

  const handleDownloadPress = async () => {
    if (!video?.videoUrl) return;
    try {
      await Linking.openURL(video.videoUrl);
    } catch (e) {
      customAlert.show({
        title: 'Download',
        message: 'Opening video URL...',
        type: 'info',
        verticalButtons: true
      });
    }
  };

  const handleSavePress = () => {
    customAlert.show({
      title: 'Saved',
      message: 'Added to your saved list',
      type: 'success'
    });
  };

  const handleReportPress = () => {
    customAlert.show({
      title: 'Reported',
      message: 'Thank you for your report. Our team will review it.',
      type: 'success'
    });
  };
  
  const handleVideoPress = async () => {
    if (isLocked) {
      setShowControls(!showControls);
      return;
    }
    try {
      if (status?.isLoaded && status.isPlaying) {
        await videoRef.current?.pauseAsync();
      } else if (status?.isLoaded) {
        await videoRef.current?.setRateAsync(playbackRate, true);
        await videoRef.current?.playAsync();
      }
    } catch (e) {}
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 3000);
  };
  
  const handleBackPress = () => {
    router.back();
  };
  
  const getFormattedDuration = () => {
    if (!status?.isLoaded) return '0:00';
    
    const positionMillis = status.positionMillis || 0;
    const durationMillis = status.durationMillis || 0;
    
    const position = Math.floor(positionMillis / 1000);
    const duration = Math.floor(durationMillis / 1000);
    
    return `${formatDuration(position)} / ${formatDuration(duration)}`;
  };
  
  const getProgressPercentage = () => {
    if (!status?.isLoaded) return 0;
    
    const positionMillis = status.positionMillis || 0;
    const durationMillis = status.durationMillis || 0;
    
    if (durationMillis === 0) return 0;
    return (positionMillis / durationMillis) * 100;
  };
  
  if (isLoading) {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.loadingContainer}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading video...</Text>
      </LinearGradient>
    );
  }
  
  if (error || !video) {
    return (
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.errorContainer}
      >
        <MaterialIcons name="error-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error || 'Video not found'}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }
  
  return (
    <>
      <StatusBar style={isFullscreen ? 'light' : 'auto'} hidden={isFullscreen} />
      {!isFullscreen && (
        <Stack.Screen
          options={{
            title: video.title,
            headerShown: false,
          }}
        />
      )}
      <SafeAreaView style={styles.container} edges={isFullscreen ? [] : undefined}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.gradient}
        >
          <View style={[
            styles.videoContainer,
            isFullscreen && styles.fullscreenVideoContainer
          ]}>
            <TouchableOpacity
              activeOpacity={1}
              onPress={handleVideoPress}
              style={styles.videoWrapper}
            >
              <Video
                ref={videoRef}
                source={{ 
                  uri: video.videoUrl,
                  headers: Platform.OS === 'android' ? {
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36'
                  } : undefined
                }}
                style={[styles.video, isFullscreen && styles.fullscreenVideo]}
                resizeMode={isFullscreen ? ResizeMode.COVER : ResizeMode.CONTAIN}
                shouldPlay={true}
                useNativeControls={false}
                isLooping={false}
                progressUpdateIntervalMillis={1000}
                positionMillis={0}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                onLoad={() => {
                  console.log('Video loaded successfully');
                  setIsVideoLoading(false);
                }}
                onError={(error) => {
                  console.error('Video error:', error);
                  setIsVideoLoading(false);
                  // Try to reload video on Android decoder errors
                  if (Platform.OS === 'android' && typeof error === 'string' && error.includes('decoder')) {
                    setTimeout(() => {
                      videoRef.current?.replayAsync();
                    }, 1000);
                  }
                }}
                onLoadStart={() => {
                  console.log('Video loading started');
                  setIsVideoLoading(true);
                }}
              />
              
              {isVideoLoading && (
                <View style={styles.videoLoadingOverlay}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.videoLoadingText}>Loading video...</Text>
                </View>
              )}
              
              {!isVideoLoading && (!status?.isLoaded || !status?.isPlaying || (status?.isLoaded && (status as any).didJustFinish)) && (
                <View style={styles.playButtonOverlay}>
                  <TouchableOpacity
                    style={styles.playButtonOverlayButton}
                    onPress={(status?.isLoaded && (status as any).didJustFinish) ? replayVideo : togglePlay}
                  >
                    <MaterialIcons
                      name={(status?.isLoaded && (status as any).didJustFinish) ? "replay" : "play-arrow"}
                      size={64}
                      color="white"
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Floating action buttons removed in portrait to match requested UI */}
              
              {/* Top Controls - Back Button Only */}
              {showControls && !isFullscreen && (
                <TouchableOpacity
                  style={styles.backButtonVideo}
                  onPress={handleBackPress}
                >
                  <MaterialIcons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
              )}

              {/* Bottom Controls - Progress, Time, Volume, Fullscreen */}
              {showControls && (
                <View style={styles.bottomControlsOverlay}>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBackground} />
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${getProgressPercentage()}%` }
                      ]}
                    />
                  </View>
                  
                  <View style={styles.timeControls}>
                    <Text style={styles.durationText}>
                      {getFormattedDuration()}
                    </Text>
                    
                    <View style={styles.volumeControls}>
                      <TouchableOpacity
                        style={styles.volumeButton}
                        onPress={toggleMute}
                      >
                        <MaterialIcons
                          name={isMuted ? 'volume-off' : 'volume-up'}
                          size={20}
                          color="white"
                        />
                      </TouchableOpacity>
                      
                      <View style={styles.volumeSlider}>
                        <View style={styles.volumeTrack} />
                        <View 
                          style={[
                            styles.volumeFill,
                            { width: `${(isMuted ? 0 : volume) * 100}%` }
                          ]} 
                        />
                        <TouchableOpacity
                          style={[
                            styles.volumeThumb,
                            { left: `${(isMuted ? 0 : volume) * 100}%` }
                          ]}
                          onPress={() => {
                            // Cycle through volume levels
                            const volumeLevels = [0, 0.3, 0.7, 1.0];
                            const currentIndex = volumeLevels.findIndex(v => Math.abs(v - volume) < 0.1);
                            const nextIndex = (currentIndex + 1) % volumeLevels.length;
                            handleVolumeChange(volumeLevels[nextIndex]);
                          }}
                        />
                      </View>
                    </View>
                    
                    <TouchableOpacity
                      style={styles.fullscreenButton}
                      onPress={toggleFullscreen}
                    >
                      <MaterialIcons
                        name={isFullscreen ? 'fullscreen-exit' : 'fullscreen'}
                        size={24}
                        color="white"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {!isFullscreen && (
            <ScrollView style={styles.contentContainer} ref={scrollRef}>
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>{video.title || 'Untitled Video'}</Text>
                
                <View style={styles.videoStats}>
                  <Text style={styles.statsText}>
                    {formatCount(typeof video.views === 'number' ? video.views : 0)} views • {formatCount(typeof likesCount === 'number' ? likesCount : 0)} likes • {formatRelativeTime(video.createdAt || new Date().toISOString())}
                  </Text>
                </View>

                {/* Horizontal Actions Bar (Portrait) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
                  <TouchableOpacity style={styles.actionPill} onPress={handleLikePress}>
                    <MaterialIcons name={liked ? 'favorite' : 'favorite-border'} size={20} color={liked ? colors.error : colors.text.primary} />
                    <Text style={styles.actionPillText}>{formatCount(typeof likesCount === 'number' ? likesCount : 0)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionPill} onPress={handleDislikePress}>
                    <MaterialIcons name={disliked ? 'thumb-down-alt' : 'thumb-down-off-alt'} size={20} color={colors.text.primary} />
                    <Text style={styles.actionPillText}>Dislike</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionPill} onPress={handleSharePress}>
                    <MaterialIcons name="share" size={20} color={colors.text.primary} />
                    <Text style={styles.actionPillText}>Share</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionPill} onPress={handleDownloadPress}>
                    <MaterialIcons name="download" size={20} color={colors.text.primary} />
                    <Text style={styles.actionPillText}>Download</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionPill} onPress={() => setSettingsVisible(true)}>
                      <MaterialIcons name="settings" size={20} color={colors.text.primary} />
                      <Text style={styles.actionPillText}>Options</Text>
                    </TouchableOpacity>

                <TouchableOpacity style={styles.actionPill} onPress={() => setCommentsVisible(true)}>
                    <MaterialIcons name="chat-bubble-outline" size={20} color={colors.text.primary} />
                  <Text style={styles.actionPillText}>Comments {video?.commentsCount || 0}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionPill} onPress={toggleMore}>
                    <MaterialIcons name={moreExpanded ? 'expand-less' : 'expand-more'} size={20} color={colors.text.primary} />
                    <Text style={styles.actionPillText}>{moreExpanded ? 'Less' : 'More'}</Text>
                  </TouchableOpacity>
                </ScrollView>

                {moreExpanded && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRowSecondary}>
                   
                    <TouchableOpacity style={styles.actionPill} onPress={handleSavePress}>
                    <MaterialIcons name="add" size={20} color={colors.text.primary} />
                    <Text style={styles.actionPillText}>Save</Text>
                  </TouchableOpacity>
                    <TouchableOpacity style={styles.actionPill} onPress={handleReportPress}>
                      <MaterialIcons name="flag" size={20} color={colors.text.primary} />
                      <Text style={styles.actionPillText}>Report</Text>
                    </TouchableOpacity>
                  </ScrollView>
                )}
                
                {video.owner ? (
                  <View style={styles.channelContainer}>
                    <View style={styles.channelInfo}>
                      <Avatar
                        uri={video.owner.avatarUrl}
                        name={video.owner.name || 'User'}
                        size="md"
                      />
                      <View style={styles.channelText}>
                        <Text style={styles.channelName}>{video.owner.name || 'User'}</Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={[styles.subscribeButton, isSubscribed && styles.subscribedButton]}
                      onPress={async () => {
                        if (!user) {
                          customAlert.show({
  title: 'Login Required',
  message: 'Please login to subscribe to channels',
  type: 'warning',
  verticalButtons: true
});
                          return;
                        }
                        
                        try {
                          const { token } = useAuthStore.getState();
                          
                          if (!token) {
                            customAlert.show({
  title: 'Error',
  message: 'Authentication token not found',
  type: 'error',
  verticalButtons: true
});
                            return;
                          }
                          
                          if (isSubscribed) {
                            await unsubscribeFromUser(video.owner._id, token);
                            setIsSubscribed(false);
                            customAlert.show({
  title: 'Unsubscribed',
  message: `You have unsubscribed from ${video.owner.name}`,
  type: 'success'
});
                          } else {
                            await subscribeToUser(video.owner._id, token);
                            setIsSubscribed(true);
                            customAlert.show({
  title: 'Subscribed',
  message: `You have subscribed to ${video.owner.name}`,
  type: 'success'
});
                          }
                        } catch (error: any) {
                          console.error('Subscription error:', error);
                          customAlert.show({
  title: 'Error',
  message: error.message || 'Failed to update subscription',
  type: 'error'
});
                        }
                      }}
                    >
                      <Text style={styles.subscribeText}>{isSubscribed ? 'Subscribed' : 'Subscribe'}</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.channelContainer}>
                    <View style={styles.channelInfo}>
                      <Avatar
                        uri={null}
                        name="User"
                        size="md"
                      />
                      <View style={styles.channelText}>
                        <Text style={styles.channelName}>Unknown User</Text>
                      </View>
                    </View>
                    
                    <TouchableOpacity 
                      style={[styles.subscribeButton, isSubscribed && styles.subscribedButton]}
                      onPress={async () => {
                        if (!user) {
                          customAlert.show({
  title: 'Login Required',
  message: 'Please login to subscribe to channels',
  type: 'warning',
  verticalButtons: true
});
                          return;
                        }
                        
                        try {
                          const { token } = useAuthStore.getState();
                          
                          if (!token) {
                            customAlert.show({
  title: 'Error',
  message: 'Authentication token not found',
  type: 'error',
  verticalButtons: true
});
                            return;
                          }
                          
                          if (isSubscribed) {
                            await unsubscribeFromUser(video.owner._id, token);
                            setIsSubscribed(false);
                            customAlert.show({
  title: 'Unsubscribed',
  message: `You have unsubscribed from ${video.owner.name}`,
  type: 'success'
});
                          } else {
                            await subscribeToUser(video.owner._id, token);
                            setIsSubscribed(true);
                            customAlert.show({
  title: 'Subscribed',
  message: `You have subscribed to ${video.owner.name}`,
  type: 'success'
});
                          }
                        } catch (error: any) {
                          console.error('Subscription error:', error);
                          customAlert.show({
  title: 'Error',
  message: error.message || 'Failed to update subscription',
  type: 'error'
});
                        }
                      }}
                    >
                      <Text style={styles.subscribeText}>{isSubscribed ? 'Subscribed' : 'Subscribe'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
                
                {video.description && (
                  <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionText}>
                      {video.description}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
          {/* Settings Bottom Sheet */}
          <Modal
            visible={settingsVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setSettingsVisible(false)}
          >
            <View style={styles.modalBackdrop}>
              <TouchableOpacity
                style={styles.modalBackdropTouchable}
                activeOpacity={1}
                onPress={() => setSettingsVisible(false)}
              />
              <View style={styles.sheet}>
                <View style={styles.sheetHandleContainer}>
                  <View style={styles.sheetHandle} />
                </View>

                <TouchableOpacity style={styles.sheetRow} onPress={() => {
                  setSettingsVisible(false);
                  setQualitySelectionVisible(true);
                }}>
                  <View style={styles.sheetRowLeft}>
                    <MaterialIcons name="tune" size={22} color={colors.text.primary} />
                    <Text style={styles.sheetRowText}>Quality</Text>
                  </View>
                  <Text style={styles.sheetRowValue}>{qualityOptions.find(q => q.value === selectedQuality)?.label}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.sheetRow} onPress={() => {
                  setSettingsVisible(false);
                  setSpeedSelectionVisible(true);
                }}>
                  <View style={styles.sheetRowLeft}>
                    <MaterialIcons name="slow-motion-video" size={22} color={colors.text.primary} />
                    <Text style={styles.sheetRowText}>Playback speed</Text>
                  </View>
                  <Text style={styles.sheetRowValue}>{speedOptions.find(s => s.value === selectedSpeed)?.label}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.sheetRow} onPress={() => setCaptionsEnabled(!captionsEnabled)}>
                  <View style={styles.sheetRowLeft}>
                    <MaterialIcons name="closed-caption" size={22} color={colors.text.primary} />
                    <Text style={styles.sheetRowText}>Captions</Text>
                  </View>
                  <Text style={styles.sheetRowValue}>{captionsEnabled ? 'On' : 'Off'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.sheetRow} onPress={() => setIsLocked(!isLocked)}>
                  <View style={styles.sheetRowLeft}>
                    <MaterialIcons name="lock" size={22} color={colors.text.primary} />
                    <Text style={styles.sheetRowText}>Lock screen</Text>
                  </View>
                  <Text style={styles.sheetRowValue}>{isLocked ? 'Locked' : 'Unlocked'}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.sheetRow} onPress={() => {
                  setSettingsVisible(false);
                  setMoreSettingsVisible(true);
                }}>
                  <View style={styles.sheetRowLeft}>
                    <MaterialIcons name="more-horiz" size={22} color={colors.text.primary} />
                    <Text style={styles.sheetRowText}>More</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={22} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Quality Selection Modal */}
          <Modal
            visible={qualitySelectionVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setQualitySelectionVisible(false)}
          >
            <View style={styles.modalBackdrop}>
              <TouchableOpacity
                style={styles.modalBackdropTouchable}
                activeOpacity={1}
                onPress={() => setQualitySelectionVisible(false)}
              />
              <View style={styles.sheet}>
                <View style={styles.sheetHandleContainer}>
                  <View style={styles.sheetHandle} />
                </View>
                
                <View style={styles.sheetHeader}>
                  <TouchableOpacity onPress={() => {
                    setQualitySelectionVisible(false);
                    setSettingsVisible(true);
                  }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                  <Text style={styles.sheetTitle}>Select Quality</Text>
                  <TouchableOpacity onPress={() => setQualitySelectionVisible(false)}>
                    <MaterialIcons name="close" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.sheetContent}>
                  {qualityOptions.map((option) => (
                    <RadioButton
                      key={option.value}
                      selected={selectedQuality === option.value}
                      onPress={() => {
                        setSelectedQuality(option.value);
                        setQualityLabel(option.label as any);
                        setQualitySelectionVisible(false);
                        setSettingsVisible(true);
                      }}
                      label={option.label}
                      description={option.description}
                      value={option.value}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* Speed Selection Modal */}
          <Modal
            visible={speedSelectionVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setSpeedSelectionVisible(false)}
          >
            <View style={styles.modalBackdrop}>
              <TouchableOpacity
                style={styles.modalBackdropTouchable}
                activeOpacity={1}
                onPress={() => setSpeedSelectionVisible(false)}
              />
              <View style={styles.sheet}>
                <View style={styles.sheetHandleContainer}>
                  <View style={styles.sheetHandle} />
                </View>
                
                <View style={styles.sheetHeader}>
                  <TouchableOpacity onPress={() => {
                    setSpeedSelectionVisible(false);
                    setSettingsVisible(true);
                  }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                  <Text style={styles.sheetTitle}>Select Playback Speed</Text>
                  <TouchableOpacity onPress={() => setSpeedSelectionVisible(false)}>
                    <MaterialIcons name="close" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.sheetContent}>
                  {speedOptions.map((option) => (
                    <RadioButton
                      key={option.value}
                      selected={selectedSpeed === option.value}
                      onPress={async () => {
                        setSelectedSpeed(option.value);
                        setPlaybackRate(option.value);
                        try { 
                          await videoRef.current?.setRateAsync(option.value, true); 
                        } catch (error) {
                          console.error('Error setting playback rate:', error);
                        }
                        setSpeedSelectionVisible(false);
                        setSettingsVisible(true);
                      }}
                      label={option.label}
                      description={option.description}
                      value={option.value}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>

          {/* More Settings Modal */}
          <Modal
            visible={moreSettingsVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setMoreSettingsVisible(false)}
          >
            <View style={styles.modalBackdrop}>
              <TouchableOpacity
                style={styles.modalBackdropTouchable}
                activeOpacity={1}
                onPress={() => setMoreSettingsVisible(false)}
              />
              <View style={styles.sheet}>
                <View style={styles.sheetHandleContainer}>
                  <View style={styles.sheetHandle} />
                </View>
                
                <View style={styles.sheetHeader}>
                  <TouchableOpacity onPress={() => {
                    setMoreSettingsVisible(false);
                    setSettingsVisible(true);
                  }}>
                    <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                  <Text style={styles.sheetTitle}>More Settings</Text>
                  <TouchableOpacity onPress={() => setMoreSettingsVisible(false)}>
                    <MaterialIcons name="close" size={24} color={colors.text.primary} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.sheetContent}>
                  <TouchableOpacity style={styles.sheetRow} onPress={() => setAutoplayEnabled(!autoplayEnabled)}>
                    <View style={styles.sheetRowLeft}>
                      <MaterialIcons name="play-arrow" size={22} color={colors.text.primary} />
                      <Text style={styles.sheetRowText}>Autoplay</Text>
                    </View>
                    <Text style={styles.sheetRowValue}>{autoplayEnabled ? 'On' : 'Off'}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.sheetRow} onPress={() => setDataSaverEnabled(!dataSaverEnabled)}>
                    <View style={styles.sheetRowLeft}>
                      <MaterialIcons name="data-usage" size={22} color={colors.text.primary} />
                      <Text style={styles.sheetRowText}>Data Saver</Text>
                    </View>
                    <Text style={styles.sheetRowValue}>{dataSaverEnabled ? 'On' : 'Off'}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.sheetRow} onPress={() => setDarkModeEnabled(!darkModeEnabled)}>
                    <View style={styles.sheetRowLeft}>
                      <MaterialIcons name="dark-mode" size={22} color={colors.text.primary} />
                      <Text style={styles.sheetRowText}>Dark Mode</Text>
                    </View>
                    <Text style={styles.sheetRowValue}>{darkModeEnabled ? 'On' : 'Off'}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.sheetRow} onPress={() => {
                    customAlert.show({
                      title: 'Video Info',
                      message: `Title: ${video?.title}\nDuration: ${video?.duration}s\nViews: ${video?.views || 0}`,
                      type: 'info'
                    });
                  }}>
                    <View style={styles.sheetRowLeft}>
                      <MaterialIcons name="info" size={22} color={colors.text.primary} />
                      <Text style={styles.sheetRowText}>Video Info</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color={colors.text.primary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.sheetRow} onPress={() => {
                    customAlert.show({
                      title: 'Report Video',
                      message: 'Report this video for inappropriate content?',
                      type: 'warning',
                      buttons: [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Report', 
                          style: 'destructive', 
                          onPress: () => customAlert.show({
                            title: 'Reported',
                            message: 'Thank you for your feedback',
                            type: 'success'
                          })
                        }
                      ]
                    });
                  }}>
                    <View style={styles.sheetRowLeft}>
                      <MaterialIcons name="flag" size={22} color={colors.text.primary} />
                      <Text style={styles.sheetRowText}>Report Video</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={22} color={colors.text.primary} />
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </View>
          </Modal>

          {isLocked && (
            <View style={styles.lockOverlay} pointerEvents="box-none">
              {showControls && (
                <TouchableOpacity style={styles.unlockButton} onPress={() => setIsLocked(false)}>
                  <MaterialIcons name="lock-open" size={20} color="white" />
                  <Text style={styles.unlockText}>Unlock</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Comments Bottom Sheet */}
          <Modal
            visible={commentsVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setCommentsVisible(false)}
          >
            <View style={styles.modalBackdrop}>
              <TouchableOpacity style={styles.modalBackdropTouchable} activeOpacity={1} onPress={() => setCommentsVisible(false)} />
              <View style={styles.sheet}>
                <View style={styles.sheetHandleContainer}>
                  <View style={styles.sheetHandle} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <Text style={styles.commentsHeader}>Comments</Text>
                  <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity onPress={() => { setCommentsSort('top'); loadComments('top'); }}>
                      <Text style={[styles.sortPill, commentsSort === 'top' && styles.sortPillActive]}>Top</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setCommentsSort('newest'); loadComments('newest'); }}>
                      <Text style={[styles.sortPill, commentsSort === 'newest' && styles.sortPillActive]}>Newest</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <ScrollView style={styles.commentsScrollView} showsVerticalScrollIndicator={false}>
                  {commentsLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={styles.loadingText}>Loading comments...</Text>
                    </View>
                  ) : (
                    <>
                      {comments.map((c: any) => (
                        <View key={c._id || Math.random().toString()} style={styles.commentRow}>
                          <View style={styles.commentHeader}>
                            <View style={styles.commentAuthorInfo}>
                              <View style={styles.commentAvatar}>
                                <Text style={styles.commentAvatarText}>
                                  {(c.author?.name || 'U').charAt(0).toUpperCase()}
                                </Text>
                              </View>
                              <View style={styles.commentMeta}>
                                <Text style={styles.commentAuthor}>{c.author?.name || 'User'}</Text>
                                <Text style={styles.commentTime}>
                                  {formatRelativeTime(c.createdAt || new Date().toISOString())}
                                </Text>
                              </View>
                            </View>
                            <TouchableOpacity 
                              style={styles.likeButton}
                              onPress={async () => {
                                try {
                                  const res = await toggleLikeComment(c._id);
                                  const data = res?.data || {};
                                  setComments(prev => prev.map(item => item._id === c._id ? { ...item, likesCount: data.likesCount } : item));
                                } catch {}
                              }}
                            >
                              <MaterialIcons name="favorite-border" size={16} color={colors.text.secondary} />
                              <Text style={styles.commentLikes}>{c.likesCount || 0}</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.commentText}>{c.text}</Text>
                        </View>
                      ))}
                      {comments.length === 0 && (
                        <View style={styles.emptyCommentsContainer}>
                          <MaterialIcons name="chat-bubble-outline" size={48} color={colors.text.secondary} />
                          <Text style={styles.emptyComments}>No comments yet</Text>
                          <Text style={styles.emptyCommentsSubtext}>Be the first to comment!</Text>
                        </View>
                      )}
                    </>
                  )}
                </ScrollView>
                <View style={styles.addCommentRow}>
                  <View style={styles.commentInputContainer}>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Add a comment..."
                      placeholderTextColor={colors.text.secondary}
                      value={newComment}
                      onChangeText={setNewComment}
                      multiline
                      maxLength={500}
                    />
                    <View style={styles.commentInputFooter}>
                      <Text style={styles.characterCount}>
                        {newComment.length}/500
                      </Text>
                      <TouchableOpacity
                        style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                        onPress={async () => {
                          if (!newComment.trim() || !video?._id) return;
                          try {
                            await addComment(video._id, newComment.trim());
                            setNewComment('');
                            // Update local comments state immediately for better UX
                            const optimisticComment = {
                              _id: 'temp_' + Date.now(),
                              text: newComment.trim(),
                              author: { name: user?.name || 'You' },
                              video: video._id,
                              createdAt: new Date().toISOString(),
                              updatedAt: new Date().toISOString(),
                              likesCount: 0
                            };
                            setComments(prev => [...prev, optimisticComment]);
                            // Optimistically bump commentsCount on the video
                            setVideo(prev => prev ? {
                              ...prev,
                              commentsCount: ((typeof prev.commentsCount === 'number' ? prev.commentsCount : (Array.isArray(prev.comments) ? prev.comments.length : 0)) + 1)
                            } : prev);
                            await loadComments(commentsSort);
                          } catch {}
                        }}
                        disabled={!newComment.trim()}
                      >
                        <MaterialIcons 
                          name="send" 
                          size={20} 
                          color={newComment.trim() ? colors.text.primary : colors.text.secondary} 
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </Modal>
        </LinearGradient>
      </SafeAreaView>
      
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
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  videoContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 0,
    overflow: 'hidden',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
  },
  actionsRowSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
    marginTop: 8,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginRight: 8,
  },
  actionPillText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 13,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalBackdropTouchable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: 'rgba(20,20,20,0.98)',
    paddingBottom: 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
  },
  sheetHandleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)'
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  sheetRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetRowText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  sheetRowValue: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  radioOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  radioContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  radioInfo: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginBottom: 4,
  },
  radioLabelSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  radioDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: colors.primary,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  commentsHeader: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  commentsScrollView: {
    maxHeight: 320,
  },
  commentRow: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.08)'
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  commentAvatarText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  commentMeta: {
    flex: 1,
  },
  commentAuthor: {
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 2,
  },
  commentTime: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  commentText: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 42,
  },
  emptyCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyComments: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  emptyCommentsSubtext: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  sortPill: {
    color: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: 8,
    overflow: 'hidden',
  },
  sortPillActive: {
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  commentLikes: {
    color: colors.text.secondary,
    fontSize: 12,
    marginLeft: 4,
  },
  addCommentRow: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  commentInputContainer: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
  },
  commentInput: {
    color: colors.text.primary,
    fontSize: 14,
    minHeight: 40,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  commentInputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  characterCount: {
    color: colors.text.secondary,
    fontSize: 12,
  },
  sendButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 12,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  unlockText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  actionsListContainer: {
    marginTop: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 10,
  },
  actionItemText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  fullscreenVideoContainer: {
    aspectRatio: undefined,
    height: '100%',
    width: '100%',
    borderRadius: 0,
    backgroundColor: '#000',
  },
  fullscreenVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  videoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoControls: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'space-between',
  },
  bottomControlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 3,
  },
  backButtonVideo: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  playButton: {
    alignSelf: 'center',
  },
  bottomControls: {
    width: '100%',
    padding: 8,
  },
  progressContainer: {
    height: 4,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  timeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  fullscreenButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  videoInfo: {
    padding: 20,
    backgroundColor: colors.background.primary,
  },
  videoTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 26,
  },
  videoStats: {
    marginBottom: 20,
  },
  statsText: {
    color: colors.text.secondary,
    fontSize: 15,
    fontWeight: '500',
  },
  // Removed old action button styles - now using videoActionButtons
  channelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  channelText: {
    marginLeft: 12,
    flex: 1,
  },
  channelName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  subscribedButton: {
    backgroundColor: colors.background.tertiary,
  },
  subscribeText: {
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  descriptionContainer: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.background.secondary,
    marginTop: 8,
  },
  descriptionText: {
    color: colors.text.secondary,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  videoLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  videoLoadingText: {
    color: 'white',
    marginTop: 16,
    fontSize: 16,
  },
  playButtonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 3,
  },
  playButtonOverlayButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 50,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  volumeControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  volumeButton: {
    padding: 4,
    marginRight: 8,
  },
  volumeSlider: {
    width: 60,
    height: 20,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeTrack: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  volumeFill: {
    position: 'absolute',
    top: 8,
    left: 0,
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  volumeThumb: {
    position: 'absolute',
    top: 4,
    width: 12,
    height: 12,
    backgroundColor: 'white',
    borderRadius: 6,
    marginLeft: -6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  videoActionButtons: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    alignItems: 'center',
    zIndex: 4,
  },
  videoActionButton: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 25,
    padding: 8,
    width: 50,
    height: 50,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
  videoActionText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
    minWidth: 40,
  },
});
