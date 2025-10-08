import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, TouchableOpacity, RefreshControl, Dimensions, Alert, Modal, TextInput, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ShortsPlayer from '../../components/ShortsPlayer';
import { getVideos, toggleLikeVideo, getVideoComments, addComment } from '../../services/videos';
import { subscribeToUser, unsubscribeFromUser, checkSubscriptionStatus } from '../../services/user';
import { Video, Comment } from '../../types';
import colors from '../../constants/colors';
import useAuthStore from '../../store/useAuthStore';
import Avatar from '../../components/Avatar';

export default function Shorts() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [subscribedUsers, setSubscribedUsers] = useState<Set<string>>(new Set());
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const { user, token } = useAuthStore();
  const insets = useSafeAreaInsets();
  
  // Calculate available height for shorts
  const availableHeight = Dimensions.get('window').height - insets.top - insets.bottom;
  
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
      
      // Initialize liked videos from video data
      if (user && shortsVideos.length > 0) {
        const likedVideoIds = new Set<string>();
        shortsVideos.forEach((video: Video) => {
          if (video.likes && video.likes.includes(user._id)) {
            likedVideoIds.add(video._id);
          }
        });
        setLikedVideos(likedVideoIds);
      }
      
      // Check subscription status for each video owner
      if (user && token) {
        const subscriptionChecks = shortsVideos.map(async (video: Video) => {
          if (video.owner?._id) {
            try {
              const subscriptionResponse = await checkSubscriptionStatus(video.owner._id, token);
              if (subscriptionResponse?.data?.isSubscribed) {
                setSubscribedUsers(prev => new Set([...prev, video.owner._id]));
              }
            } catch (error) {
              console.error('Error checking subscription status:', error);
            }
          }
        });
        await Promise.all(subscriptionChecks);
      }
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
  
  // Handle like functionality
  const handleLike = async (videoId: string) => {
    if (!user || !token) {
      Alert.alert('Login Required', 'Please login to like videos');
      return;
    }
    
    try {
      const isLiked = likedVideos.has(videoId);
      await toggleLikeVideo(videoId);
      
      setLikedVideos(prev => {
        const newSet = new Set(prev);
        if (isLiked) {
          newSet.delete(videoId);
        } else {
          newSet.add(videoId);
        }
        return newSet;
      });
      
      // Update video likes count in the videos array
      setVideos(prev => prev.map(video => 
        video._id === videoId 
          ? { 
              ...video, 
              likesCount: isLiked 
                ? Math.max(0, (video.likesCount || 0) - 1)
                : (video.likesCount || 0) + 1
            }
          : video
      ));
    } catch (error: any) {
      console.error('Error toggling like:', error);
      Alert.alert('Error', error.message || 'Failed to update like status');
    }
  };
  
  // Handle subscribe functionality
  const handleSubscribe = async (userId: string, userName: string) => {
    if (!user || !token) {
      Alert.alert('Login Required', 'Please login to subscribe to channels');
      return;
    }
    
    try {
      const isSubscribed = subscribedUsers.has(userId);
      
      if (isSubscribed) {
        await unsubscribeFromUser(userId, token);
        setSubscribedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        Alert.alert('Unsubscribed', `You have unsubscribed from ${userName}`);
      } else {
        await subscribeToUser(userId, token);
        setSubscribedUsers(prev => new Set([...prev, userId]));
        Alert.alert('Subscribed', `You have subscribed to ${userName}`);
      }
    } catch (error: any) {
      console.error('Error toggling subscription:', error);
      Alert.alert('Error', error.message || 'Failed to update subscription');
    }
  };
  
  // Handle comment functionality
  const handleComment = async (videoId: string) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to view comments');
      return;
    }
    
    setCurrentVideoId(videoId);
    setCommentsVisible(true);
    await loadComments(videoId);
  };
  
  // Load comments for a video
  const loadComments = async (videoId: string) => {
    try {
      setCommentsLoading(true);
      const response = await getVideoComments(videoId, { page: 1, limit: 50, sort: 'newest' });
      
      let commentsList: Comment[] = [];
      if ((response as any)?.data?.comments && Array.isArray((response as any).data.comments)) {
        commentsList = (response as any).data.comments;
      } else if (Array.isArray((response as any)?.comments)) {
        commentsList = (response as any).comments;
      } else if (Array.isArray((response as any)?.data)) {
        commentsList = (response as any).data;
      }
      
      setComments(commentsList);
    } catch (error) {
      console.error('Error loading comments:', error);
      Alert.alert('Error', 'Failed to load comments');
    } finally {
      setCommentsLoading(false);
    }
  };
  
  // Add a new comment
  const handleAddComment = async () => {
    if (!user || !currentVideoId || !newComment.trim()) {
      return;
    }
    
    try {
      const response = await addComment(currentVideoId, newComment.trim());
      if (response?.data) {
        setNewComment('');
        Alert.alert('Success', 'Comment added successfully');
        
        // Refresh comments to get complete data from server
        if (currentVideoId) {
          await loadComments(currentVideoId);
        }
      }
    } catch (error: any) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', error.message || 'Failed to add comment');
    }
  };
  
  // Handle share functionality
  const handleShare = (videoId: string) => {
    // For now, just show an alert. In a real app, you'd implement sharing
    Alert.alert('Share', 'Share feature coming soon!');
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
    <SafeAreaView style={styles.container} edges={['top']}>
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
            keyExtractor={(item, index) => item._id || `short-${index}`}
            renderItem={({ item }) => (
              <ShortsPlayer
                video={item}
                onLike={() => handleLike(item._id)}
                onComment={() => handleComment(item._id)}
                onShare={() => handleShare(item._id)}
                onSubscribe={() => handleSubscribe(item.owner._id, item.owner.name)}
                isLiked={likedVideos.has(item._id)}
                isSubscribed={subscribedUsers.has(item.owner._id)}
              />
            )}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            snapToInterval={availableHeight}
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
            getItemLayout={(data, index) => ({
              length: availableHeight,
              offset: availableHeight * index,
              index,
            })}
            initialNumToRender={3}
            maxToRenderPerBatch={3}
            windowSize={5}
            removeClippedSubviews={true}
          />
        )}
      </View>
      
      {/* Comments Modal */}
      <Modal
        visible={commentsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCommentsVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.commentsModal}>
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentsVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.commentsList}>
              {commentsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingText}>Loading comments...</Text>
                </View>
              ) : comments.length === 0 ? (
                <View style={styles.emptyComments}>
                  <Text style={styles.emptyCommentsText}>No comments yet</Text>
                  <Text style={styles.emptyCommentsSubtext}>Be the first to comment!</Text>
                </View>
              ) : (
                comments.map((comment, index) => (
                  <View key={comment._id || `comment-${index}`} style={styles.commentItem}>
                    <Avatar
                      uri={comment.author?.avatarUrl}
                      name={comment.author?.name || comment.author?.username || 'User'}
                      size="sm"
                    />
                    <View style={styles.commentContent}>
                      <Text style={styles.commentUser}>{comment.author?.name || comment.author?.username || 'User'}</Text>
                      <Text style={styles.commentText}>{comment.text}</Text>
                      <Text style={styles.commentTime}>
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
            
            {user && (
              <View style={styles.commentInput}>
                <TextInput
                  style={styles.commentTextInput}
                  placeholder="Add a comment..."
                  placeholderTextColor={colors.text.secondary}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                  onPress={handleAddComment}
                  disabled={!newComment.trim()}
                >
                  <Ionicons name="send" size={20} color={newComment.trim() ? colors.primary : colors.text.secondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    position: 'absolute',
    top: 8, // Add padding from safe area
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  headerButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
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
    backgroundColor: colors.background.primary,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  commentsModal: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyComments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyCommentsText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 8,
  },
  emptyCommentsSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  commentContent: {
    flex: 1,
    marginLeft: 12,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: colors.text.primary,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.background.secondary,
  },
  commentTextInput: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text.primary,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
