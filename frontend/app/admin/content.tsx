import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { fetchContent } from '../../services/admin';
import { ContentData, UploadVideo, ThumbnailSlot, ScheduledPost } from '../../types';

export default function AdminContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ContentData | null>(null);

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

  useEffect(() => {
    load();
  }, []);

  const uploads = useMemo<UploadVideo[]>(() => data?.uploads || [], [data]);
  const thumbnails = useMemo<ThumbnailSlot[]>(() => data?.thumbnails || [], [data]);
  const scheduledPosts = useMemo<ScheduledPost[]>(() => data?.scheduledPosts || [], [data]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Creator Studio</Text>
            <Text style={styles.subtitle}>Admin Mode</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Tabs header mimic */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {['Dashboard','Analytics','Monetization','Content','Community','Settings'].map((tab, index) => (
            <TouchableOpacity
              key={`content-tab-${tab}-${index}`}
              style={[styles.tab, tab === 'Content' && styles.tabActive]}
              onPress={() => {
                if (tab === 'Dashboard') router.push('/admin');
                if (tab === 'Analytics') router.push('/admin/analytics');
                if (tab === 'Monetization') router.push('/admin/monetization');
                if (tab === 'Community') router.push('/admin/community');
                if (tab === 'Settings') router.push('/admin/settings');
              }}
            >
              <Text style={[styles.tabText, tab === 'Content' && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '100%' }]} />
        </View>

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
            <SectionHeader key="content-upload-manager" title="Upload Manager" />
            <View style={styles.card}>
              {uploads.slice(0, 4).map((upload) => (
                <UploadVideoItem key={upload._id} upload={upload} />
              ))}
              {uploads.length > 4 && (
                <TouchableOpacity style={styles.showMoreBtn}>
                  <Text style={styles.showMoreText}>Show {uploads.length - 4} More</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Thumbnail Manager */}
            <SectionHeader key="content-thumbnail-manager" title="Thumbnail Manager" />
            <View style={styles.thumbnailGrid}>
              {thumbnails.map((thumbnail) => (
                <ThumbnailSlotItem key={thumbnail._id} thumbnail={thumbnail} />
              ))}
            </View>

            {/* Scheduled Posts */}
            <SectionHeader key="content-scheduled-posts" title="Scheduled Posts" />
            <View style={styles.card}>
              {scheduledPosts.map((post) => (
                <ScheduledPostItem key={post._id} post={post} />
              ))}
            </View>
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.dot} />
    </View>
  );
}

function UploadVideoItem({ upload }: { upload: UploadVideo }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return colors.primary;
      case 'scheduled': return colors.error;
      case 'draft': return colors.text.secondary;
      default: return colors.text.secondary;
    }
  };

  return (
    <View style={styles.uploadItem}>
      <LinearGradient colors={[colors.primary, '#7b61ff']} style={styles.uploadThumb} />
      <View style={styles.uploadContent}>
        <Text style={styles.uploadTitle}>{upload.title}</Text>
        <Text style={[styles.uploadStatus, { color: getStatusColor(upload.status) }]}>
          {upload.status.charAt(0).toUpperCase() + upload.status.slice(1)}
        </Text>
      </View>
      <View style={styles.uploadActions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ThumbnailSlotItem({ thumbnail }: { thumbnail: ThumbnailSlot }) {
  return (
    <View style={styles.thumbnailSlot}>
      {thumbnail.status === 'empty' ? (
        <View style={styles.emptyThumbnail}>
          <MaterialIcons name="add-photo-alternate" size={24} color={colors.text.secondary} />
        </View>
      ) : (
        <View style={styles.uploadedThumbnail}>
          <LinearGradient colors={[colors.primary, '#7b61ff']} style={styles.thumbnailImage} />
        </View>
      )}
      <TouchableOpacity style={styles.replaceBtn}>
        <MaterialIcons name="refresh" size={12} color={colors.text.primary} />
        <Text style={styles.replaceBtnText}>Replace</Text>
      </TouchableOpacity>
    </View>
  );
}

function ScheduledPostItem({ post }: { post: ScheduledPost }) {
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

  return (
    <View style={styles.scheduledItem}>
      <View style={styles.scheduledHeader}>
        <MaterialIcons name="schedule" size={16} color={colors.text.primary} />
        <Text style={styles.scheduledTitle}>{post.title}</Text>
      </View>
      <Text style={styles.scheduledTime}>{formatScheduledTime(post.scheduledFor)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  backButton: { padding: 8 },
  title: { color: colors.text.primary, fontSize: 20, fontWeight: '700' },
  subtitle: { color: colors.text.secondary, fontSize: 13, marginTop: 2 },
  tabsRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)' },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabText: { color: colors.text.secondary, fontWeight: '600' },
  tabTextActive: { color: colors.text.primary },
  progressBarBg: { height: 8, backgroundColor: '#ffffff', opacity: 0.6, marginHorizontal: 16, borderRadius: 4, marginTop: 6 },
  progressBarFill: { height: 8, backgroundColor: colors.primary, borderRadius: 4 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 },
  sectionTitle: { color: colors.text.primary, fontSize: 16, fontWeight: '700' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  card: { backgroundColor: colors.background.secondary, borderRadius: 12, padding: 12, marginBottom: 12 },
  uploadItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  uploadThumb: { width: 48, height: 32, borderRadius: 8, marginRight: 12 },
  uploadContent: { flex: 1 },
  uploadTitle: { color: colors.text.primary, fontWeight: '700', fontSize: 14, marginBottom: 2 },
  uploadStatus: { fontSize: 12, fontWeight: '600' },
  uploadActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  actionBtnText: { color: colors.text.primary, fontSize: 12, fontWeight: '700' },
  thumbnailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  thumbnailSlot: { width: '30%', aspectRatio: 16/9, backgroundColor: colors.background.secondary, borderRadius: 12, padding: 8, alignItems: 'center', justifyContent: 'space-between' },
  emptyThumbnail: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  uploadedThumbnail: { flex: 1, width: '100%' },
  thumbnailImage: { flex: 1, width: '100%', borderRadius: 8 },
  replaceBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  replaceBtnText: { color: colors.text.primary, fontSize: 10, fontWeight: '700' },
  scheduledItem: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  scheduledHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  scheduledTitle: { color: colors.text.primary, fontWeight: '700', fontSize: 14 },
  scheduledTime: { color: colors.text.secondary, fontSize: 12, marginLeft: 24 },
  showMoreBtn: { marginTop: 8, alignItems: 'center', justifyContent: 'center', padding: 8 },
  showMoreText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  loadingText: { color: colors.text.secondary, marginTop: 8 },
  errorText: { color: colors.error, marginTop: 8 },
  retryBtn: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  retryText: { color: colors.text.primary, fontWeight: '700' },
});
