import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '../../constants/colors';
import { fetchMonetization } from '../../services/admin';
import { MonetizationData, PayoutRecord } from '../../types';
import { formatCount } from '../../utils/formatDate';

export default function AdminMonetization() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MonetizationData | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchMonetization();
      setData(res);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load monetization data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const payouts = useMemo<PayoutRecord[]>(() => data?.payouts || [], [data]);

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
              key={`monetization-tab-${tab}-${index}`}
              style={[styles.tab, tab === 'Monetization' && styles.tabActive]}
              onPress={() => {
                if (tab === 'Dashboard') router.push('/admin');
                if (tab === 'Analytics') router.push('/admin/analytics');
                if (tab === 'Content') router.push('/admin/content');
                if (tab === 'Community') router.push('/admin/community');
                if (tab === 'Settings') router.push('/admin/settings');
              }}
            >
              <Text style={[styles.tabText, tab === 'Monetization' && styles.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Progress bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '60%' }]} />
        </View>

        {loading ? (
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading monetization…</Text>
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
            {/* Monetization Eligibility */}
            <SectionHeader key="monetization-eligibility-section" title="Monetization Eligibility" />
            <View style={styles.eligibilityCard}>
              <View style={styles.eligibilityRow}>
                <EligibilityPill 
                  key="subscribers"
                  label="1K+ Subscribers" 
                  value={formatCount(data?.eligibility?.subscribers || 0)} 
                  met={(data?.eligibility?.subscribers || 0) >= 1000} 
                />
                <EligibilityPill 
                  key="watchHours"
                  label="4K+ Watch Hours" 
                  value={formatCount(data?.eligibility?.watchHours || 0)} 
                  met={(data?.eligibility?.watchHours || 0) >= 4000} 
                />
                <EligibilityPill 
                  key="policy"
                  label="Policy Compliance" 
                  value="Yes" 
                  met={data?.eligibility?.policyCompliance || false} 
                />
              </View>
              <View style={styles.approvalRow}>
                <MaterialIcons 
                  name={data?.eligibility?.approved ? "check-circle" : "cancel"} 
                  size={20} 
                  color={data?.eligibility?.approved ? colors.primary : colors.error} 
                />
                <Text style={styles.approvalText}>
                  Monetization {data?.eligibility?.approved ? 'Approved' : 'Not Approved'}
                </Text>
                {data?.eligibility?.approved && (
                  <TouchableOpacity style={styles.viewDetailsBtn}>
                    <Text style={styles.viewDetailsText}>View Details</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Earnings Overview */}
            <SectionHeader key="monetization-earnings-overview" title="Earnings Overview" />
            <View style={styles.earningsCard}>
              <View style={styles.earningsRow}>
                <EarningsMetric 
                  key="revenue"
                  label="ESTIMATED REVENUE" 
                  value={`$${(data?.earnings?.estimatedRevenue || 0).toFixed(2)}`} 
                />
                <EarningsMetric 
                  key="cpm"
                  label="CPM" 
                  value={`$${(data?.earnings?.cpm || 0).toFixed(2)}`} 
                />
                <EarningsMetric 
                  key="rpm"
                  label="RPM" 
                  value={`$${(data?.earnings?.rpm || 0).toFixed(2)}`} 
                />
              </View>
              <View style={styles.chartContainer}>
                <EarningsChart data={data?.earningsHistory?.map(h => h.revenue) || []} />
              </View>
            </View>

            {/* Withdrawal & Ad Revenue */}
            <View style={styles.withdrawalRevenueRow}>
              <View style={[styles.card, styles.withdrawalCard]}>
                <Text style={styles.cardTitle}>Withdrawal</Text>
                <View style={styles.balanceRow}>
                  <MaterialIcons name="account-balance-wallet" size={20} color={colors.text.primary} />
                  <Text style={styles.balanceText}>Balance</Text>
                </View>
                <Text style={styles.balanceAmount}>${(data?.balance || 0).toFixed(2)}</Text>
                <TouchableOpacity style={styles.withdrawBtn}>
                  <Text style={styles.withdrawText}>Withdraw</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addMethodBtn}>
                  <Text style={styles.addMethodText}>Add Method</Text>
                </TouchableOpacity>
                
                <Text style={styles.recentPayoutsTitle}>Recent payouts</Text>
                {payouts.slice(0, 3).map((payout, index) => (
                  <PayoutItem key={`${payout.date}-${index}`} payout={payout} />
                ))}
              </View>

              <View style={[styles.card, styles.revenueCard]}>
                <Text style={styles.cardTitle}>Ad Revenue Breakdown</Text>
                <View style={styles.revenueBreakdown}>
                  <RevenueItem 
                    key="ads"
                    icon="play-circle-filled" 
                    label="Ads" 
                    value={`$${(data?.revenueBreakdown?.ads || 0).toFixed(0)}`} 
                  />
                  <RevenueItem 
                    key="shorts"
                    icon="video-library" 
                    label="Shorts Fund" 
                    value={`$${(data?.revenueBreakdown?.shorts || 0).toFixed(0)}`} 
                  />
                  <RevenueItem 
                    key="memberships"
                    icon="people" 
                    label="Memberships" 
                    value={`$${(data?.revenueBreakdown?.memberships || 0).toFixed(0)}`} 
                  />
                  <RevenueItem 
                    key="superChat"
                    icon="attach-money" 
                    label="Super Chat" 
                    value={`$${(data?.revenueBreakdown?.superChat || 0).toFixed(0)}`} 
                  />
                </View>
              </View>
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

function EligibilityPill({ label, value, met }: { label: string; value: string; met: boolean }) {
  return (
    <View style={[styles.eligibilityPill, met && styles.eligibilityPillMet]}>
      <Text style={[styles.eligibilityLabel, met && styles.eligibilityLabelMet]}>{label}</Text>
      <Text style={[styles.eligibilityValue, met && styles.eligibilityValueMet]}>{value}</Text>
    </View>
  );
}

function EarningsMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.earningsMetric}>
      <Text style={styles.earningsLabel}>{label}</Text>
      <Text style={styles.earningsValue}>{value}</Text>
    </View>
  );
}

