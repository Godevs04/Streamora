import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image, Modal, TextInput } from 'react-native';
import { Stack, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '../../hooks/useColors';
import { fetchContent } from '../../services/admin';
import { ContentData, UploadVideo, ThumbnailSlot, ScheduledPost } from '../../types';
import AdminLayout from '../../components/AdminLayout';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

export default function AdminContent() {
  const colors = useColors();
  const styles = createStyles(colors);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ContentData | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingVideo, setEditingVideo] = useState<UploadVideo | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const customAlert = useCustomAlert();

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchContent();
      setData(res);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load content data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingVideo || !editTitle.trim()) {
      customAlert.show({
        title: 'Error',
        message: 'Please enter a valid title',
        type: 'error',
        icon: 'error-outline'
      });
      return;
    }

    setIsUpdating(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsUpdating(false);
      setEditModalVisible(false);
      
      // Update local state
      if (data && editingVideo) {
        setData({
          ...data,
          uploads: data.uploads.map(v => 
            v._id === editingVideo._id 
              ? { ...v, title: editTitle.trim(), description: editDescription.trim() }
              : v
          )
        });
      }
      
      customAlert.show({
        title: 'Success',
        message: 'Video updated successfully!',
        type: 'success',
        icon: 'check-circle'
      });
    }, 1500);
  };

  const handleCancelEdit = () => {
    setEditModalVisible(false);
    setEditingVideo(null);
    setEditTitle('');
    setEditDescription('');
  };

  const handleEditVideo = (upload: UploadVideo) => {
    setEditingVideo(upload);
    setEditTitle(upload.title);
    setEditDescription((upload as any).description || '');
    setEditModalVisible(true);
  };

  const handleDeleteVideo = (upload: UploadVideo) => {
    customAlert.show({
      title: 'Delete Video',
      message: `Are you sure you want to delete "${upload.title}"? This action cannot be undone.`,
      type: 'warning',
      icon: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            setIsUpdating(true);
            
            // Simulate API call
            setTimeout(() => {
              setIsUpdating(false);
              customAlert.show({
                title: 'Video Deleted',
                message: 'Your video has been successfully deleted.',
                type: 'success',
                icon: 'check-circle',
                buttons: [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Update local state to remove the video
                      if (data) {
                        setData({
                          ...data,
                          uploads: data.uploads.filter((v: UploadVideo) => v._id !== upload._id)
                        });
                      }
                    }
                  }
                ]
              });
            }, 1500);
          }
        }
      ]
    });
  };

  useEffect(() => {
    load();
  }, []);

  const uploads = useMemo<UploadVideo[]>(() => data?.uploads || [], [data]);
  const thumbnails = useMemo<ThumbnailSlot[]>(() => data?.thumbnails || [], [data]);
  const scheduledPosts = useMemo<ScheduledPost[]>(() => data?.scheduledPosts || [], [data]);

  return (
    <AdminLayout title="Content" subtitle="Video Management">
      <Stack.Screen options={{ headerShown: false }} />

        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading content…</Text>
          </View>
        ) : error ? (
          <View style={styles.centerWrap}>
            <MaterialIcons name="error-outline" size={32} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={load}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Upload Manager */}
            <SectionHeader key="content-upload-manager" title="Upload Manager" colors={colors} styles={styles} />
            <View style={styles.card}>
              {uploads.slice(0, 4).map((upload) => (
                <UploadVideoItem 
                  key={upload._id} 
                  upload={upload} 
                  onEdit={handleEditVideo}
                  onDelete={handleDeleteVideo}
                  isUpdating={isUpdating}
                  colors={colors}
                  styles={styles}
                />
              ))}
              {uploads.length > 4 && (
                <TouchableOpacity style={styles.showMoreBtn}>
                  <Text style={styles.showMoreText}>Show {uploads.length - 4} More</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Thumbnail Manager */}
            <SectionHeader key="content-thumbnail-manager" title="Thumbnail Manager" colors={colors} styles={styles} />
            <View style={styles.thumbnailGrid}>
              {thumbnails.map((thumbnail) => (
                <ThumbnailSlotItem 
                  key={thumbnail._id} 
                  thumbnail={thumbnail} 
                  customAlert={customAlert}
                  data={data}
                  setData={setData}
                  colors={colors}
                  styles={styles}
                />
              ))}
            </View>

            {/* Scheduled Posts */}
            <SectionHeader key="content-scheduled-posts" title="Scheduled Posts" colors={colors} styles={styles} />
            <View style={styles.card}>
              {scheduledPosts.map((post) => (
                <ScheduledPostItem key={post._id} post={post} customAlert={customAlert} colors={colors} styles={styles} />
              ))}
            </View>
          </ScrollView>
        )}
        
        {/* Edit Modal */}
        <Modal
          visible={editModalVisible}
          transparent
          animationType="slide"
          onRequestClose={handleCancelEdit}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.editModal}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Video</Text>
                <TouchableOpacity onPress={handleCancelEdit}>
                  <MaterialIcons name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Title</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="Enter video title"
                    placeholderTextColor={colors.text.secondary}
                    maxLength={100}
                  />
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={editDescription}
                    onChangeText={setEditDescription}
                    placeholder="Enter video description"
                    placeholderTextColor={colors.text.secondary}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                  />
                </View>
              </ScrollView>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.cancelBtn]} 
                  onPress={handleCancelEdit}
                  disabled={isUpdating}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.modalBtn, styles.saveBtn]} 
                  onPress={handleSaveEdit}
                  disabled={isUpdating || !editTitle.trim()}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <MaterialIcons name="save" size={16} color="white" />
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        
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
    </AdminLayout>
  );
}

