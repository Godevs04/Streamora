import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { router } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import Avatar from './Avatar';
import { PreviousIntent, Video } from '../types';
import { formatCount, formatRelativeTime } from '../utils/formatDate';
import useAuthStore from '../store/useAuthStore';
import { toggleDummyVideoLike, subscribeToDummyUser } from '../services/dummyData';

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
    <View style={{ marginBottom: 16, ...(variant === 'compact' ? { marginHorizontal: 4 } : {}) }}>
      {/* Thumbnail */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={{ width, height, borderRadius: 8, overflow: 'hidden', backgroundColor: '#1F2937' }}>
          <Image
            source={{ uri: video.thumbnailUrl }}
            style={{ width, height }}
            resizeMode="cover"
          />
          
          {/* Duration badge (if available) */}
          <View style={{ position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 4, borderRadius: 4 }}>
            <Text style={{ color: 'white', fontSize: 12 }}>
              {formatCount(video.views)} views
            </Text>
          </View>
        </View>
      </TouchableOpacity>
      
      {/* Video info */}
      <View style={{ flexDirection: 'row', marginTop: 8, ...(variant === 'compact' ? { paddingRight: 8 } : {}) }}>
        {variant === 'default' && (
          <TouchableOpacity onPress={handleProfilePress} style={{ marginRight: 12 }}>
            <Avatar uri={video.owner.avatarUrl} name={video.owner.name} size="sm" />
          </TouchableOpacity>
        )}
        
        <View style={{ flex: 1 }}>
          <Text numberOfLines={2} style={{ color: 'white', fontWeight: '500' }}>
            {video.title}
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <TouchableOpacity onPress={handleProfilePress}>
              <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
                {video.owner.name}
              </Text>
            </TouchableOpacity>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginHorizontal: 4 }}>•</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
              {formatRelativeTime(video.createdAt)}
            </Text>
          </View>
          
          {variant === 'default' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity 
                  onPress={handleLikePress}
                  style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    backgroundColor: liked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(75, 85, 99, 0.2)', 
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    borderRadius: 16
                  }}
                >
                  <Icon name={liked ? "heart" : "heart-outline"} size={16} color={liked ? "#EF4444" : "#9CA3AF"} />
                  <Text style={{ color: liked ? "#EF4444" : '#9CA3AF', fontSize: 12, marginLeft: 4, fontWeight: '500' }}>
                    {formatCount(likesCount)}
                  </Text>
                </TouchableOpacity>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                  <Icon name="chatbubble-outline" size={16} color="#9CA3AF" />
                  <Text style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 4 }}>
                    {video.comments ? formatCount(video.comments.length) : '0'}
                  </Text>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={handleSubscribePress}
                style={{
                  backgroundColor: subscribed ? 'rgba(79, 70, 229, 0.2)' : 'rgba(79, 70, 229, 1)',
                  paddingVertical: 4,
                  paddingHorizontal: 10,
                  borderRadius: 16,
                }}
              >
                <Text style={{ color: 'white', fontSize: 12, fontWeight: '500' }}>
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

export default VideoCard;
