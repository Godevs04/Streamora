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
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
          <Icon name="search" size={48} color={colors.gray} />
          <Text style={{ color: 'white', fontSize: 18, marginTop: 16 }}>Search for videos</Text>
          <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 }}>
            Enter keywords to find videos by title, description, or tags
          </Text>
        </View>
      );
    }
    
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
        <Icon name="alert-circle-outline" size={48} color={colors.gray} />
        <Text style={{ color: 'white', fontSize: 18, marginTop: 16 }}>No results found</Text>
        <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>
          Try different keywords or check spelling
        </Text>
      </View>
    );
  };
  
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 }}>
            <Icon name="search" size={20} color={colors.gray} />
            <TextInput
              style={{ flex: 1, color: 'white', fontSize: 16, marginLeft: 8 }}
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
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ color: 'white', marginTop: 16 }}>Searching...</Text>
          </View>
        ) : (
          <FlatList
            data={videos}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <VideoCard video={item} />}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
            numColumns={1}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmpty}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}
