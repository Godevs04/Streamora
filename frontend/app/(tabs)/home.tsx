import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import VideoCard from '../../components/VideoCard';
import AuthRequiredWrapper from '../../components/AuthRequiredWrapper';
// Removed dummy data import - using real API data
import { getVideos } from '../../services/videos';
import { Video, VideosApiResponse } from '../../types';
import { useFocusEffect } from 'expo-router';
import colors from '../../constants/colors';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

export default function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Trending');
  const [searchQuery, setSearchQuery] = useState('');
  const customAlert = useCustomAlert();

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const categories = ['Trending', 'Music', 'Gaming', 'Podcasts', 'Tech', 'Education', 'Entertainment'];
  
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
          limit: 20,
          type: 'normal', // Only show normal videos, not shorts
          search: searchQuery || undefined // Add search parameter
        });
        
        // Check if response has the expected structure
        if (response && response.success) {
          const apiResponse = response as any; // Type assertion for API response
          const fetchedVideos = apiResponse.data.videos;
          
          const meta = apiResponse.meta;
          
          if (meta) {
            setHasMore(meta.page < meta.totalPages);
            setPage(currentPage + 1);
          }
          
          // Filter out shorts videos to ensure only normal videos appear in home
          const normalVideos = fetchedVideos
            .filter((video: Video) => video.type !== 'shorts')
            .map((v: any) => ({
              ...v,
              commentsCount: typeof v.commentsCount === 'number' ? v.commentsCount : (Array.isArray(v.comments) ? v.comments.length : 0),
            }));
          
          // If refreshing, replace videos; otherwise append unique videos only
          setVideos((prev) => {
            if (refresh) {
              return normalVideos;
            } else {
              // Create a map to track existing video IDs
              const existingIds = new Set(prev.map(video => video._id));
              // Filter out videos that already exist
              const newVideos = normalVideos.filter((video: Video) => !existingIds.has(video._id));
              return [...prev, ...newVideos];
            }
          });
        } else {
          console.error('Invalid API response structure:', response);
          throw new Error('Invalid response structure');
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // Don't fallback to dummy data - show empty state instead
        setVideos([]);
        customAlert.show({
          title: 'Connection Error',
          message: 'Unable to load videos. Please check your internet connection and try again.',
          type: 'error',
          icon: 'error-outline',
          buttons: [
            { text: 'Retry', onPress: () => fetchVideos(true) },
            { text: 'Cancel', style: 'cancel' }
          ]
        });
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

  // Refresh when screen gains focus to reflect latest counts from server
  useFocusEffect(
    useCallback(() => {
      fetchVideos(true);
      // no cleanup needed
      return undefined;
    }, [searchQuery, selectedCategory])
  );

  const handleRefresh = () => {
    fetchVideos(true);
  };

  const handleSearch = () => {
    // Reset pagination and fetch videos with search query
    setPage(1);
    setHasMore(true);
    fetchVideos(true);
  };

  const handleSearchInputChange = (text: string) => {
    setSearchQuery(text);
    // Debounce search - search after user stops typing for 500ms
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeout = setTimeout(() => {
      if (text.trim() === '' || text.length >= 2) {
        handleSearch();
      }
    }, 500);
    setSearchTimeout(timeout);
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

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Top Bar with Search */}
      <View style={styles.topBar}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search videos..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={handleSearchInputChange}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity onPress={() => {
            setSearchQuery('');
            handleRefresh();
          }}>
            <MaterialIcons name="refresh" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* App Logo and Title */}
      <View style={styles.logoContainer}>
        <View style={styles.logoWrapper}>
          <View style={styles.logoIcon}>
            <MaterialIcons name="play-circle-filled" size={24} color={colors.primary} />
          </View>
          <Text style={styles.logoText}>Streamora</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="search" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <MaterialIcons name="notifications" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Navigation */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category && styles.categoryButtonActive
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === category && styles.categoryTextActive
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <AuthRequiredWrapper>
      {(showAuthModal) => (
        <>
          <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.safeArea}>
              {renderHeader()}
              <FlatList
                data={videos}
                keyExtractor={(item, index) => item._id || `video-${index}`}
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
            </View>
          </SafeAreaView>
          
          {/* Custom Alert */}
          <CustomAlert
            visible={customAlert.visible}
            title={customAlert.config.title}
            message={customAlert.config.message}
            buttons={customAlert.config.buttons}
            type={customAlert.config.type}
            icon={customAlert.config.icon}
            onClose={customAlert.hide}
          />
        </>
      )}
    </AuthRequiredWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingTop: 0,
    marginTop: 0,
  },
  safeArea: {
    flex: 1,
    paddingTop: 0,
    marginTop: 0,
  },
  header: {
    backgroundColor: colors.background.primary,
    paddingTop: 8, // Add some padding from safe area
    paddingBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 16,
    marginLeft: 8,
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  logoText: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  categoryContainer: {
    marginTop: 8,
  },
  categoryContent: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: colors.category.inactive,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
  },
  categoryText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  categoryTextActive: {
    color: colors.text.primary,
    fontWeight: '600',
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
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubText: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 8,
  },
});