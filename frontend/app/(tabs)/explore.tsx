import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ShortsPlayer from '../../components/ShortsPlayer';
import { getVideos } from '../../services/videos';
import { Video } from '../../types';
import colors from '../../constants/colors';

export default function Shorts() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchShorts = async () => {
    try {
      setIsLoading(true);
      const response = await getVideos({
        page: 1,
        limit: 50,
        sort: 'popular',
        type: 'shorts' // Filter for shorts only
      });
      
      // Filter for shorts videos (videos with type: 'shorts')
      const shortsVideos = response.data.videos.filter((video: Video) => video.type === 'shorts');
      setVideos(shortsVideos);
    } catch (error) {
      console.error('Error fetching shorts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShorts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchShorts();
    setRefreshing(false);
  };
  
  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="play-circle-outline" size={64} color={colors.primary} />
        <Text style={styles.emptyTitle}>No Shorts Yet</Text>
        <Text style={styles.emptySubtitle}>
          Upload your first short video to get started!
        </Text>
        <TouchableOpacity style={styles.uploadButton} onPress={() => {/* Navigate to upload */}}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.uploadButtonText}>Upload Short</Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shorts</Text>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading Shorts...</Text>
          </View>
        ) : (
          <FlatList
            data={videos}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <ShortsPlayer
                video={item}
                onLike={() => console.log('Like video:', item._id)}
                onComment={() => console.log('Comment on video:', item._id)}
                onShare={() => console.log('Share video:', item._id)}
                onSubscribe={() => console.log('Subscribe to:', item.owner.name)}
                isLiked={false}
                isSubscribed={false}
              />
            )}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={Dimensions.get('window').height}
            snapToAlignment="start"
            decelerationRate="fast"
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  headerButton: {
    padding: 8,
  },
  listContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.text.primary,
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 24,
  },
  uploadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
