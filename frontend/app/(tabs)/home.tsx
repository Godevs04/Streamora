import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import VideoCard from '../../components/VideoCard';
import { getVideos } from '../../services/videos';
import { Video } from '../../types';
import colors from '../../constants/colors';

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const fetchVideos = async (refresh = false) => {
    try {
      const currentPage = refresh ? 1 : page;
      
      if (refresh) {
        setIsRefreshing(true);
      } else if (isLoading) {
        // Do nothing, already loading
      } else {
        setIsLoading(true);
      }
      
      const response = await getVideos({
        page: currentPage,
        limit: 20,
        sort: 'recent',
      });
      
      const { data: fetchedVideos, meta } = response;
      
      if (refresh) {
        setVideos(fetchedVideos);
      } else {
        setVideos((prevVideos) => [...prevVideos, ...fetchedVideos]);
      }
      
      setPage(currentPage + 1);
      setHasMore(meta.page < meta.totalPages);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchVideos();
  }, []);
  
  const handleRefresh = () => {
    setPage(1);
    fetchVideos(true);
  };
  
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      fetchVideos();
    }
  };
  
  const renderFooter = () => {
    if (!isLoading) return null;
    
    return (
      <View className="py-4">
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };
  
  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View className="flex-1 items-center justify-center py-10">
        <Text className="text-white text-lg">No videos found</Text>
        <Text className="text-gray-400 text-sm mt-2">Pull down to refresh</Text>
      </View>
    );
  };
  
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <FlatList
          data={videos}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <VideoCard video={item} />}
          contentContainerClassName="px-4 py-2"
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        />
      </SafeAreaView>
    </LinearGradient>
  );
}
