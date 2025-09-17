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
      className={`mb-4 ${variant === 'compact' ? 'mx-1' : ''}`}
    >
      {/* Thumbnail */}
      <View style={{ width, height }} className="rounded-lg overflow-hidden bg-gray-800">
        <Image
          source={{ uri: video.thumbnailUrl }}
          style={{ width, height }}
          resizeMode="cover"
        />
        
        {/* Duration badge (if available) */}
        <View className="absolute bottom-2 right-2 bg-black bg-opacity-70 px-1 rounded">
          <Text className="text-white text-xs">
            {formatCount(video.views)} views
          </Text>
        </View>
      </View>
      
      {/* Video info */}
      <View className={`flex-row mt-2 ${variant === 'compact' ? 'pr-2' : ''}`}>
        {variant === 'default' && (
          <TouchableOpacity onPress={handleProfilePress} className="mr-3">
            <Avatar uri={video.owner.avatarUrl} name={video.owner.name} size="sm" />
          </TouchableOpacity>
        )}
        
        <View className="flex-1">
          <Text numberOfLines={2} className="text-white font-medium">
            {video.title}
          </Text>
          
          <View className="flex-row items-center mt-1">
            <Text className="text-gray-400 text-xs">
              {video.owner.name}
            </Text>
            <Text className="text-gray-400 text-xs mx-1">•</Text>
            <Text className="text-gray-400 text-xs">
              {formatRelativeTime(video.createdAt)}
            </Text>
          </View>
          
          {variant === 'default' && (
            <View className="flex-row items-center mt-1">
              <Icon name="heart" size={12} color="#F87171" />
              <Text className="text-gray-400 text-xs ml-1">
                {formatCount(video.likesCount)}
              </Text>
              <Icon name="chatbubble" size={12} color="#9CA3AF" className="ml-3" />
              <Text className="text-gray-400 text-xs ml-1">
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
