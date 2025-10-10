import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useColors } from '../../hooks/useColors';
import { useAdminAuthStore, AdminAuthMethod } from '../../store/useAdminAuthStore';
import { fetchAdminSettings, updateChannelInfo } from '../../services/admin';
import { AdminSettingsData } from '../../types';
import AdminLayout from '../../components/AdminLayout';
import Input from '../../components/Input';
import Button from '../../components/Button';
import PatternInput from '../../components/PatternInput';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

const { width } = Dimensions.get('window');

export default function AdminSettings() {
  const colors = useColors();
  const styles = createStyles(colors);
  const customAlert = useCustomAlert();
  
  const { 
    authMethod, 
    authEnabled, 
    toggleAuth, 
    changeCredentials, 
    logout 
  } = useAdminAuthStore();
  
  // Original settings state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AdminSettingsData | null>(null);
  const [channelName, setChannelName] = useState('');
  const [bio, setBio] = useState('');
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Authentication state
  const [showChangeCredentials, setShowChangeCredentials] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<AdminAuthMethod>(authMethod || 'pin');
  const [credential, setCredential] = useState('');
  const [confirmCredential, setConfirmCredential] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Load original settings data
  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await fetchAdminSettings();
      setData(res);
      setChannelName(res.channelCustomization.channelName);
      setBio(res.channelCustomization.bio);
      setBannerUrl(res.channelCustomization.bannerImageUrl || null);
      setAvatarUrl(res.channelCustomization.profileImageUrl || null);
      setError(null);
    } catch (e: any) {
      setError(e?.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // Image upload functions
  const handleImagePicker = async (type: 'banner' | 'avatar') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: type === 'banner' ? [16, 9] : [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setIsUploadingImage(true);
        
        // Here you would typically upload to your backend/Cloudinary
        // For now, we'll just set the local URI
        if (type === 'banner') {
          setBannerUrl(result.assets[0].uri);
        } else {
          setAvatarUrl(result.assets[0].uri);
        }
        
        customAlert.show({
          title: 'Success',
          message: `${type === 'banner' ? 'Banner' : 'Avatar'} updated successfully`,
          type: 'success',
          icon: 'check-circle'
        });
      }
    } catch (error: any) {
      customAlert.show({
        title: 'Error',
        message: `Failed to update ${type === 'banner' ? 'banner' : 'avatar'}`,
        type: 'error',
        icon: 'error'
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Original settings functions
  const handleUpdateChannel = async () => {
    if (!channelName.trim()) {
      customAlert.show({
        title: 'Error',
        message: 'Channel name is required',
        type: 'error',
        icon: 'error'
      });
      return;
    }

    setIsUpdating(true);
    try {
      await updateChannelInfo({ 
        channelName: channelName.trim(), 
        bio: bio.trim()
      });
      customAlert.show({
        title: 'Success',
        message: 'Channel information updated successfully',
        type: 'success',
        icon: 'check-circle'
      });
    } catch (error: any) {
      customAlert.show({
        title: 'Error',
        message: error?.message || 'Failed to update channel information',
        type: 'error',
        icon: 'error'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAuth = (enabled: boolean) => {
    customAlert.show({
      title: enabled ? 'Enable Admin Authentication' : 'Disable Admin Authentication',
      message: enabled 
        ? 'This will require authentication to access admin features.'
        : 'This will allow direct access to admin features without authentication.',
      type: 'info',
      icon: 'info',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {}
        },
        {
          text: enabled ? 'Enable' : 'Disable',
          style: enabled ? 'default' : 'destructive',
          onPress: () => toggleAuth(enabled)
        }
      ]
    });
  };

  const handleChangeCredentials = async () => {
    if (!credential || !confirmCredential) {
      customAlert.show({
        title: 'Error',
        message: 'Please enter your credentials',
        type: 'error',
        icon: 'error'
      });
      return;
    }

    if (credential !== confirmCredential) {
      customAlert.show({
        title: 'Error',
        message: 'Credentials do not match',
        type: 'error',
        icon: 'error'
      });
      return;
    }

    // Validate based on method
    if (selectedMethod === 'pin' && !/^\d{4,8}$/.test(credential)) {
      customAlert.show({
        title: 'Error',
        message: 'PIN must be 4-8 digits',
        type: 'error',
        icon: 'error'
      });
      return;
    }

    if (selectedMethod === 'password' && credential.length < 6) {
      customAlert.show({
        title: 'Error',
        message: 'Password must be at least 6 characters',
        type: 'error',
        icon: 'error'
      });
      return;
    }

    if (selectedMethod === 'pattern' && credential.length < 4) {
      customAlert.show({
        title: 'Error',
        message: 'Pattern must be at least 4 characters',
        type: 'error',
        icon: 'error'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      await changeCredentials(selectedMethod, credential);
      
      setShowChangeCredentials(false);
      setCredential('');
      setConfirmCredential('');
      
      customAlert.show({
        title: 'Success',
        message: 'Admin credentials updated successfully',
        type: 'success',
        icon: 'check-circle'
      });
    } catch (error) {
      customAlert.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Failed to update admin credentials',
        type: 'error',
        icon: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    customAlert.show({
      title: 'Logout from Admin',
      message: 'Are you sure you want to logout? You will need to authenticate again to access admin features.',
      type: 'info',
      icon: 'info',
      buttons: [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {}
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            customAlert.show({
              title: 'Logged Out',
              message: 'You have been logged out from admin',
              type: 'info',
              icon: 'info'
            });
          }
        }
      ]
    });
  };

  const getMethodIcon = (method: AdminAuthMethod) => {
    switch (method) {
      case 'pin': return 'lock';
      case 'password': return 'vpn-key';
      case 'pattern': return 'gesture';
      default: return 'lock';
    }
  };

  const getMethodTitle = (method: AdminAuthMethod) => {
    switch (method) {
      case 'pin': return 'PIN';
      case 'password': return 'Password';
      case 'pattern': return 'Pattern';
      default: return 'PIN';
    }
  };

  const getMethodDescription = (method: AdminAuthMethod) => {
    switch (method) {
      case 'pin': return 'Enter a 4-8 digit PIN';
      case 'password': return 'Enter a secure password';
      case 'pattern': return 'Draw a pattern (4+ characters)';
      default: return 'Enter a 4-8 digit PIN';
    }
  };

  const getPlaceholder = (method: AdminAuthMethod) => {
    switch (method) {
      case 'pin': return 'Enter new PIN (4-8 digits)';
      case 'password': return 'Enter new password';
      case 'pattern': return 'Draw new pattern';
      default: return 'Enter new PIN';
    }
  };

  const getConfirmPlaceholder = (method: AdminAuthMethod) => {
    switch (method) {
      case 'pin': return 'Confirm new PIN';
      case 'password': return 'Confirm new password';
      case 'pattern': return 'Confirm new pattern';
      default: return 'Confirm new PIN';
    }
  };

  if (loading) {
  return (
      <AdminLayout title="Settings" subtitle="Channel Management">
          <View style={styles.centerWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading settings…</Text>
          </View>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Settings" subtitle="Channel Management">
          <View style={styles.centerWrap}>
            <MaterialIcons name="error-outline" size={32} color={colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadSettings}>
            <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Settings" subtitle="Channel Management & Security">
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Channel Customization */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Channel Customization</Text>
          
            <View style={styles.card}>
            {/* Banner Upload */}
            <View style={styles.imageUploadSection}>
              <Text style={styles.inputLabel}>Channel Banner</Text>
              <TouchableOpacity 
                style={styles.imageUploadButton}
                onPress={() => handleImagePicker('banner')}
                disabled={isUploadingImage}
              >
                {bannerUrl ? (
                  <Image source={{ uri: bannerUrl }} style={styles.bannerImage} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialIcons name="add-photo-alternate" size={32} color={colors.text.secondary} />
                    <Text style={styles.placeholderText}>Add Banner</Text>
                    </View>
                  )}
                <View style={styles.imageOverlay}>
                  <MaterialIcons name="edit" size={20} color={colors.text.primary} />
                </View>
                  </TouchableOpacity>
            </View>

            {/* Avatar Upload */}
            <View style={styles.imageUploadSection}>
              <Text style={styles.inputLabel}>Channel Avatar</Text>
              <TouchableOpacity 
                style={styles.avatarUploadButton}
                onPress={() => handleImagePicker('avatar')}
                disabled={isUploadingImage}
              >
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <MaterialIcons name="person-add" size={24} color={colors.text.secondary} />
                  </View>
                )}
                <View style={styles.avatarOverlay}>
                  <MaterialIcons name="edit" size={16} color={colors.text.primary} />
                </View>
              </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Channel Name</Text>
              <Input
                placeholder="Enter channel name"
                  value={channelName}
                  onChangeText={setChannelName}
                autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
              <Input
                placeholder="Tell viewers about your channel"
                  value={bio}
                  onChangeText={setBio}
                  multiline
                numberOfLines={3}
                style={styles.bioInput}
                />
              </View>

            <Button
              title="Update Channel"
              onPress={handleUpdateChannel}
              isLoading={isUpdating}
              style={styles.updateButton}
            />
          </View>
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          
          <View style={styles.card}>
            <View style={styles.paymentHeader}>
              <MaterialIcons name="payment" size={24} color={colors.primary} />
              <Text style={styles.cardTitle}>Payment Settings</Text>
            </View>

            <Text style={styles.cardDescription}>
              Configure your payment methods for monetization
            </Text>
            
            <TouchableOpacity style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Manage Payment Methods</Text>
              <MaterialIcons name="arrow-forward-ios" size={16} color={colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notification Settings</Text>
          
            <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="email" size={20} color={colors.text.secondary} />
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Email Notifications</Text>
                  <Text style={styles.settingDescription}>Receive updates via email</Text>
                </View>
              </View>
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: colors.background.secondary, true: colors.primary }}
                thumbColor={colors.text.primary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="notifications" size={20} color={colors.text.secondary} />
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Push Notifications</Text>
                  <Text style={styles.settingDescription}>Receive push notifications</Text>
                </View>
              </View>
              <Switch
                value={true}
                onValueChange={() => {}}
                trackColor={{ false: colors.background.secondary, true: colors.primary }}
                thumbColor={colors.text.primary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="sms" size={20} color={colors.text.secondary} />
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>SMS Notifications</Text>
                  <Text style={styles.settingDescription}>Receive SMS updates</Text>
                </View>
              </View>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: colors.background.secondary, true: colors.primary }}
                thumbColor={colors.text.primary}
              />
            </View>
          </View>
        </View>

        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          
          <View style={styles.card}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="visibility" size={20} color={colors.text.secondary} />
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Show Email</Text>
                  <Text style={styles.settingDescription}>Make email visible to others</Text>
                </View>
              </View>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: colors.background.secondary, true: colors.primary }}
                thumbColor={colors.text.primary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MaterialIcons name="phone" size={20} color={colors.text.secondary} />
                <View style={styles.settingContent}>
                  <Text style={styles.settingTitle}>Show Phone</Text>
                  <Text style={styles.settingDescription}>Make phone number visible</Text>
                </View>
              </View>
              <Switch
                value={false}
                onValueChange={() => {}}
                trackColor={{ false: colors.background.secondary, true: colors.primary }}
                thumbColor={colors.text.primary}
              />
            </View>
          </View>
        </View>

        {/* Policy Guidelines */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Policy Guidelines</Text>
          
            <View style={styles.card}>
            <View style={styles.policyItem}>
              <MaterialIcons name="rule" size={20} color={colors.text.secondary} />
              <View style={styles.policyContent}>
                <Text style={styles.policyTitle}>Community Guidelines</Text>
                <Text style={styles.policyDescription}>
                  Please ensure your channel adheres to NovaTube policies.
                </Text>
              </View>
            </View>

            <View style={styles.policyItem}>
              <MaterialIcons name="monetization-on" size={20} color={colors.text.secondary} />
              <View style={styles.policyContent}>
                <Text style={styles.policyTitle}>Monetization Policies</Text>
                <Text style={styles.policyDescription}>
                  Repeated violations may lead to monetization removal.
                </Text>
              </View>
            </View>

            <View style={styles.policyItem}>
              <MaterialIcons name="copyright" size={20} color={colors.text.secondary} />
              <View style={styles.policyContent}>
                <Text style={styles.policyTitle}>Copyright Policies</Text>
                <Text style={styles.policyDescription}>
                  Respect copyright laws and fair use guidelines.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Authentication Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authentication Status</Text>
          
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <MaterialIcons 
                name={authEnabled ? 'security' : 'lock-open'} 
                size={24} 
                color={authEnabled ? colors.success : colors.error} 
              />
              <Text style={styles.statusTitle}>
                Admin Authentication {authEnabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
            
            <Text style={styles.statusDescription}>
              {authEnabled 
                ? `Currently using ${getMethodTitle(authMethod || 'pin')} authentication`
                : 'Admin features are accessible without authentication'
              }
              </Text>
            
            <View style={styles.toggleContainer}>
              <Text style={styles.toggleLabel}>Enable Authentication</Text>
              <Switch
                value={authEnabled}
                onValueChange={handleToggleAuth}
                trackColor={{ false: colors.background.secondary, true: colors.primary }}
                thumbColor={authEnabled ? colors.text.primary : colors.text.secondary}
              />
            </View>
          </View>
        </View>

        {/* Change Credentials */}
        {authEnabled && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Change Credentials</Text>
            
          <TouchableOpacity 
            style={styles.actionCard} 
            onPress={() => setShowChangeCredentials(true)}
          >
              <View style={styles.actionHeader}>
                <MaterialIcons name="key" size={24} color={colors.primary} />
                <Text style={styles.actionTitle}>Change {getMethodTitle(authMethod || 'pin')}</Text>
              </View>
              <Text style={styles.actionDescription}>
                Update your admin authentication credentials
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Security Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security Actions</Text>
          
          <TouchableOpacity style={styles.actionCard} onPress={handleLogout}>
            <View style={styles.actionHeader}>
              <MaterialIcons name="logout" size={24} color={colors.error} />
              <Text style={styles.actionTitle}>Logout from Admin</Text>
            </View>
            <Text style={styles.actionDescription}>
              End your current admin session
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Change Credentials Modal - Outside ScrollView */}
      {showChangeCredentials && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Credentials</Text>
              <TouchableOpacity 
                onPress={() => setShowChangeCredentials(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Method Selection */}
              <View style={styles.methodContainer}>
                <Text style={styles.inputLabel}>Authentication Method</Text>
                <View style={styles.methodOptions}>
                  {(['pin', 'password', 'pattern'] as AdminAuthMethod[]).map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.methodOption,
                        selectedMethod === method && styles.methodOptionSelected
                      ]}
                      onPress={() => setSelectedMethod(method)}
                    >
                      <MaterialIcons
                        name={getMethodIcon(method)}
                        size={20}
                        color={selectedMethod === method ? colors.primary : colors.text.secondary}
                      />
                      <Text style={[
                        styles.methodText,
                        selectedMethod === method && styles.methodTextSelected
                      ]}>
                        {getMethodTitle(method)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Credential Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{getMethodDescription(selectedMethod)}</Text>
                
                {selectedMethod === 'pattern' ? (
                  <View style={styles.patternContainer}>
                    <PatternInput
                      onPatternComplete={(pattern) => {
                        setCredential(pattern);
                        setConfirmCredential(pattern);
                      }}
                      size={200}
                      dotSize={14}
                      lineWidth={2}
                    />
                  </View>
                ) : (
                  <>
                    <Input
                      placeholder={getPlaceholder(selectedMethod)}
                      value={credential}
                      onChangeText={setCredential}
                      secureTextEntry={selectedMethod === 'password'}
                      keyboardType={selectedMethod === 'pin' ? 'numeric' : 'default'}
                      style={styles.modalInput}
                    />
                    
                    <Input
                      placeholder={`Confirm ${getMethodTitle(selectedMethod)}`}
                      value={confirmCredential}
                      onChangeText={setConfirmCredential}
                      secureTextEntry={selectedMethod === 'password'}
                      keyboardType={selectedMethod === 'pin' ? 'numeric' : 'default'}
                      style={styles.modalInput}
                    />
                  </>
                )}
              </View>

              <View style={styles.modalButtonContainer}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowChangeCredentials(false)}
                  style={styles.cancelButton}
                />
                <Button
                  title="Update Credentials"
                  onPress={handleChangeCredentials}
                  isLoading={isLoading}
                  style={styles.modalUpdateButton}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* Custom Alert */}
      <CustomAlert
        visible={customAlert.visible}
        title={customAlert.config.title}
        message={customAlert.config.message}
        type={customAlert.config.type}
        icon={customAlert.config.icon}
        onClose={customAlert.hide}
      />

      {/* Change Credentials Modal - Outside ScrollView */}
      {showChangeCredentials && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Credentials</Text>
              <TouchableOpacity 
                onPress={() => setShowChangeCredentials(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Method Selection */}
              <View style={styles.methodContainer}>
                <Text style={styles.inputLabel}>Authentication Method</Text>
                <View style={styles.methodOptions}>
                  {(['pin', 'password', 'pattern'] as AdminAuthMethod[]).map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.methodOption,
                        selectedMethod === method && styles.methodOptionSelected
                      ]}
                      onPress={() => setSelectedMethod(method)}
                    >
                      <MaterialIcons
                        name={getMethodIcon(method)}
                        size={20}
                        color={selectedMethod === method ? colors.primary : colors.text.secondary}
                      />
                      <Text style={[
                        styles.methodText,
                        selectedMethod === method && styles.methodTextSelected
                      ]}>
                        {getMethodTitle(method)}
                      </Text>
                </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Credential Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{getMethodDescription(selectedMethod)}</Text>
                
                {selectedMethod === 'pattern' ? (
                  <View style={styles.patternContainer}>
                    <PatternInput
                      onPatternComplete={(pattern) => {
                        setCredential(pattern);
                        setConfirmCredential(pattern);
                      }}
                      size={200}
                      dotSize={14}
                      lineWidth={2}
                    />
                  </View>
                ) : (
                  <>
                    <Input
                      placeholder={getPlaceholder(selectedMethod)}
                      value={credential}
                      onChangeText={setCredential}
                      secureTextEntry={selectedMethod === 'password'}
                      keyboardType={selectedMethod === 'pin' ? 'numeric' : 'default'}
                      style={styles.modalInput}
                    />
                    
                    <Input
                      placeholder={`Confirm ${getMethodTitle(selectedMethod)}`}
                      value={confirmCredential}
                      onChangeText={setConfirmCredential}
                      secureTextEntry={selectedMethod === 'password'}
                      keyboardType={selectedMethod === 'pin' ? 'numeric' : 'default'}
                      style={styles.modalInput}
                    />
                  </>
              )}
            </View>

              <View style={styles.modalButtonContainer}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowChangeCredentials(false)}
                  style={styles.cancelButton}
                />
                <Button
                  title="Update Credentials"
                  onPress={handleChangeCredentials}
                  isLoading={isLoading}
                  style={styles.modalUpdateButton}
                />
            </View>
          </ScrollView>
          </View>
        </View>
        )}
    </AdminLayout>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryBtnText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  updateButton: {
    marginTop: 8,
  },
  paymentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  cardDescription: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  policyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  policyContent: {
    flex: 1,
    marginLeft: 12,
  },
  policyTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  policyDescription: {
    color: colors.text.secondary,
    fontSize: 13,
    lineHeight: 18,
  },
  imageUploadSection: {
    marginBottom: 16,
  },
  imageUploadButton: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: colors.background.primary,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.text.secondary,
    fontSize: 14,
    marginTop: 8,
  },
  imageOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    padding: 6,
  },
  avatarOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 4,
  },
  avatarUploadButton: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingContent: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingDescription: {
    color: colors.text.secondary,
    fontSize: 12,
    lineHeight: 16,
  },
  statusCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusDescription: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  actionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionDescription: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: 24,
    width: '90%',
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  modalContent: {
    padding: 24,
  },
  methodContainer: {
    marginBottom: 32,
  },
  methodOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  methodOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodOptionSelected: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  methodText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: 0.3,
  },
  methodTextSelected: {
    color: colors.primary,
  },
  inputContainer: {
    marginBottom: 32,
  },
  patternContainer: {
    alignItems: 'center',
    marginVertical: 24,
    padding: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.1)',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
  },
  modalUpdateButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalInput: {
    marginBottom: 20,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    paddingHorizontal: 0,
    paddingBottom: 0,
    gap: 16,
  },
});