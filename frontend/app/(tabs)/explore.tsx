import React, { useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import VideoCard from '../../components/VideoCard';
import { getVideos } from '../../services/videos';
import { Video } from '../../types';
import colors from '../../constants/colors';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setHasSearched(true);
    
    try {
      // In a real app, you would have a search endpoint
      // For now, we'll just filter by title using the existing endpoint
      const response = await getVideos({
        page: 1,
        limit: 50,
        sort: 'popular',
      });
      
      // Client-side filtering as a fallback
      // In a real app, this would be done on the server
      const filteredVideos = response.data.filter(video => 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      
      setVideos(filteredVideos);
    } catch (error) {
      console.error('Error searching videos:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderEmpty = () => {
    if (isLoading) return null;
    
    if (!hasSearched) {
      return (
        <View className="flex-1 items-center justify-center py-10">
          <Icon name="search" size={48} color={colors.gray} />
          <Text className="text-white text-lg mt-4">Search for videos</Text>
          <Text className="text-gray-400 text-sm mt-2 text-center px-10">
            Enter keywords to find videos by title, description, or tags
          </Text>
        </View>
      );
    }
    
    return (
      <View className="flex-1 items-center justify-center py-10">
        <Icon name="alert-circle-outline" size={48} color={colors.gray} />
        <Text className="text-white text-lg mt-4">No results found</Text>
        <Text className="text-gray-400 text-sm mt-2">
          Try different keywords or check spelling
        </Text>
      </View>
    );
  };
  
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <View className="px-4 py-2">
          <View className="flex-row items-center bg-gray-800 rounded-lg px-3 py-2">
            <Icon name="search" size={20} color={colors.gray} />
            <TextInput
              className="flex-1 text-white text-base ml-2"
              placeholder="Search videos..."
              placeholderTextColor={colors.gray}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Icon
                name="close-circle"
                size={20}
                color={colors.gray}
                onPress={() => setSearchQuery('')}
              />
            )}
          </View>
        </View>
        
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={colors.primary} />
            <Text className="text-white mt-4">Searching...</Text>
          </View>
        ) : (
          <FlatList
            data={videos}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <VideoCard video={item} />}
            contentContainerClassName="px-4 py-2"
            numColumns={1}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmpty}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}
