import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../constants/colors';
import { fetchAdminSettings, updateChannelInfo, uploadProfileImage, uploadBannerImage, addPaymentMethod, deletePaymentMethod } from '../../services/admin';
import { AdminSettingsData, PaymentMethod } from '../../types';

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminSettingsData | null>(null);
  const [channelName, setChannelName] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetchAdminSettings();
      setData(res);
      setChannelName(res.channelCustomization.channelName);
      setBio(res.channelCustomization.bio);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const paymentMethods = useMemo<PaymentMethod[]>(() => data?.paymentMethods || [], [data]);

  const handleSaveChannel = async () => {
    if (!channelName.trim()) {
      Alert.alert('Error', 'Channel name is required');
      return;
    }

    try {
      setSaving(true);
      await updateChannelInfo({ channelName: channelName.trim(), bio: bio.trim() });
      Alert.alert('Success', 'Channel information updated successfully');
      await load(); // Refresh data
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update channel information');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeProfile = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const url = await uploadProfileImage(imageUri);
        Alert.alert('Success', 'Profile image updated successfully');
        await load();
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update profile image');
    }
  };

  const handleChangeBanner = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        const url = await uploadBannerImage(imageUri);
        Alert.alert('Success', 'Banner image updated successfully');
        await load();
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update banner image');
    }
  };

  const handleAddPaymentMethod = () => {
    Alert.prompt(
      'Add Payment Method',
      'Enter PayPal email or bank account details:',
      async (text) => {
        if (text?.trim()) {
          try {
            await addPaymentMethod({
              type: text.includes('@') ? 'paypal' : 'bank',
              identifier: text.trim(),
            });
            Alert.alert('Success', 'Payment method added successfully');
            await load();
          } catch (e: any) {
            Alert.alert('Error', e?.message || 'Failed to add payment method');
          }
        }
      }
    );
  };

  const handleDeletePaymentMethod = (method: PaymentMethod) => {
    Alert.alert(
      'Delete Payment Method',
      `Are you sure you want to delete ${method.identifier}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePaymentMethod(method._id);
              Alert.alert('Success', 'Payment method deleted successfully');
              await load();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete payment method');
            }
          },
        },
      ]
    );
  };

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
              key={`settings-tab-${tab}-${index}`}
              style={[styles.tab, tab === 'Settings' && styles.tabActive]}
              onPress={() => {
                if (tab === 'Dashboard') router.replace('/admin');
                if (tab === 'Analytics') router.replace('/admin/analytics');
                if (tab === 'Monetization') router.replace('/admin/monetization');
                if (tab === 'Content') router.replace('/admin/content');
                if (tab === 'Community') router.replace('/admin/community');
              }}
            >
              <Text style={[styles.tabText, tab === 'Settings' && styles.tabTextActive]}>{tab}</Text>
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
            <Text style={styles.loadingText}>Loading settings…</Text>
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
            {/* Channel Customization */}
            <SectionHeader key="settings-channel-customization" title="Channel Customization" />
            <View style={styles.card}>
              <View style={styles.profileSection}>
                <View style={styles.profileImageContainer}>
                  {data?.channelCustomization.profileImageUrl ? (
                    <View style={styles.profileImage} />
                  ) : (
                    <View style={styles.emptyProfileImage}>
                      <MaterialIcons name="person" size={32} color={colors.text.secondary} />
                    </View>
                  )}
                </View>
                <View style={styles.profileActions}>
                  <TouchableOpacity style={styles.changeBtn} onPress={handleChangeProfile}>
                    <Text style={styles.changeBtnText}>Change Profile</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.changeBtn} onPress={handleChangeBanner}>
                    <Text style={styles.changeBtnText}>Change Banner</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Channel name</Text>
                <TextInput
                  style={styles.textInput}
                  value={channelName}
                  onChangeText={setChannelName}
                  placeholder="Enter channel name"
                  placeholderTextColor={colors.text.secondary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.textInput, styles.bioInput]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell viewers about your channel"
                  placeholderTextColor={colors.text.secondary}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <TouchableOpacity 
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]} 
                onPress={handleSaveChannel}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color={colors.text.primary} />
                ) : (
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* Payment Settings */}
            <SectionHeader key="settings-payment-settings" title="Payment Settings" />
            <View style={styles.card}>
              <View style={styles.paymentHeader}>
                <MaterialIcons name="account-balance-wallet" size={20} color={colors.text.primary} />
                <Text style={styles.paymentTitle}>Payout method</Text>
                <TouchableOpacity style={styles.addMethodBtn} onPress={handleAddPaymentMethod}>
                  <Text style={styles.addMethodText}>Add method</Text>
                </TouchableOpacity>
              </View>

              {paymentMethods.length === 0 ? (
                <Text style={styles.noPaymentText}>No payment methods added</Text>
              ) : (
                paymentMethods.map((method) => (
                  <PaymentMethodItem 
                    key={method._id} 
                    method={method} 
                    onDelete={() => handleDeletePaymentMethod(method)}
                  />
                ))
              )}
            </View>

            {/* Policy & Guidelines */}
            <SectionHeader key="settings-policy-guidelines" title="Policy & Guidelines" />
            <View style={styles.card}>
              <Text style={styles.policyText}>
                {data?.policyGuidelines.communityGuidelines}
              </Text>
              <Text style={styles.policyText}>
                {data?.policyGuidelines.monetizationPolicies}
              </Text>
              <Text style={styles.policyText}>
                {data?.policyGuidelines.copyrightPolicies}
              </Text>
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

function PaymentMethodItem({ method, onDelete }: { method: PaymentMethod; onDelete: () => void }) {
  return (
    <View style={styles.paymentMethodItem}>
      <MaterialIcons 
        name={method.type === 'paypal' ? 'payment' : 'account-balance'} 
        size={20} 
        color={colors.text.primary} 
      />
      <Text style={styles.paymentMethodText}>{method.identifier}</Text>
      <TouchableOpacity onPress={onDelete}>
        <MaterialIcons name="delete" size={20} color={colors.error} />
      </TouchableOpacity>
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
  card: { backgroundColor: colors.background.secondary, borderRadius: 12, padding: 16, marginBottom: 12 },
  profileSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  profileImageContainer: { marginRight: 16 },
  profileImage: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary },
  emptyProfileImage: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  profileActions: { flex: 1, gap: 8 },
  changeBtn: { backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 12 },
  changeBtnText: { color: colors.text.primary, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { color: colors.text.primary, fontSize: 14, fontWeight: '600', marginBottom: 8 },
  textInput: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: colors.text.primary, fontSize: 16 },
  bioInput: { height: 100, textAlignVertical: 'top' },
  saveBtn: { backgroundColor: colors.primary, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: colors.text.primary, fontSize: 16, fontWeight: '700' },
  paymentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  paymentTitle: { color: colors.text.primary, fontSize: 16, fontWeight: '600', flex: 1, marginLeft: 8 },
  addMethodBtn: { backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  addMethodText: { color: colors.text.primary, fontSize: 12, fontWeight: '700' },
  noPaymentText: { color: colors.text.secondary, fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  paymentMethodItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.1)' },
  paymentMethodText: { color: colors.text.primary, fontSize: 14, flex: 1, marginLeft: 12 },
  policyText: { color: colors.text.secondary, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 40 },
  loadingText: { color: colors.text.secondary, marginTop: 8 },
  errorText: { color: colors.error, marginTop: 8 },
  retryBtn: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  retryText: { color: colors.text.primary, fontWeight: '700' },
});
