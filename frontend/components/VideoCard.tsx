import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions, StyleSheet, Share, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Avatar from './Avatar';
import { PreviousIntent, Video } from '../types';
import { formatCount, formatRelativeTime } from '../utils/formatDate';
import useAuthStore from '../store/useAuthStore';
import { toggleDummyVideoLike, subscribeToDummyUser } from '../services/dummyData';
import { APP_ICONS } from '../utils/iconLoader';

interface VideoCardProps {
  video: Video;
  variant?: 'default' | 'compact';
  showAuthModal: (intent: PreviousIntent) => boolean;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, variant = 'default', showAuthModal }) => {
  const { user } = useAuthStore();
  const screenWidth = Dimensions.get('window').width;
  const [liked, setLiked] = useState(user ? video.likes.includes(user._id) : false);
  const [likesCount, setLikesCount] = useState(video.likesCount);
  const [subscribed, setSubscribed] = useState(false);
  
  // Calculate thumbnail dimensions
  const getThumbnailDimensions = () => {
    if (variant === 'compact') {
      return {
        width: screenWidth / 2 - 16, // 2 columns with padding
        height: (screenWidth / 2 - 16) * (9 / 16), // 16:9 aspect ratio
      };
    }
    
    return {
      width: screenWidth - 32, // Full width with padding
      height: (screenWidth - 32) * (9 / 16), // 16:9 aspect ratio
    };
  };
  
  const { width, height } = getThumbnailDimensions();
  
  // Handle video press
  const handlePress = () => {
    // In a real app, this would navigate to a video detail screen
    console.log(`Viewing video: ${video._id}`);
  };
  
  // Handle profile press
  const handleProfilePress = () => {
    // Check if user is authenticated
    if (!showAuthModal({ type: 'profile', data: { userId: video.owner._id } })) {
      return;
    }
    
    // In a real app, this would navigate to a profile screen
    console.log(`Viewing profile: ${video.owner._id}`);
  };
  
  // Handle like press
  const handleLikePress = () => {
    // Check if user is authenticated
    if (!showAuthModal({ type: 'like', data: { videoId: video._id } })) {
      return;
    }
    
    // Toggle like
    if (user) {
      const updatedVideo = toggleDummyVideoLike(video._id, user._id);
      if (updatedVideo) {
        setLiked(!liked);
        setLikesCount(updatedVideo.likesCount);
      }
    }
  };
  
  // Handle dislike press
  const handleDislikePress = () => {
    // Check if user is authenticated
    if (!showAuthModal({ type: 'dislike', data: { videoId: video._id } })) {
      return;
    }
    
    // In a real app, this would handle disliking
    Alert.alert('Dislike', 'Video disliked');
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
      Alert.alert('Error', 'Could not share the video');
    }
  };
  
  // Handle subscribe press
  const handleSubscribePress = () => {
    // Check if user is authenticated
    if (!showAuthModal({ type: 'subscribe', data: { userId: video.owner._id } })) {
      return;
    }
    
    // Subscribe to channel
    if (user) {
      const success = subscribeToDummyUser(video.owner._id, user._id);
      if (success) {
        setSubscribed(true);
      }
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
          <Image
            source={{ uri: video.thumbnailUrl }}
            style={{ width, height }}
            resizeMode="cover"
          />
          
          {/* Duration badge (if available) */}
          <View style={styles.viewsBadge}>
            <Text style={styles.viewsText}>
              {formatCount(video.views)} views
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Video info */}
      <View style={styles.infoContainer}>
        {variant === 'default' && (
          <TouchableOpacity onPress={handleProfilePress} style={styles.avatarContainer}>
            <Avatar uri={video.owner.avatarUrl} name={video.owner.name} size="sm" />
          </TouchableOpacity>
        )}
        
        <View style={styles.textContainer}>
          <Text numberOfLines={2} style={styles.titleText}>
            {video.title}
          </Text>
          
          <View style={styles.metaContainer}>
            <TouchableOpacity onPress={handleProfilePress}>
              <Text style={styles.channelText}>
                {video.owner.name}
              </Text>
            </TouchableOpacity>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.timeText}>
              {formatRelativeTime(video.createdAt)}
            </Text>
          </View>
          
          {variant === 'default' && (
            <View style={styles.actionsContainer}>
              <View style={styles.statsContainer}>
                <View style={styles.likeDislikeContainer}>
                  <TouchableOpacity 
                    onPress={handleLikePress}
                    style={styles.actionButton}
                  >
                    <MaterialIcons 
                      name={liked ? "thumb-up" : "thumb-up-off-alt"} 
                      size={20} 
                      color={liked ? "#FFFFFF" : "#909090"} 
                    />
                    <Text style={[styles.actionText, liked && styles.likedText]}>
                      {formatCount(likesCount)}
                    </Text>
                  </TouchableOpacity>
                  
                  <View style={styles.actionDivider} />
                  
                  <TouchableOpacity 
                    onPress={handleDislikePress}
                    style={styles.actionButton}
                  >
                    <MaterialIcons 
                      name="thumb-down-off-alt" 
                      size={20} 
                      color="#909090" 
                    />
                  </TouchableOpacity>
                </View>
                
                <TouchableOpacity 
                  onPress={handleSharePress}
                  style={styles.actionButton}
                >
                  <MaterialIcons name="share" size={20} color="#909090" />
                  <Text style={styles.actionText}>Share</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                onPress={handleSubscribePress}
                style={[
                  styles.subscribeButton,
                  subscribed && styles.subscribedButton
                ]}
              >
                <Text style={styles.subscribeText}>
                  {subscribed ? 'Subscribed' : 'Subscribe'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  thumbnailContainer: {
    borderRadius: 0, // YouTube doesn't use rounded corners
    overflow: 'hidden',
    backgroundColor: '#0F0F0F',
  },
  viewsBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
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
    color: 'white',
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
    color: '#909090',
    fontSize: 13,
  },
  dotSeparator: {
    color: '#909090',
    fontSize: 13,
    marginHorizontal: 4,
  },
  timeText: {
    color: '#909090',
    fontSize: 13,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    justifyContent: 'space-between',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeDislikeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#272727',
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 8,
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
    backgroundColor: '#3F3F3F',
  },
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionText: {
    color: '#909090',
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  likedText: {
    color: '#FFFFFF',
  },
  subscribeButton: {
    backgroundColor: '#FF0000', // YouTube red
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 18,
  },
  subscribedButton: {
    backgroundColor: '#272727',
  },
  subscribeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default VideoCard;
