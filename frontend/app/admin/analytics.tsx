import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { fetchAnalytics } from '../../services/admin';
import { AnalyticsData, EngagementPoint, PerVideoKpis } from '../../types';
import { formatCount } from '../../utils/formatDate';

export default function AdminAnalytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchAnalytics();
      setData(res);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const perVideo = useMemo<PerVideoKpis[]>(() => data?.perVideo || [], [data]);

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
              key={`analytics-tab-${tab}-${index}`}
              style={[styles.tab, tab === 'Analytics' && styles.tabActive]}
              onPress={() => {
                if (tab === 'Dashboard') router.replace('/admin');
                if (tab === 'Monetization') router.replace('/admin/monetization');
                if (tab === 'Content') router.replace('/admin/content');
                if (tab === 'Community') router.replace('/admin/community');
                if (tab === 'Settings') router.replace('/admin/settings');
              }}
            >
              <Text style={[styles.tabText, tab === 'Analytics' && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '40%' }]} />
        </View>

        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading analytics…</Text>
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
            {/* Engagement */}
            <SectionHeader key="analytics-engagement" title="Engagement (Views over time)" />
            <View style={styles.card}>
              <LineBar data={data?.engagement?.map((p: EngagementPoint) => p.views) || []} />
            </View>

            {/* Traffic + Audience */}
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
              <View style={[styles.card, { flex: 2 }]}> 
                <Text style={styles.cardTitle}>Traffic Sources</Text>
                <View style={{ height: 140, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'flex-end', gap: 16, paddingHorizontal: 12 }}>
                  {renderBar('Direct', data?.traffic?.direct || 0, 'direct')}
                  {renderBar('External', data?.traffic?.external || 0, 'external')}
                  {renderBar('Search', data?.traffic?.search || 0, 'search')}
                  {renderBar('Suggested', data?.traffic?.suggested || 0, 'suggested')}
                </View>
              </View>
              <View style={[styles.card, { flex: 1 }]}> 
                <Text style={styles.cardTitle}>Audience Demographics</Text>
                <Text style={styles.demographicRow}>Male {Math.round((data?.demographics?.male || 0))}%</Text>
                <Text style={styles.demographicRow}>Female {Math.round((data?.demographics?.female || 0))}%</Text>
                <Text style={styles.demographicRow}>Other {Math.round((data?.demographics?.other || 0))}%</Text>
              </View>
            </View>

            {/* Per-Video */}
            <SectionHeader key="analytics-per-video" title="Per-Video Analytics" />
            <View style={[styles.card, { padding: 0 }]}>
              {perVideo.map((kpi) => (
                <View key={kpi.videoId} style={styles.videoKpiRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.videoTitle} numberOfLines={1}>{kpi.title}</Text>
                    <Text style={styles.videoMeta}>Retention {Math.round(kpi.retentionPercent || 0)}%</Text>
                  </View>
                  <KpiPill key={`${kpi.videoId}-views`} label="Views" value={formatCount(kpi.views)} icon="visibility" />
                  <KpiPill key={`${kpi.videoId}-likes`} label="Likes" value={formatCount(kpi.likes)} icon="trending-up" />
                  <KpiPill key={`${kpi.videoId}-comments`} label="Comments" value={formatCount(kpi.comments)} icon="chat-bubble-outline" />
                  <KpiPill key={`${kpi.videoId}-shares`} label="Shares" value={formatCount(kpi.shares || 0)} icon="share" />
                </View>
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

function LineBar({ data }: { data: number[] }) {
  const max = Math.max(1, ...data);
  return (
    <View style={{ height: 140, flexDirection: 'row', alignItems: 'flex-end', gap: 6, padding: 12 }}>
      {data.map((v, i) => (
        <View key={`line-bar-${i}`} style={{ width: 10, height: Math.max(4, (v / max) * 120), backgroundColor: colors.primary, borderRadius: 4 }} />
      ))}
    </View>
  );
}

function renderBar(label: string, value: number, key: string) {
  const height = Math.max(6, Math.min(120, value));
  return (
    <View key={key} style={{ alignItems: 'center' }}>
      <View style={{ width: 28, height, backgroundColor: colors.primary, borderRadius: 6 }} />
      <Text style={styles.trafficLabel}>{label}</Text>
    </View>
  );
}

function KpiPill({ label, value, icon }: { label: string; value: string; icon: any; }) {
  return (
    <View style={styles.kpiPill}>
      <MaterialIcons name={icon} size={16} color={colors.text.primary} />
      <Text style={styles.kpiText}>{label}</Text>
      <Text style={styles.kpiValue}>{value}</Text>
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
  card: { backgroundColor: colors.background.secondary, borderRadius: 12, padding: 12 },
  cardTitle: { color: colors.text.primary, fontWeight: '700', marginBottom: 8 },
  trafficLabel: { color: colors.text.secondary, fontSize: 12, marginTop: 6 },
  demographicRow: { color: colors.text.secondary, fontSize: 13, marginTop: 6 },
  videoKpiRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  videoTitle: { color: colors.text.primary, fontWeight: '700', fontSize: 14 },
  videoMeta: { color: colors.text.secondary, fontSize: 12, marginTop: 2 },
  kpiPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },
  kpiText: { color: colors.text.secondary, fontSize: 12, fontWeight: '600' },
  kpiValue: { color: colors.text.primary, fontSize: 12, fontWeight: '700' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  loadingText: { color: colors.text.secondary, marginTop: 8 },
  errorText: { color: colors.error, marginTop: 8 },
  retryBtn: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  retryText: { color: colors.text.primary, fontWeight: '700' },
});
