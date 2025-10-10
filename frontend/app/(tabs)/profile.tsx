import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, StyleSheet, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Avatar from '../../components/Avatar';
import VideoCard from '../../components/VideoCard';
import Button from '../../components/Button';
import AuthRequiredWrapper from '../../components/AuthRequiredWrapper';
import useAuthStore from '../../store/useAuthStore';
import { getUserVideos, getLikedVideos } from '../../services/videos';
import { getUserStats } from '../../services/user';
import { Video } from '../../types';
import { useColors } from '../../hooks/useColors';
import { formatCount, formatDuration } from '../../utils/formatDate';
import { uploadImage } from '../../services/upload';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

export default function Profile() {
  const { user, logout, updateUser } = useAuthStore();
  const [videos, setVideos] = useState<Video[]>([]);
  const [likedVideos, setLikedVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLiked, setIsLoadingLiked] = useState(false);
  const customAlert = useCustomAlert();
  const colors = useColors();
  const styles = createStyles(colors);
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

  // Fetch liked videos when tab changes
  useEffect(() => {
    if (activeTab === 'liked') {
      fetchLikedVideos();
    }
  }, [activeTab]);
  
  const fetchUserVideos = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Fetch user's uploaded videos from API
      const response = await getUserVideos(user._id);
      setVideos(response.data.videos || []);

      // Fetch real stats from API
      try {
        const { token } = useAuthStore.getState();
        if (token) {
          const statsResponse = await getUserStats(token);
          if (statsResponse?.success) {
            const data = statsResponse.data;
            setProfileStats({
              followers: data.followers || 0,
              following: data.following || 0,
              likes: data.totalLikes || 0,
              uploads: data.totalVideos || 0,
            });
          } else {
            // Fallback to calculated stats
            const totalLikes = response.data.videos?.reduce((sum, video) => sum + (video.likesCount || 0), 0) || 0;
            setProfileStats({
              followers: 0,
              following: 0,
              likes: totalLikes,
              uploads: response.data.videos?.length || 0,
            });
          }
        } else {
          // Fallback to calculated stats
          const totalLikes = response.data.videos?.reduce((sum, video) => sum + (video.likesCount || 0), 0) || 0;
          setProfileStats({
            followers: 0,
            following: 0,
            likes: totalLikes,
            uploads: response.data.videos?.length || 0,
          });
        }
      } catch (e) {
        // Fallback to calculated stats
        const totalLikes = response.data.videos?.reduce((sum, video) => sum + (video.likesCount || 0), 0) || 0;
        setProfileStats({
          followers: 0,
          following: 0,
          likes: totalLikes,
          uploads: response.data.videos?.length || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching user videos:', error);
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLikedVideos = async () => {
    setIsLoadingLiked(true);
    
    try {
      const response = await getLikedVideos();
      setLikedVideos(response.data.videos || []);
    } catch (error) {
      console.error('Error fetching liked videos:', error);
      setLikedVideos([]);
    } finally {
      setIsLoadingLiked(false);
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
      customAlert.show({
        title: 'Permission Required',
        message: 'Please allow access to your media library to change your avatar.',
        type: 'warning',
        icon: 'warning'
      });
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
          
          customAlert.show({
            title: 'Success',
            message: 'Avatar updated successfully',
            type: 'success',
            icon: 'check-circle'
          });
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          customAlert.show({
            title: 'Error',
            message: 'Failed to upload avatar. Please try again.',
            type: 'error',
            icon: 'error-outline'
          });
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      customAlert.show({
        title: 'Error',
        message: 'Failed to pick image',
        type: 'error',
        icon: 'error-outline'
      });
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
    const currentVideos = activeTab === 'videos' ? videos : likedVideos;
    const currentLoading = activeTab === 'videos' ? isLoading : isLoadingLiked;

    if (currentLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      );
    }

    if (currentVideos.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons 
            name={activeTab === 'videos' ? 'videocam' : 'favorite-border'} 
            size={48} 
            color={colors.text.secondary} 
          />
          <Text style={styles.emptyTitle}>
            {activeTab === 'videos' ? 'No videos yet' : 'No liked videos'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'videos' 
              ? 'Upload your first video to get started' 
              : 'Videos you like will appear here'
            }
          </Text>
          {activeTab === 'videos' && (
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={() => router.push('/(tabs)/upload')}
            >
              <Text style={styles.uploadButtonText}>Upload Video</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.videoGridContainer}>
        {currentVideos.map((video, index) => (
          <TouchableOpacity
            key={video._id || `video-${index}`}
            style={styles.videoGridItem}
            onPress={() => {
              if (video.type === 'shorts') {
                router.push(`/(tabs)/explore?videoId=${video._id}`);
              } else {
                router.push(`/video/${video._id}`);
              }
            }}
          >
            <Image
              source={{ uri: video.thumbnailUrl }}
              style={styles.videoThumbnail}
              resizeMode="cover"
            />
            <View style={styles.videoOverlay}>
              <View style={styles.videoStats}>
                <MaterialIcons name="play-arrow" size={16} color="white" />
                <Text style={styles.videoViews}>{formatCount(video.views || 0)}</Text>
              </View>
              <View style={styles.videoDuration}>
                <Text style={styles.durationText}>
                  {formatDuration(typeof video.duration === 'number' && video.duration > 1000 ? Math.round(video.duration / 1000) : (video.duration || 0))}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <AuthRequiredWrapper>
      {(showAuthModal) => (
        <>
          <SafeAreaView style={styles.container} edges={['top']}>
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

const createStyles = (colors: any) => StyleSheet.create({
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
    paddingTop: 8, // Add padding from safe area
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
  videoGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 80,
    justifyContent: 'space-between',
  },
  videoGridItem: {
    width: '48%',
    aspectRatio: 9/16,
    marginBottom: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.background.secondary,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoViews: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  videoDuration: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
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
