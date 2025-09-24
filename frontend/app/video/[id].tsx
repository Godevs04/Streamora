import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Share, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import Avatar from '../../components/Avatar';
import { getVideoById, incrementVideoView, toggleLikeVideo } from '../../services/videos';
import { formatCount, formatRelativeTime, formatDuration } from '../../utils/formatDate';
import { Video as VideoType } from '../../types';
import colors from '../../constants/colors';
import config from '../../constants/config';
import useAuthStore from '../../store/useAuthStore';

export default function VideoPlayer() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const videoRef = useRef<Video>(null);
  const { user } = useAuthStore();
  const [video, setVideo] = useState<VideoType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const videoId = Array.isArray(id) ? id[0] : id;
  
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
  
  const fetchVideo = async () => {
    if (!videoId) {
      setError('Video ID is required');
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await getVideoById(videoId);
      
      // Make sure we have a valid response with data
      if (!response || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      const fetchedVideo = response.data;
      
      // Log the received video data to help debug
      console.log('Received video data:', JSON.stringify(fetchedVideo));
      
      // Only validate that we have some video data, don't be too strict
      if (!fetchedVideo) {
        throw new Error('No video data received');
      }
      
      // Ensure all required properties exist to prevent undefined errors
      const validatedVideo = {
        ...fetchedVideo,
        owner: fetchedVideo.owner || { name: 'Unknown User', avatarUrl: null },
        likes: fetchedVideo.likes || [],
        likesCount: fetchedVideo.likesCount || 0,
        views: fetchedVideo.views || 0,
        duration: fetchedVideo.duration || 0,
        description: fetchedVideo.description || '',
        createdAt: fetchedVideo.createdAt || new Date().toISOString(),
        updatedAt: fetchedVideo.updatedAt || new Date().toISOString(),
      };
      
      setVideo(validatedVideo);
      
      // Safely check if likes array exists before calling includes
      setLiked(user && validatedVideo.likes && Array.isArray(validatedVideo.likes) ? 
        validatedVideo.likes.includes(user._id) : false);
      setLikesCount(validatedVideo.likesCount);
      
      // Increment view count
      try {
        await incrementVideoView(videoId);
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
      // Auto-hide controls after 3 seconds of playback
      if (status.isPlaying && showControls) {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
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
  
  const handleVideoPress = () => {
    setShowControls(!showControls);
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
                source={{ uri: video.videoUrl }}
                style={styles.video}
                resizeMode={isFullscreen ? ResizeMode.CONTAIN : ResizeMode.COVER}
                shouldPlay
                useNativeControls={false}
                isLooping
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
              />
              
              {showControls && (
                <View style={styles.videoControls}>
                  {!isFullscreen && (
                    <TouchableOpacity
                      style={styles.backButtonVideo}
                      onPress={handleBackPress}
                    >
                      <MaterialIcons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={togglePlay}
                  >
                    <MaterialIcons
                      name={status?.isLoaded && status.isPlaying ? 'pause' : 'play-arrow'}
                      size={48}
                      color="white"
                    />
                  </TouchableOpacity>
                  
                  <View style={styles.bottomControls}>
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
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          {!isFullscreen && (
            <ScrollView style={styles.contentContainer}>
              <View style={styles.videoInfo}>
                <Text style={styles.videoTitle}>{video.title}</Text>
                
                <View style={styles.videoStats}>
                  <Text style={styles.statsText}>
                    {formatCount(video.views)} views • {formatRelativeTime(video.createdAt)}
                  </Text>
                </View>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleLikePress}
                  >
                    <MaterialIcons
                      name={liked ? 'thumb-up' : 'thumb-up-off-alt'}
                      size={24}
                      color={liked ? colors.primary : 'white'}
                    />
                    <Text style={[styles.actionText, liked && styles.actionTextActive]}>
                      {formatCount(likesCount)}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={handleSharePress}
                  >
                    <MaterialIcons name="share" size={24} color="white" />
                    <Text style={styles.actionText}>Share</Text>
                  </TouchableOpacity>
                </View>
                
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
                    
                    <TouchableOpacity style={styles.subscribeButton}>
                      <Text style={styles.subscribeText}>Subscribe</Text>
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
                    
                    <TouchableOpacity style={styles.subscribeButton}>
                      <Text style={styles.subscribeText}>Subscribe</Text>
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
        </LinearGradient>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
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
  },
  fullscreenVideoContainer: {
    aspectRatio: undefined,
    height: '100%',
  },
  videoWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  videoControls: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'space-between',
  },
  backButtonVideo: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 10,
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
  },
  progressBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  timeControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
  },
  fullscreenButton: {
    padding: 4,
  },
  contentContainer: {
    flex: 1,
  },
  videoInfo: {
    padding: 16,
  },
  videoTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  videoStats: {
    marginBottom: 16,
  },
  statsText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingBottom: 16,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 14,
  },
  actionTextActive: {
    color: colors.primary,
  },
  channelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  channelInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelText: {
    marginLeft: 12,
  },
  channelName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  subscribeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  subscribeText: {
    color: 'white',
    fontWeight: '500',
  },
  descriptionContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  descriptionText: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
  },
});
