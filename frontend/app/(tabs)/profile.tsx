import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, Alert, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import VideoCard from '../../components/VideoCard';
import Button from '../../components/Button';
import AuthRequiredWrapper from '../../components/AuthRequiredWrapper';
import useAuthStore from '../../store/useAuthStore';
import { getDummyVideos } from '../../services/dummyData';
import { getUserStats } from '../../services/user';
import { Video } from '../../types';
import colors from '../../constants/colors';
import { formatCount } from '../../utils/formatDate';
import { uploadImage } from '../../services/upload';

export default function Profile() {
  const { user, logout, updateUser } = useAuthStore();
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'videos' | 'liked'>('videos');
  const [profileStats, setProfileStats] = useState({
    followers: 0,
    following: 0,
    likes: 0,
    uploads: 0,
  });
  
  useEffect(() => {
    fetchUserVideos();
  }, []);

  // Refresh profile when user data changes
  useEffect(() => {
    if (user) {
      fetchUserVideos();
    }
  }, [user]);
  
  const fetchUserVideos = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Get dummy videos and filter by the current user
      const allVideos = getDummyVideos();
      const userVideos = allVideos.filter(video => video.owner._id === user._id);
      
      // Calculate real statistics from user's videos
      const totalLikes = userVideos.reduce((sum, video) => sum + (video.likesCount || 0), 0);
      const totalViews = userVideos.reduce((sum, video) => sum + (video.views || 0), 0);
      
      setVideos(userVideos);

      // Fetch real stats from API
      try {
        const { token } = useAuthStore.getState();
        if (token) {
          const response = await getUserStats(token);
          if (response?.success) {
            const data = response.data;
            setProfileStats({
              followers: data.followers || 0,
              following: data.following || 0,
              likes: totalLikes,
              uploads: data.totalVideos ?? userVideos.length,
            });
          } else {
            setProfileStats({
              followers: 0,
              following: 0,
              likes: totalLikes,
              uploads: userVideos.length,
            });
          }
        } else {
          setProfileStats({
            followers: 0,
            following: 0,
            likes: totalLikes,
            uploads: userVideos.length,
          });
        }
      } catch (e) {
        setProfileStats({
          followers: 0,
          following: 0,
          likes: totalLikes,
          uploads: userVideos.length,
        });
      }
    } catch (error) {
      console.error('Error fetching user videos:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  const handleEditProfile = () => {
    router.push('/edit-profile');
  };
  
  const handleChangeAvatar = async () => {
    // Request permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your media library to change your avatar.'
      );
      return;
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        
        // Upload the image to server
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            throw new Error('No authentication token');
          }
          
          const uploadedUrl = await uploadImage(imageUri, token);
          
          // Update the user in the store with the new avatar URL
          await updateUser({
            _id: user?._id || '',
            name: user?.name || '',
            username: user?.username || '',
            bio: user?.bio || '',
            email: user?.email || '',
            avatarUrl: uploadedUrl,
            roles: user?.roles || ['user'],
            createdAt: user?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          Alert.alert('Success', 'Avatar updated successfully');
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          Alert.alert('Error', 'Failed to upload avatar. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.headerButton}>
          <MaterialIcons name="refresh" size={20} color={colors.text.secondary} />
        </TouchableOpacity>
      </View>
      
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
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => router.push('/settings')}
          >
            <MaterialIcons name="settings" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderProfileCard = () => (
    <View style={styles.profileCard}>
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handleChangeAvatar}>
          <View style={styles.avatarWrapper}>
            <Avatar uri={user?.avatarUrl} name={user?.name || ''} size="xl" />
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={16} color={colors.primary} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.profileInfo}>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userHandle}>@{user?.username || 'username'}</Text>
        <Text style={styles.userBio}>
          {user?.bio || 'Content creator & filmmaker. Exploring premium mobile experiences and visual storytelling.'}
        </Text>
      </View>
      
      <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
        <Text style={styles.editButtonText}>Edit Profile</Text>
      </TouchableOpacity>
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

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity style={styles.subscribeButton}>
        <Text style={styles.subscribeButtonText}>Creator Studio</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.shareButton}>
        <MaterialIcons name="share" size={20} color={colors.text.primary} />
      </TouchableOpacity>
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

  const renderVideoGrid = (showAuthModal: any) => {
    if (isLoading) {
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
          <Text style={styles.emptySubtitle}>Upload your first video to get started</Text>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => router.push('/(tabs)/upload')}
          >
            <Text style={styles.uploadButtonText}>Upload Video</Text>
          </TouchableOpacity>
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
            showAuthModal={(intent) => Boolean(showAuthModal(intent))} 
          />
        )}
        numColumns={2}
        scrollEnabled={false}
        contentContainerStyle={styles.videoGrid}
        columnWrapperStyle={styles.videoRow}
      />
    );
  };

  return (
    <AuthRequiredWrapper>
      {(showAuthModal) => (
        <SafeAreaView style={styles.container} edges={[]}>
          <View style={styles.safeArea}>
            {renderHeader()}
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {renderProfileCard()}
              {renderStats()}
              {renderActionButtons()}
              {renderTabs()}
              {renderVideoGrid(showAuthModal)}
            </ScrollView>
          </View>
        </SafeAreaView>
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
  scrollView: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    backgroundColor: colors.background.primary,
    paddingTop: 0,
    paddingBottom: 8,
    marginTop: 0,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    padding: 8,
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
  avatarWrapper: {
    position: 'relative',
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
  editButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
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
  
  // Action Buttons Styles
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: 'center',
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
  subscribeButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  shareButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingVertical: 40,
    alignItems: 'center',
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
    marginBottom: 24,
  },
  uploadButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  uploadButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
