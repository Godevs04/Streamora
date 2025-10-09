import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { fetchAnalytics } from '../../services/admin';
import { AnalyticsData, EngagementPoint, PerVideoKpis } from '../../types';
import { formatCount } from '../../utils/formatDate';
import AdminLayout from '../../components/AdminLayout';

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
    <AdminLayout title="Analytics" subtitle="Performance Insights">
      <Stack.Screen options={{ headerShown: false }} />

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
            <View style={styles.trafficAudienceRow}>
              <View style={[styles.card, styles.trafficCard]}> 
                <Text style={styles.cardTitle}>Traffic Sources</Text>
                <View style={styles.trafficChart}>
                  {renderBar('Direct', data?.traffic?.direct || 0, 'direct')}
                  {renderBar('External', data?.traffic?.external || 0, 'external')}
                  {renderBar('Search', data?.traffic?.search || 0, 'search')}
                  {renderBar('Suggested', data?.traffic?.suggested || 0, 'suggested')}
                </View>
              </View>
              <View style={[styles.card, styles.demographicsCard]}> 
                <Text style={styles.cardTitle}>Audience Demographics</Text>
                <View style={styles.demographicsContent}>
                  <Text style={styles.demographicRow}>Male {Math.round((data?.demographics?.male || 0))}%</Text>
                  <Text style={styles.demographicRow}>Female {Math.round((data?.demographics?.female || 0))}%</Text>
                  <Text style={styles.demographicRow}>Other {Math.round((data?.demographics?.other || 0))}%</Text>
                </View>
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
    </AdminLayout>
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
      <View style={styles.kpiIconWrapper}>
        <MaterialIcons name={icon} size={12} color={colors.text.primary} />
      </View>
      <View style={styles.kpiContent}>
        <Text style={styles.kpiText}>{label}</Text>
        <Text style={styles.kpiValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 },
  sectionTitle: { color: colors.text.primary, fontSize: 16, fontWeight: '700' },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  card: { backgroundColor: colors.background.secondary, borderRadius: 12, padding: 12 },
  cardTitle: { color: colors.text.primary, fontWeight: '700', marginBottom: 8 },
  trafficLabel: { color: colors.text.secondary, fontSize: 12, marginTop: 6 },
  demographicRow: { color: colors.text.secondary, fontSize: 13, marginTop: 6 },
  trafficAudienceRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  trafficCard: { flex: 2 },
  demographicsCard: { flex: 1 },
  trafficChart: { height: 140, justifyContent: 'flex-end', flexDirection: 'row', alignItems: 'flex-end', gap: 16, paddingHorizontal: 12 },
  demographicsContent: { paddingTop: 8 },
  videoKpiRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  videoTitle: { color: colors.text.primary, fontWeight: '700', fontSize: 14 },
  videoMeta: { color: colors.text.secondary, fontSize: 12, marginTop: 2 },
  kpiPill: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    paddingHorizontal: 8, 
    paddingVertical: 6, 
    borderRadius: 8,
    minWidth: 70,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  kpiIconWrapper: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  kpiContent: {
    flex: 1,
    alignItems: 'center',
  },
  kpiText: { 
    color: colors.text.secondary, 
    fontSize: 9, 
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 11,
  },
  kpiValue: { 
    color: colors.text.primary, 
    fontSize: 10, 
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 12,
  },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  loadingText: { color: colors.text.secondary, marginTop: 8 },
  errorText: { color: colors.error, marginTop: 8 },
  retryBtn: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  retryText: { color: colors.text.primary, fontWeight: '700' },
});