function EarningsChart({ data }: { data: number[] }) {
  const max = Math.max(1, ...data);
  return (
    <View style={styles.chartWrapper}>
      {data.map((v, i) => (
        <View key={`chart-bar-${i}`} style={[styles.chartBar, { height: Math.max(4, (v / max) * 80) }]} />
      ))}
    </View>
  );
}

function PayoutItem({ payout }: { payout: PayoutRecord }) {
  return (
    <View style={styles.payoutItem}>
      <Text style={styles.payoutAmount}>Paid ${payout.amount.toFixed(2)}</Text>
      <Text style={styles.payoutDate}>{new Date(payout.date).toLocaleDateString()}</Text>
      <Text style={styles.payoutMethod}>{payout.method}</Text>
    </View>
  );
}

function RevenueItem({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.revenueItem}>
      <MaterialIcons name={icon} size={16} color={colors.text.primary} />
      <Text style={styles.revenueLabel}>{label}</Text>
      <Text style={styles.revenueValue}>{value}</Text>
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
  eligibilityCard: { backgroundColor: colors.background.secondary, borderRadius: 12, padding: 16 },
  eligibilityRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  eligibilityPill: { flex: 1, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, alignItems: 'center' },
  eligibilityPillMet: { backgroundColor: 'rgba(76, 175, 80, 0.2)' },
  eligibilityLabel: { color: colors.text.secondary, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  eligibilityLabelMet: { color: colors.primary },
  eligibilityValue: { color: colors.text.primary, fontSize: 16, fontWeight: '700', marginTop: 4 },
  eligibilityValueMet: { color: colors.primary },
  approvalRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  approvalText: { color: colors.text.primary, fontWeight: '600', flex: 1 },
  viewDetailsBtn: { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  viewDetailsText: { color: colors.text.primary, fontSize: 12, fontWeight: '700' },
  earningsCard: { backgroundColor: colors.background.secondary, borderRadius: 12, padding: 16 },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  earningsMetric: { alignItems: 'center' },
  earningsLabel: { color: colors.text.secondary, fontSize: 12, fontWeight: '600' },
  earningsValue: { color: colors.text.primary, fontSize: 18, fontWeight: '700', marginTop: 4 },
  chartContainer: { height: 100 },
  chartWrapper: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 80, paddingHorizontal: 12 },
  chartBar: { flex: 1, backgroundColor: colors.primary, borderRadius: 2 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  balanceText: { color: colors.text.secondary, fontSize: 14, fontWeight: '600' },
  balanceAmount: { color: colors.text.primary, fontSize: 24, fontWeight: '700', marginBottom: 12 },
  withdrawBtn: { backgroundColor: colors.primary, paddingVertical: 10, borderRadius: 12, marginBottom: 8 },
  withdrawText: { color: colors.text.primary, textAlign: 'center', fontWeight: '700' },
  addMethodBtn: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingVertical: 8, borderRadius: 12, marginBottom: 16 },
  addMethodText: { color: colors.text.primary, textAlign: 'center', fontWeight: '600' },
  recentPayoutsTitle: { color: colors.text.primary, fontWeight: '700', marginBottom: 8 },
  payoutItem: { paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  payoutAmount: { color: colors.text.primary, fontWeight: '700', fontSize: 14 },
  payoutDate: { color: colors.text.secondary, fontSize: 12, marginTop: 2 },
  payoutMethod: { color: colors.text.secondary, fontSize: 12 },
  revenueBreakdown: { gap: 12 },
  withdrawalRevenueRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  withdrawalCard: { flex: 1 },
  revenueCard: { flex: 1 },
  revenueItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  revenueLabel: { color: colors.text.secondary, fontSize: 14, fontWeight: '600', flex: 1 },
  revenueValue: { color: colors.text.primary, fontSize: 14, fontWeight: '700' },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  loadingText: { color: colors.text.secondary, marginTop: 8 },
  errorText: { color: colors.error, marginTop: 8 },
  retryBtn: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  retryText: { color: colors.text.primary, fontWeight: '700' },
});
