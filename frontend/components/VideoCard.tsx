import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, StyleSheet, Share, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { PreviousIntent, Video } from '../types';
import { formatCount, formatRelativeTime, formatDuration } from '../utils/formatDate';
import useAuthStore from '../store/useAuthStore';
// Use real API for likes on home feed
import { toggleLikeVideo } from '../services/videos';
import { subscribeToUser as apiSubscribe, unsubscribeFromUser as apiUnsubscribe, checkSubscriptionStatus } from '../services/user';
import { APP_ICONS } from '../utils/iconLoader';
import { useColors } from '../hooks/useColors';
import CustomAlert from './CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface VideoCardProps {
  video: Video;
  variant?: 'default' | 'compact';
  showAuthModal: (intent: PreviousIntent) => boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, variant = 'default', showAuthModal }) => {
  const { user } = useAuthStore();
  const screenWidth = Dimensions.get('window').width;
  const [liked, setLiked] = useState(user && video.likes ? video.likes.includes(user._id) : false);
  const [likesCount, setLikesCount] = useState(video.likesCount || 0);
  const [subscribed, setSubscribed] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const customAlert = useCustomAlert();
  const colors = useColors();
  const styles = createStyles(colors);
  
  // Check subscription status when component loads
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || !video?.owner?._id) return;
      
      try {
        const { token } = useAuthStore.getState();
        if (!token) return;
        
        const response = await checkSubscriptionStatus(video.owner._id, token);
        if (response?.data?.isSubscribed) {
          setSubscribed(true);
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
      }
    };
    
    checkSubscription();
  }, [user, video?.owner?._id]);
  
  // Function to get proper thumbnail URL
  const getThumbnailUrl = (video: Video) => {
    const url = video.thumbnailUrl;
    
    // If URL is a video file, try to extract a proper thumbnail
    if (url && (url.includes('.mp4') || url.includes('.mov') || url.includes('.webm'))) {
      // For Cloudinary URLs, we can modify the URL to get an image
      if (url.includes('cloudinary.com') && url.includes('/video/upload/')) {
        // Replace video upload with image transformation
        return url.replace('/video/upload/', '/video/upload/f_jpg,w_640,h_360,c_fill,q_auto,g_auto/');
      }
    }
    
    return url;
  };
  
  // Calculate thumbnail dimensions based on aspect ratio
  const getThumbnailDimensions = () => {
    // Default to 16:9 if not specified
    const aspectRatio = video.thumbnailAspectRatio || '16:9';
    
    if (variant === 'compact') {
      const width = screenWidth / 2 - 16; // 2 columns with padding
      
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
    }
    
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
  
  // Handle video press
  const handlePress = () => {
    // Navigate to video player
    router.push(`/video/${video._id}`);
  };
  
  // Handle profile press
  const handleProfilePress = () => {
    // Check if user is authenticated
    if (!showAuthModal({ type: 'profile', data: { userId: video.owner._id } })) {
      return;
    }
    
    // Navigate to profile page
    router.push(`/profile/${video.owner._id}`);
  };
  
  // Handle like press
  const handleLikePress = async () => {
    // Check if user is authenticated
    if (!showAuthModal({ type: 'like', data: { videoId: video._id } })) {
      return;
    }
    
    if (!video?._id) return;
    try {
      const resp = await toggleLikeVideo(video._id);
      const { liked: isLiked, likesCount: newLikes } = resp.data || {};
      setLiked(Boolean(isLiked));
      if (typeof newLikes === 'number') setLikesCount(newLikes);
    } catch (e) {
      // Fallback local toggle
      setLiked(!liked);
      setLikesCount(liked ? Math.max(0, likesCount - 1) : likesCount + 1);
    }
  };
  
  // Handle dislike press
  const handleDislikePress = () => {
    // Check if user is authenticated
    if (!showAuthModal({ type: 'dislike', data: { videoId: video._id } })) {
      return;
    }
    // Local-only dislike: toggle like off and decrement count if currently liked
    if (liked) {
      setLiked(false);
      setLikesCount(Math.max(0, likesCount - 1));
    }
    customAlert.show({
      title: 'Feedback',
      message: 'Thanks for your feedback',
      type: 'success',
      icon: 'check-circle'
    });
  };
  
  // Handle share press
  const handleSharePress = async () => {
    try {
      const result = await Share.share({
        message: `Check out this video: ${video.title}`,
        url: `https://streamora.com/videos/${video._id}`,
        title: video.title,
      });
      
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
          console.log(`Shared with ${result.activityType}`);
        } else {
          // shared
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing video:', error);
      customAlert.show({
        title: 'Error',
        message: 'Could not share the video',
        type: 'error',
        icon: 'error-outline'
      });
    }
  };
  
  // Handle subscribe press
  const handleSubscribePress = async () => {
    // Check if user is authenticated
    if (!showAuthModal({ type: 'subscribe', data: { userId: video.owner._id } })) {
      return;
    }
    
    if (!user) return;
    
    try {
      const { token } = useAuthStore.getState();
      if (!token) {
        customAlert.show({
          title: 'Error',
          message: 'Authentication token not found',
          type: 'error',
          icon: 'error-outline'
        });
        return;
      }
      
      console.log('Subscription attempt:', {
        currentUserId: user._id,
        targetUserId: video.owner._id,
        subscribed: subscribed
      });
      
      if (subscribed) {
        await apiUnsubscribe(video.owner._id, token);
        setSubscribed(false);
        customAlert.show({
          title: 'Unsubscribed',
          message: `You have unsubscribed from ${video.owner.name}`,
          type: 'success',
          icon: 'check-circle'
        });
      } else {
        await apiSubscribe(video.owner._id, token);
        setSubscribed(true);
        customAlert.show({
          title: 'Subscribed',
          message: `You have subscribed to ${video.owner.name}`,
          type: 'success',
          icon: 'check-circle'
        });
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      
      // Extract specific error message from API response
      let errorMessage = 'Failed to update subscription';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      customAlert.show({
        title: 'Subscription Error',
        message: errorMessage,
        type: 'error',
        icon: 'error-outline'
      });
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Thumbnail */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={[styles.thumbnailContainer, { width, height }]}>
          {video.thumbnailUrl && !imageLoadError ? (
            <Image
              source={{ uri: getThumbnailUrl(video) }}
              style={{ width, height }}
              resizeMode="cover"
              onError={(e) => {
                console.error('Image loading error:', e.nativeEvent.error);
                console.error('Failed thumbnail URL:', video.thumbnailUrl);
                // If image fails to load, update component state to show placeholder
                setImageLoadError(true);
              }}
            />
          ) : (
            <View style={[{ width, height }, styles.placeholderContainer]}>
              <MaterialIcons name="image" size={48} color={colors.text.secondary} />
              <Text style={styles.placeholderText}>No thumbnail</Text>
            </View>
          )}
          
          {/* Duration badge (if available) */}
          {video.duration && video.duration > 0 && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {formatDuration(typeof video.duration === 'number' && video.duration > 1000 ? Math.round(video.duration / 1000) : (video.duration || 0))}
              </Text>
            </View>
          )}
          
          {/* Views badge */}
          <View style={styles.viewsBadge}>
            <Text style={styles.viewsText}>
              {formatCount(typeof video.views === 'number' ? video.views : 0)} views
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Video info */}
      <View style={styles.infoContainer}>
        {variant === 'default' && (
          <TouchableOpacity onPress={handleProfilePress} style={styles.avatarContainer}>
            <Avatar uri={video.owner?.avatarUrl} name={video.owner?.name || 'User'} size="sm" />
          </TouchableOpacity>
        )}
        
        <View style={styles.textContainer}>
          <Text numberOfLines={2} style={styles.titleText}>
            {video.title || 'Untitled Video'}
          </Text>
          
          <View style={styles.metaContainer}>
            <TouchableOpacity onPress={handleProfilePress}>
              <Text style={styles.channelText}>
                {video.owner?.name || 'Unknown User'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.timeText}>
              {formatRelativeTime(video.createdAt || new Date().toISOString())}
            </Text>
          </View>
          
          <View style={styles.actionsContainer}>
            {/* Action buttons */}
            <View style={[styles.actionsRow, variant === 'compact' && styles.actionsRowCompact]}>
              {/* Like/Dislike */}
              <View style={styles.likeDislikeContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={handleLikePress}>
                  <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? colors.text.primary : colors.text.secondary} />
                  <Text style={[styles.actionText, liked && styles.likedText]}>{formatCount(typeof likesCount === 'number' ? likesCount : 0)}</Text>
                </TouchableOpacity>
                <View style={styles.actionDivider} />
                <TouchableOpacity style={styles.actionButton} onPress={handleDislikePress}>
                  <Ionicons name="thumbs-down-outline" size={18} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Comments */}
              <TouchableOpacity style={styles.commentContainer} onPress={() => router.push({ pathname: `/video/${video._id}`, params: { focus: 'comments' } as any })}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.text.secondary} />
                <Text style={styles.actionText}>
                  {formatCount(
                    typeof (video as any).commentsCount === 'number'
                      ? (video as any).commentsCount
                      : (Array.isArray(video.comments) ? video.comments.length : 0)
                  )}
                </Text>
              </TouchableOpacity>

              {/* Share */}
              <TouchableOpacity style={styles.commentContainer} onPress={handleSharePress}>
                <Ionicons name="share-social-outline" size={18} color={colors.text.secondary} />
                <Text style={styles.actionText}></Text>
              </TouchableOpacity>
            </View>

            {/* Subscribe button - positioned absolutely */}
            {variant === 'default' && user && user._id !== video.owner._id && (
              <TouchableOpacity
                onPress={handleSubscribePress}
                style={[styles.subscribeButton, subscribed && styles.subscribedButton]}
              >
                <Text style={styles.subscribeText}>{subscribed ? 'Subscribed' : 'Subscribe'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
      
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
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  thumbnailContainer: {
    borderRadius: 0, // YouTube doesn't use rounded corners
    overflow: 'hidden',
    backgroundColor: colors.background.secondary,
  },
  placeholderContainer: {
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.text.secondary,
    marginTop: 8,
    fontSize: 12,
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  viewsBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  viewsText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  infoContainer: {
    flexDirection: 'row',
    marginTop: 12,
    paddingHorizontal: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleText: {
    color: colors.text.primary,
    fontWeight: '500',
    fontSize: 15,
    lineHeight: 20,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  channelText: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  dotSeparator: {
    color: colors.text.secondary,
    fontSize: 13,
    marginHorizontal: 4,
  },
  timeText: {
    color: colors.text.secondary,
    fontSize: 13,
  },
  actionsContainer: {
    position: 'relative',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginRight: 120, // Reserve space for subscribe button
  },
  actionsRowCompact: {
    justifyContent: 'flex-start',
  },
  leftActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeDislikeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 6,
    flexShrink: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionDivider: {
    width: 1,
    height: '60%',
    backgroundColor: colors.background.secondary,
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    marginRight: 6,
    flexShrink: 0,
  },
  actionText: {
    color: colors.text.secondary,
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  likedText: {
    color: colors.text.primary,
  },
  subscribeButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  subscribedButton: {
    backgroundColor: colors.background.tertiary,
  },
  subscribeText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default VideoCard;
