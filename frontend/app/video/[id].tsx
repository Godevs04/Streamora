import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator, Share, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Linking } from 'react-native';
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
  const [disliked, setDisliked] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [volume, setVolume] = useState(1.0);
  const [isMuted, setIsMuted] = useState(false);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [moreExpanded, setMoreExpanded] = useState(false);
  const toggleMore = () => setMoreExpanded((v) => !v);
  
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
      Alert.alert('Download', 'Opening video URL...');
    }
  };

  const handleSavePress = () => {
    Alert.alert('Saved', 'Added to your saved list');
  };

  const handleReportPress = () => {
    Alert.alert('Reported', 'Thank you for your report. Our team will review it.');
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
                shouldPlay={true}
                useNativeControls={false}
                isLooping={false}
                onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
                onLoad={() => {
                  console.log('Video loaded successfully');
                  setIsVideoLoading(false);
                }}
                onError={(error) => {
                  console.error('Video error:', error);
                  setIsVideoLoading(false);
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
                <Text style={styles.videoTitle}>{video.title}</Text>
                
                <View style={styles.videoStats}>
                  <Text style={styles.statsText}>
                    {formatCount(video.views)} views • {formatCount(likesCount)} likes • {formatRelativeTime(video.createdAt)}
                  </Text>
                </View>

                {/* Horizontal Actions Bar (Portrait) */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRow}>
                  <TouchableOpacity style={styles.actionPill} onPress={handleLikePress}>
                    <MaterialIcons name={liked ? 'favorite' : 'favorite-border'} size={20} color={liked ? colors.error : colors.text.primary} />
                    <Text style={styles.actionPillText}>{formatCount(likesCount)}</Text>
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

                  <TouchableOpacity style={styles.actionPill} onPress={handleSavePress}>
                    <MaterialIcons name="add" size={20} color={colors.text.primary} />
                    <Text style={styles.actionPillText}>Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionPill} onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}>
                    <MaterialIcons name="chat-bubble-outline" size={20} color={colors.text.primary} />
                    <Text style={styles.actionPillText}>Comments {(video.comments?.length || 0)}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionPill} onPress={toggleMore}>
                    <MaterialIcons name={moreExpanded ? 'expand-less' : 'expand-more'} size={20} color={colors.text.primary} />
                    <Text style={styles.actionPillText}>{moreExpanded ? 'Less' : 'More'}</Text>
                  </TouchableOpacity>
                </ScrollView>

                {moreExpanded && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.actionsRowSecondary}>
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
    borderRadius: 0,
    overflow: 'hidden',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
    marginTop: 12,
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
    borderRadius: 0,
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
