import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import VideoCard from '../../components/VideoCard';
import AuthRequiredWrapper from '../../components/AuthRequiredWrapper';
import { getDummyVideos } from '../../services/dummyData';
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
      if (refresh) {
        setIsRefreshing(true);
        // Reset pagination on refresh
        setPage(1);
      } else if (!isLoading) {
        setIsLoading(true);
      }

      const currentPage = refresh ? 1 : page;
      
      try {
        // Use real API instead of dummy data
        const response = await getVideos({
          page: currentPage,
          limit: 20
          // Removed sort parameter which was causing the error
        });
        
        // Check if response has the expected structure
        if (response) {
          let fetchedVideos;
          
          // Handle both array response and nested object response
          if (Array.isArray(response.data)) {
            fetchedVideos = response.data;
          } else if (response.data && typeof response.data === 'object') {
            // Check if it has a videos property that's an array
            const responseData = response.data as any; // Use type assertion
            if (responseData.videos && Array.isArray(responseData.videos)) {
              // Handle nested structure {"videos": [...]}
              fetchedVideos = responseData.videos;
            } else {
              console.error('API returned unexpected data structure:', response.data);
              throw new Error('Invalid response format');
            }
          } else {
            console.error('API returned unexpected data structure:', response.data);
            throw new Error('Invalid response format');
          }
          
          const meta = response.meta;
          
          if (meta) {
            setHasMore(meta.page < meta.totalPages);
            setPage(currentPage + 1);
          }
          
          // If refreshing, replace videos; otherwise append
          setVideos(refresh ? fetchedVideos : [...videos, ...fetchedVideos]);
        } else {
          console.error('Invalid API response structure:', response);
          throw new Error('Invalid response structure');
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // Fallback to dummy data if API fails
        const dummyVideos = getDummyVideos();
        setVideos(dummyVideos);
      }
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
      <View style={styles.footerContainer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No videos found</Text>
        <Text style={styles.emptySubText}>Pull down to refresh</Text>
      </View>
    );
  };

  return (
    <AuthRequiredWrapper>
      {(showAuthModal) => (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          style={styles.container}
        >
          <SafeAreaView style={styles.safeArea}>
            <FlatList
              data={videos}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <VideoCard 
                  video={item} 
                  showAuthModal={(intent) => Boolean(showAuthModal(intent))} 
                />
              )}
              contentContainerStyle={styles.listContent}
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
              onEndReached={() => {
                if (hasMore && !isLoading && !isRefreshing) {
                  fetchVideos();
                }
              }}
              onEndReachedThreshold={0.5}
            />
          </SafeAreaView>
        </LinearGradient>
      )}
    </AuthRequiredWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    paddingBottom: 80, // Add extra padding at bottom for tab bar
  },
  footerContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubText: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
  },
});