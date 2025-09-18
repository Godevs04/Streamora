import React from 'react';
import { View, Text, Image, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Avatar from './Avatar';
import { Video } from '../types';
import { formatCount, formatRelativeTime } from '../utils/formatDate';

interface VideoCardProps {
  video: Video;
  variant?: 'default' | 'compact';
}

const VideoCard: React.FC<VideoCardProps> = ({ video, variant = 'default' }) => {
  const navigation = useNavigation();
  const screenWidth = Dimensions.get('window').width;
  
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
    navigation.navigate('VideoDetail', { videoId: video._id });
  };
  
  // Handle profile press
  const handleProfilePress = () => {
    navigation.navigate('Profile', { userId: video.owner._id });
  };
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      style={{ marginBottom: 16, ...(variant === 'compact' ? { marginHorizontal: 4 } : {}) }}
    >
      {/* Thumbnail */}
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
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
              {video.owner.name}
            </Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginHorizontal: 4 }}>•</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>
              {formatRelativeTime(video.createdAt)}
            </Text>
          </View>
          
          {variant === 'default' && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Icon name="heart" size={12} color="#F87171" />
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 4 }}>
                {formatCount(video.likesCount)}
              </Text>
              <Icon name="chatbubble" size={12} color="#9CA3AF" style={{ marginLeft: 12 }} />
              <Text style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 4 }}>
                {video.comments ? formatCount(video.comments.length) : '0'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default VideoCard;