function SectionHeader({ title, colors, styles }: { title: string; colors: any; styles: any }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.dot} />
    </View>
  );
}

function UploadVideoItem({ 
  upload, 
  onEdit, 
  onDelete, 
  isUpdating,
  colors,
  styles
}: { 
  upload: UploadVideo; 
  onEdit: (upload: UploadVideo) => void;
  onDelete: (upload: UploadVideo) => void;
  isUpdating: boolean;
  colors: any;
  styles: any;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return colors.primary;
      case 'scheduled': return colors.error;
      case 'draft': return colors.text.secondary;
      default: return colors.text.secondary;
    }
  };

  const handleEdit = () => {
    onEdit(upload);
  };

  const handleDelete = () => {
    onDelete(upload);
  };

  const handleView = () => {
    // Navigate to video based on type
    if ((upload as any).type === 'shorts' || (upload as any).duration && (upload as any).duration <= 60) {
      router.push('/(tabs)/explore');
    } else {
      router.push(`/video/${upload._id}`);
    }
  };

  return (
    <View style={styles.uploadItem}>
      {upload.thumbnailUrl ? (
        <Image 
          source={{ uri: upload.thumbnailUrl }} 
          style={styles.uploadThumb}
          resizeMode="cover"
        />
      ) : (
        <LinearGradient colors={[colors.primary, '#7b61ff']} style={styles.uploadThumb}>
          <MaterialIcons name="play-circle-filled" size={20} color="white" />
        </LinearGradient>
      )}
      <View style={styles.uploadContent}>
        <Text style={styles.uploadTitle}>{upload.title}</Text>
        <Text style={[styles.uploadStatus, { color: getStatusColor(upload.status) }]}>
          {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
        </Text>
        {(upload as any).type === 'shorts' && (
          <Text style={styles.videoType}>Short</Text>
        )}
      </View>
      <View style={styles.uploadActions}>
        <TouchableOpacity style={[styles.actionBtn, styles.viewBtn]} onPress={handleView}>
          <MaterialIcons name="visibility" size={14} color={colors.primary} />
          <Text style={styles.actionBtnText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.editBtn]} 
          onPress={handleEdit}
          disabled={isUpdating}
        >
          <MaterialIcons name="edit" size={14} color="#FFC107" />
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionBtn, styles.deleteBtn]} 
          onPress={handleDelete}
          disabled={isUpdating}
        >
          <MaterialIcons name="delete" size={14} color="#F44336" />
          <Text style={styles.actionBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ThumbnailSlotItem({ 
  thumbnail, 
  customAlert,
  data,
  setData,
  colors,
  styles
}: { 
  thumbnail: ThumbnailSlot;
  customAlert: any;
  data: ContentData | null;
  setData: (data: ContentData) => void;
  colors: any;
  styles: any;
}) {
  const handleThumbnailAction = () => {
    if (thumbnail.status === 'empty') {
      customAlert.show({
        title: 'Add Thumbnail',
        message: 'Choose an action for this thumbnail slot:',
        type: 'info',
        icon: 'add-photo-alternate',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Upload New',
            onPress: () => {
              pickThumbnailImage();
            }
          },
          {
            text: 'Generate AI',
            onPress: () => {
              customAlert.show({
                title: 'AI Generation',
                message: 'AI thumbnail generation will be implemented in the next update.',
                type: 'info',
                icon: 'smart-toy'
              });
            }
          }
        ]
      });
    } else {
      customAlert.show({
        title: 'Thumbnail Options',
        message: 'What would you like to do with this thumbnail?',
        type: 'info',
        icon: 'image',
        buttons: [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View',
            onPress: () => {
              if (thumbnail.thumbnailUrl) {
                customAlert.show({
                  title: 'View Thumbnail',
                  message: `Viewing thumbnail for video: ${thumbnail.videoId}`,
                  type: 'info',
                  icon: 'visibility'
                });
              }
            }
          },
          {
            text: 'Replace',
            onPress: () => {
              pickThumbnailImage();
            }
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              customAlert.show({
                title: 'Delete Thumbnail',
                message: 'Are you sure you want to delete this thumbnail?',
                type: 'warning',
                icon: 'warning',
                buttons: [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                      customAlert.show({
                        title: 'Success',
                        message: 'Thumbnail deleted successfully',
                        type: 'success',
                        icon: 'check-circle'
                      });
                    }
                  }
                ]
              });
            }
          }
        ]
      });
    }
  };

  const pickThumbnailImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        
        // Show loading
        customAlert.show({
          title: 'Uploading Thumbnail...',
          message: 'Please wait while we upload your thumbnail.',
          type: 'info',
          icon: 'cloud-upload',
          buttons: []
        });
        
        // Simulate upload
        setTimeout(() => {
          customAlert.show({
            title: 'Success',
            message: 'Thumbnail uploaded successfully!',
            type: 'success',
            icon: 'check-circle',
            buttons: [
              {
                text: 'OK',
                onPress: () => {
                  // Update local state to show the new thumbnail
                  if (data) {
                    setData({
                      ...data,
                      thumbnails: data.thumbnails.map((t: ThumbnailSlot) => 
                        t.status === 'empty' 
                          ? { ...t, status: 'uploaded', thumbnailUrl: imageUri }
                          : t
                      )
                    });
                  }
                }
              }
            ]
          });
        }, 2000);
      }
    } catch (error) {
      customAlert.show({
        title: 'Error',
        message: 'Failed to pick image. Please try again.',
        type: 'error',
        icon: 'error-outline'
      });
    }
  };

  return (
    <TouchableOpacity style={styles.thumbnailSlot} onPress={handleThumbnailAction}>
      {thumbnail.status === 'empty' ? (
        <View style={styles.emptyThumbnail}>
          <MaterialIcons name="add-photo-alternate" size={24} color={colors.text.secondary} />
          <Text style={styles.emptyThumbnailText}>Add Thumbnail</Text>
        </View>
      ) : thumbnail.thumbnailUrl ? (
        <Image 
          source={{ uri: thumbnail.thumbnailUrl }} 
          style={styles.thumbnailImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.uploadedThumbnail}>
          <LinearGradient colors={[colors.primary, '#7b61ff']} style={styles.thumbnailImage}>
            <MaterialIcons name="image" size={20} color="white" />
          </LinearGradient>
        </View>
      )}
      <TouchableOpacity style={styles.replaceBtn} onPress={handleThumbnailAction}>
        <MaterialIcons name="refresh" size={12} color={colors.text.primary} />
        <Text style={styles.replaceBtnText}>
          {thumbnail.status === 'empty' ? 'Add' : 'Replace'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function ScheduledPostItem({ 
  post, 
  customAlert,
  colors,
  styles
}: { 
  post: ScheduledPost;
  customAlert: any;
  colors: any;
  styles: any;
}) {
  const formatScheduledTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleScheduledPostAction = () => {
    customAlert.show({
      title: 'Scheduled Post Options',
      message: `"${post.title}"\nScheduled for: ${formatScheduledTime(post.scheduledFor)}`,
      type: 'info',
      icon: 'schedule',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Edit Schedule', 
          onPress: () => {
            customAlert.show({
              title: 'Edit Schedule',
              message: 'Schedule editing will be implemented in the next update.',
              type: 'info',
              icon: 'edit'
            });
          }
        },
        { 
          text: 'Publish Now', 
          onPress: () => {
            customAlert.show({
              title: 'Publish Now',
              message: 'Are you sure you want to publish this post immediately?',
              type: 'warning',
              icon: 'publish',
              buttons: [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Publish', 
                  onPress: () => {
                    customAlert.show({
                      title: 'Publishing...',
                      message: 'Please wait while we publish your post.',
                      type: 'info',
                      icon: 'cloud-upload',
                      buttons: []
                    });
                    
                    setTimeout(() => {
                      customAlert.show({
                        title: 'Success',
                        message: 'Post published successfully!',
                        type: 'success',
                        icon: 'check-circle'
                      });
                    }, 2000);
                  }
                }
              ]
            });
          }
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            customAlert.show({
              title: 'Delete Scheduled Post',
              message: 'Are you sure you want to delete this scheduled post?',
              type: 'warning',
              icon: 'warning',
              buttons: [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => {
                    customAlert.show({
                      title: 'Success',
                      message: 'Scheduled post deleted successfully',
                      type: 'success',
                      icon: 'check-circle'
                    });
                  }
                }
              ]
            });
          }
        }
      ]
    });
  };

  return (
    <TouchableOpacity style={styles.scheduledItem} onPress={handleScheduledPostAction}>
      <View style={styles.scheduledHeader}>
        <MaterialIcons name="schedule" size={16} color={colors.text.primary} />
        <Text style={styles.scheduledTitle}>{post.title}</Text>
      </View>
      <Text style={styles.scheduledTime}>{formatScheduledTime(post.scheduledFor)}</Text>
      {(post as any).type && (
        <Text style={styles.postType}>{(post as any).type.charAt(0).toUpperCase() + (post as any).type.slice(1)}</Text>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 },
  sectionTitle: { color: colors.text.primary, fontSize: 16, fontWeight: '700' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  card: { backgroundColor: colors.background.secondary, borderRadius: 12, padding: 12, marginBottom: 12 },
  uploadItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  uploadThumb: { width: 48, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  uploadContent: { flex: 1, marginLeft: 12 },
  uploadTitle: { color: colors.text.primary, fontWeight: '700', fontSize: 14 },
  uploadStatus: { fontSize: 12, marginTop: 2 },
  videoType: { color: colors.primary, fontSize: 10, fontWeight: '600', marginTop: 2 },
  uploadActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8,
    gap: 4,
  },
  viewBtn: { backgroundColor: 'rgba(99, 102, 241, 0.2)', borderWidth: 1, borderColor: 'rgba(99, 102, 241, 0.3)' },
  editBtn: { backgroundColor: 'rgba(255, 193, 7, 0.2)', borderWidth: 1, borderColor: 'rgba(255, 193, 7, 0.3)' },
  deleteBtn: { backgroundColor: 'rgba(244, 67, 54, 0.2)', borderWidth: 1, borderColor: 'rgba(244, 67, 54, 0.3)' },
  actionBtnText: { color: colors.text.primary, fontSize: 11, fontWeight: '600' },
  thumbnailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  thumbnailSlot: { width: '30%', aspectRatio: 16/9, backgroundColor: colors.background.secondary, borderRadius: 12, padding: 8, alignItems: 'center', justifyContent: 'space-between' },
  emptyThumbnail: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyThumbnailText: { color: colors.text.secondary, fontSize: 8, marginTop: 2, textAlign: 'center' },
  uploadedThumbnail: { flex: 1, width: '100%' },
  thumbnailImage: { flex: 1, width: '100%', borderRadius: 8 },
  replaceBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  replaceBtnText: { color: colors.text.primary, fontSize: 10, fontWeight: '700' },
  scheduledItem: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  scheduledHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  scheduledTitle: { color: colors.text.primary, fontWeight: '700', fontSize: 14 },
  scheduledTime: { color: colors.text.secondary, fontSize: 12, marginLeft: 24 },
  postType: { color: colors.primary, fontSize: 10, fontWeight: '600', marginTop: 2 },
  showMoreBtn: { marginTop: 8, alignItems: 'center', justifyContent: 'center', padding: 8 },
  showMoreText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  loadingText: { color: colors.text.secondary, marginTop: 8 },
  errorText: { color: colors.error, marginTop: 8 },
  retryBtn: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  retryText: { color: colors.text.primary, fontWeight: '700' },
  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  editModal: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    width: '100%',
    maxHeight: '80%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  saveBtn: {
    backgroundColor: colors.primary,
  },
  cancelBtnText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
