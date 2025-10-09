import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../../constants/colors';
import { fetchAdminDashboard } from '../../services/admin';
import { AdminDashboardData, Video } from '../../types';
import { formatCount } from '../../utils/formatDate';
import AdminLayout from '../../components/AdminLayout';

const TABS = ['Dashboard', 'Analytics', 'Monetization', 'Content', 'Community', 'Settings'] as const;

type TabKey = typeof TABS[number];

export default function AdminDashboard() {
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
    <AdminLayout title="Dashboard" subtitle="Creator Studio">
      <Stack.Screen options={{ headerShown: false }} />

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
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Welcome back!</Text>
            <Text style={styles.welcomeSubtitle}>Here's what's happening with your channel</Text>
          </View>

          {/* Stats Row */}
          <View style={styles.cardsRow}>
            <StatCard key="subscribers" icon="people-outline" label="Subscribers" value={formatCount(Number(data?.stats?.subscribers || 0))} />
            <StatCard key="totalViews" icon="visibility" label="Total Views" value={formatCount(Number(data?.stats?.totalViews || 0))} />
            <StatCard key="watchTime" icon="schedule" label="Watch Time" value={`${formatCount(Number(data?.stats?.watchTimeHours || 0))}h`} />
          </View>

          {/* Performance Overview */}
          <View style={styles.performanceCard}>
            <Text style={styles.cardTitle}>Performance Overview</Text>
            <View style={styles.progressBarBg}>
              <View style={styles.progressBarFill} />
            </View>
            <Text style={styles.progressText}>70% of monthly goal achieved</Text>
          </View>

          {/* Latest Videos */}
          <SectionHeader key="dashboard-latest-videos" title="Latest Videos" />
          <View style={{ gap: 12 }}>
            {latestVideos.slice(0, 3).map((v) => (
              <LatestVideoItem key={v._id} video={v} />
            ))}
            {latestVideos.length > 3 && (
              <TouchableOpacity style={styles.showMore} onPress={() => router.push('/admin/content')}>
                <Text style={styles.showMoreText}>Show {latestVideos.length - 3} More</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      )}
    </AdminLayout>
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
  content: { 
    paddingHorizontal: 16, 
    paddingTop: 16 
  },
  welcomeSection: {
    marginBottom: 24,
    alignItems: 'center',
  },
  welcomeTitle: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
  cardsRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 20 
  },
  statCard: { 
    flex: 1, 
    backgroundColor: colors.background.secondary, 
    borderRadius: 16, 
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIconWrap: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: 'rgba(99, 102, 241, 0.2)', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 12 
  },
  statLabel: { 
    color: colors.text.secondary, 
    fontSize: 14, 
    fontWeight: '600' 
  },
  statValue: { 
    color: colors.text.primary, 
    fontSize: 22, 
    fontWeight: '700', 
    marginTop: 4 
  },
  performanceCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  progressBarBg: { 
    height: 8, 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    borderRadius: 4, 
    marginBottom: 8 
  },
  progressBarFill: { 
    height: 8, 
    width: '70%', 
    backgroundColor: colors.primary, 
    borderRadius: 4 
  },
  progressText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    marginTop: 8, 
    marginBottom: 16 
  },
  sectionTitle: { 
    color: colors.text.primary, 
    fontSize: 18, 
    fontWeight: '700' 
  },
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: colors.primary 
  },
  latestItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.background.secondary, 
    borderRadius: 16, 
    padding: 16, 
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  latestThumb: { 
    width: 64, 
    height: 48, 
    borderRadius: 12 
  },
  latestTitle: { 
    color: colors.text.primary, 
    fontSize: 16, 
    fontWeight: '700', 
    marginBottom: 6 
  },
  latestMeta: { 
    color: colors.text.secondary, 
    fontSize: 14, 
    fontWeight: '600' 
  },
  viewBtn: { 
    backgroundColor: colors.primary, 
    paddingHorizontal: 16, 
    paddingVertical: 8, 
    borderRadius: 12 
  },
  viewBtnText: { 
    color: colors.text.primary, 
    fontSize: 14, 
    fontWeight: '700' 
  },
  showMore: { 
    marginTop: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 16, 
    borderRadius: 16, 
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  showMoreText: { 
    color: colors.primary, 
    fontSize: 16, 
    fontWeight: '700' 
  },
  centerWrap: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingTop: 40 
  },
  loadingText: { 
    color: colors.text.secondary, 
    marginTop: 8 
  },
  errorText: { 
    color: colors.error, 
    marginTop: 8 
  },
  retryBtn: { 
    marginTop: 10, 
    backgroundColor: 'rgba(255,255,255,0.12)', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 10 
  },
  retryText: { 
    color: colors.text.primary, 
    fontWeight: '700' 
  },
});
