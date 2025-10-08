import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { fetchAdminDashboard } from '../../services/admin';
import { AdminDashboardData, Video } from '../../types';
import { formatCount } from '../../utils/formatDate';

const TABS = ['Dashboard', 'Analytics', 'Monetization', 'Content', 'Community', 'Settings'] as const;

type TabKey = typeof TABS[number];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('Dashboard');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminDashboardData | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchAdminDashboard();
      setData(res);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const latestVideos = useMemo<Video[]>(() => data?.latestVideos || [], [data]);

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

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsRow}>
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={`dashboard-tab-${tab}-${index}`}
              style={[styles.tab, activeTab === tab && styles.tabActive]}
              onPress={() => {
                if (tab === 'Analytics') {
                  router.push('/admin/analytics');
                } else if (tab === 'Monetization') {
                  router.push('/admin/monetization');
                } else if (tab === 'Community') {
                  router.push('/admin/community');
                    } else if (tab === 'Content') {
                  router.push('/admin/content');
                } else if (tab === 'Settings') {
                  router.push('/admin/settings');
                } else {
                  setActiveTab(tab);
                }
              }}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading dashboard…</Text>
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
            {/* Progress bar line mimic */}
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>

            {/* Stats Row */}
            <View style={styles.cardsRow}>
              <StatCard key="subscribers" icon="people-outline" label="Subscribers" value={formatCount(Number(data?.stats?.subscribers || 0))} />
              <StatCard key="totalViews" icon="visibility" label="Total Views" value={formatCount(Number(data?.stats?.totalViews || 0))} />
              <StatCard key="watchTime" icon="schedule" label="Watch Time" value={`${formatCount(Number(data?.stats?.watchTimeHours || 0))}h`} />
            </View>

            {/* Latest Videos */}
            <SectionHeader key="dashboard-latest-videos" title="Latest Videos" />
            <View style={{ gap: 12 }}>
              {latestVideos.slice(0, 3).map((v) => (
                <LatestVideoItem key={v._id} video={v} />
              ))}
              {latestVideos.length > 3 && (
                <TouchableOpacity style={styles.showMore} onPress={() => setActiveTab('Content')}>
                  <Text style={styles.showMoreText}>Show {latestVideos.length - 3} More</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

function StatCard({ icon, label, value }: { icon: any; label: string; value: string; }) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statIconWrap}>
        <MaterialIcons name={icon} size={20} color={colors.text.primary} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
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

function LatestVideoItem({ video }: { video: Video }) {
  const views = formatCount(typeof video.views === 'number' ? video.views : 0);
  const likes = formatCount(typeof video.likesCount === 'number' ? video.likesCount : 0);
  const comments = formatCount(typeof (video as any).commentsCount === 'number' ? (video as any).commentsCount : (Array.isArray(video.comments) ? video.comments.length : 0));
  return (
    <View style={styles.latestItem}>
      <LinearGradient colors={[colors.primary, '#7b61ff']} style={styles.latestThumb} />
      <View style={{ flex: 1 }}>
        <Text style={styles.latestTitle} numberOfLines={1}>{video.title || 'Untitled Upload'}</Text>
        <Text style={styles.latestMeta}>{`${views} views • ${likes} likes • ${comments} comments`}</Text>
      </View>
      <TouchableOpacity style={styles.viewBtn} onPress={() => router.push(`/video/${video._id}`)}>
        <Text style={styles.viewBtnText}>View</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8,
  },
  backButton: { padding: 8 },
  title: { color: colors.text.primary, fontSize: 20, fontWeight: '700' },
  subtitle: { color: colors.text.secondary, fontSize: 13, marginTop: 2 },
  tabsRow: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  tab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.08)' },
  tabActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
  tabText: { color: colors.text.secondary, fontWeight: '600' },
  tabTextActive: { color: colors.text.primary },
  progressBarBg: { height: 8, backgroundColor: '#ffffff', opacity: 0.6, marginHorizontal: 16, borderRadius: 4, marginTop: 6 },
  progressBarFill: { height: 8, width: '70%', backgroundColor: colors.primary, borderRadius: 4 },
  content: { paddingHorizontal: 16, paddingTop: 16 },
  cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: colors.background.secondary, borderRadius: 12, padding: 14 },
  statIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statLabel: { color: colors.text.secondary, fontSize: 13, fontWeight: '600' },
  statValue: { color: colors.text.primary, fontSize: 20, fontWeight: '700', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 },
  sectionTitle: { color: colors.text.primary, fontSize: 16, fontWeight: '700' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  latestItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.secondary, borderRadius: 12, padding: 12, gap: 12 },
  latestThumb: { width: 56, height: 40, borderRadius: 8 },
  latestTitle: { color: colors.text.primary, fontSize: 14, fontWeight: '700', marginBottom: 4 },
  latestMeta: { color: colors.text.secondary, fontSize: 12, fontWeight: '600' },
  viewBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  viewBtnText: { color: colors.text.primary, fontSize: 12, fontWeight: '700' },
  showMore: { marginTop: 8, alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 12, backgroundColor: colors.background.secondary },
  showMoreText: { color: colors.text.primary, fontSize: 14, fontWeight: '600' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  loadingText: { color: colors.text.secondary, marginTop: 8 },
  errorText: { color: colors.error, marginTop: 8 },
  retryBtn: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  retryText: { color: colors.text.primary, fontWeight: '700' },
});
