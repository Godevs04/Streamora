import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
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