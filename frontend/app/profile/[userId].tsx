import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import VideoCard from '../../components/VideoCard';
import useAuthStore from '../../store/useAuthStore';
import { getUserProfile, getUserStats } from '../../services/user';
import { getVideos } from '../../services/videos';
import { Video, User } from '../../types';
import colors from '../../constants/colors';
import config from '../../constants/config';
import { formatCount } from '../../utils/formatDate';

export default function ProfileView() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: currentUser } = useAuthStore();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVideosLoading, setIsVideosLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'videos' | 'liked'>('videos');
  const [profileStats, setProfileStats] = useState({
    followers: 0,
    following: 0,
    likes: 0,
    uploads: 0,
  });
  const [isSubscribed, setIsSubscribed] = useState(false);

  const isOwnProfile = currentUser?._id === userId;

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
      fetchUserVideos();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      
      if (isOwnProfile) {
        setProfileUser(currentUser);
      } else {
        // Fetch other user's profile from API
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            throw new Error('No authentication token');
          }
          
          const response = await fetch(`${config.API.BASE_URL}/users/${userId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setProfileUser(data.data);
          } else {
            throw new Error('Failed to fetch user profile');
          }
        } catch (apiError) {
          console.error('API error:', apiError);
          // Fallback to dummy data for demo purposes
          setProfileUser({
            _id: userId || '',
            name: 'Demo User',
            username: 'demouser',
            email: 'demo@example.com',
            avatarUrl: '',
            bio: 'Content creator & filmmaker. Exploring premium mobile experiences and visual storytelling.',
            roles: ['user'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserVideos = async () => {
    try {
      setIsVideosLoading(true);
      // In a real app, you would fetch videos by user ID
      // For now, we'll use the general videos API
      const response = await getVideos({ page: 1, limit: 20 });
      if (response && response.success) {
        const apiResponse = response as any;
        setVideos(apiResponse.data.videos);
      }
    } catch (error) {
      console.error('Error fetching user videos:', error);
    } finally {
      setIsVideosLoading(false);
    }
  };

  const handleSubscribe = () => {
    setIsSubscribed(!isSubscribed);
    Alert.alert(
      isSubscribed ? 'Unsubscribed' : 'Subscribed',
      `You have ${isSubscribed ? 'unsubscribed from' : 'subscribed to'} ${profileUser?.name}`
    );
  };

  const handleShare = () => {
    Alert.alert('Share Profile', `Share ${profileUser?.name}'s profile`);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{profileUser?.name || 'Profile'}</Text>
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <MaterialIcons name="share" size={24} color={colors.text.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderProfileCard = () => (
    <View style={styles.profileCard}>
      <View style={styles.avatarContainer}>
        <Avatar uri={profileUser?.avatarUrl} name={profileUser?.name || ''} size="xl" />
        {!isOwnProfile && (
          <View style={styles.verifiedBadge}>
            <MaterialIcons name="verified" size={16} color={colors.primary} />
          </View>
        )}
      </View>
      
      <View style={styles.profileInfo}>
        <Text style={styles.userName}>{profileUser?.name || 'User'}</Text>
        <Text style={styles.userHandle}>@{profileUser?.username || 'username'}</Text>
        <Text style={styles.userBio}>
          {profileUser?.bio || 'Content creator & filmmaker. Exploring premium mobile experiences and visual storytelling.'}
        </Text>
      </View>
      
      {!isOwnProfile && (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.subscribeButton, isSubscribed && styles.subscribedButton]}
            onPress={handleSubscribe}
          >
            <Text style={[styles.subscribeButtonText, isSubscribed && styles.subscribedButtonText]}>
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <MaterialIcons name="share" size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{formatCount(profileStats.followers)}</Text>
        <Text style={styles.statLabel}>FOLLOWERS</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{formatCount(profileStats.following)}</Text>
        <Text style={styles.statLabel}>FOLLOWING</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{formatCount(profileStats.likes)}</Text>
        <Text style={styles.statLabel}>LIKES</Text>
      </View>
      <View style={styles.statCard}>
        <Text style={styles.statNumber}>{formatCount(profileStats.uploads)}</Text>
        <Text style={styles.statLabel}>UPLOADS</Text>
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
        onPress={() => setActiveTab('videos')}
      >
        <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>Videos</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'liked' && styles.activeTab]}
        onPress={() => setActiveTab('liked')}
      >
        <Text style={[styles.tabText, activeTab === 'liked' && styles.activeTabText]}>Liked</Text>
      </TouchableOpacity>
    </View>
  );

  const renderVideoGrid = () => {
    if (isVideosLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (videos.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="videocam" size={48} color={colors.text.secondary} />
          <Text style={styles.emptyTitle}>No videos yet</Text>
          <Text style={styles.emptySubtitle}>
            {isOwnProfile ? 'Upload your first video to get started' : 'This user hasn\'t uploaded any videos yet'}
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={videos}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <VideoCard 
            video={item} 
            variant="compact" 
            showAuthModal={() => false} 
          />
        )}
        numColumns={2}
        scrollEnabled={false}
        contentContainerStyle={styles.videoGrid}
        columnWrapperStyle={styles.videoRow}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.safeArea}>
        {renderHeader()}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderProfileCard()}
          {renderStats()}
          {renderTabs()}
          {renderVideoGrid()}
        </ScrollView>
      </View>
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
  scrollView: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  shareButton: {
    padding: 8,
  },
  
  // Profile Card Styles
  profileCard: {
    backgroundColor: colors.background.secondary,
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  userName: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userHandle: {
    color: colors.text.secondary,
    fontSize: 16,
    marginBottom: 12,
  },
  userBio: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  
  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  subscribeButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginRight: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  subscribedButton: {
    backgroundColor: colors.background.tertiary,
  },
  subscribeButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  subscribedButtonText: {
    color: colors.text.secondary,
  },
  
  // Stats Styles
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Tabs Styles
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.text.primary,
    fontWeight: '600',
  },
  
  // Video Grid Styles
  videoGrid: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  videoRow: {
    justifyContent: 'space-between',
  },
  
  // Loading and Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.text.secondary,
    fontSize: 14,
    textAlign: 'center',
  },
});
