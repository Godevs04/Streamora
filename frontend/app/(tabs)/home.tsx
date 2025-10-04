import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
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
  const [selectedCategory, setSelectedCategory] = useState('Trending');
  const [searchQuery, setSearchQuery] = useState('');

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

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
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity>
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
        <View style={styles.container}>
          <SafeAreaView style={styles.safeArea}>
            {renderHeader()}
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
        </View>
      )}
    </AuthRequiredWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.background.primary,
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