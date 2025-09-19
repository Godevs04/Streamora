import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import VideoCard from '../../components/VideoCard';
import AuthRequiredWrapper from '../../components/AuthRequiredWrapper';
import { getDummyVideos } from '../../services/dummyData';
import { Video } from '../../types';
import colors from '../../constants/colors';

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchVideos = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
      } else if (!isLoading) {
        setIsLoading(true);
      }

      // Use dummy data service instead of API call
      const fetchedVideos = getDummyVideos();
      
      setVideos(fetchedVideos);
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
    fetchVideos(true);
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    
    return (
      <View style={{ paddingVertical: 16 }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
        <Text style={{ color: 'white', fontSize: 18 }}>No videos found</Text>
        <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>Pull down to refresh</Text>
      </View>
    );
  };

  return (
    <AuthRequiredWrapper>
      {(showAuthModal) => (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <FlatList
              data={videos}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <VideoCard 
                  video={item} 
                  showAuthModal={(intent) => Boolean(showAuthModal(intent))} 
                />
              )}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={renderEmpty}
              ListFooterComponent={renderFooter}
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
      )}
    </AuthRequiredWrapper>
  );
}