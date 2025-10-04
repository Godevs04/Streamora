import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import useAuthStore from '../store/useAuthStore';
import colors from '../constants/colors';

export default function Settings() {
  const { logout } = useAuthStore();
  const [language, setLanguage] = useState('English');
  const [theme, setTheme] = useState('Dark');
  const [notifications, setNotifications] = useState(true);

  const handleAccountSettings = () => {
    router.push('/edit-profile');
  };

  const handlePrivacySecurity = () => {
    Alert.alert('Privacy & Security', 'Privacy settings will be implemented soon.');
  };

  const handleNotifications = () => {
    Alert.alert('Notifications', 'Notification settings will be implemented soon.');
  };

  const handleLanguage = () => {
    Alert.alert(
      'Language',
      'Select your preferred language',
      [
        { text: 'English', onPress: () => setLanguage('English') },
        { text: 'Spanish', onPress: () => setLanguage('Spanish') },
        { text: 'French', onPress: () => setLanguage('French') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleTheme = () => {
    Alert.alert(
      'Theme',
      'Select your preferred theme',
      [
        { text: 'Dark', onPress: () => setTheme('Dark') },
        { text: 'Light', onPress: () => setTheme('Light') },
        { text: 'System', onPress: () => setTheme('System') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const handleAdminMode = () => {
    Alert.alert('Admin Mode', 'Creator Studio Analytics will be available soon.');
  };

  const handleHelpSupport = () => {
    Alert.alert('Help & Support', 'Support options will be implemented soon.');
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout }
      ]
    );
  };

  const renderSettingItem = (
    icon: string,
    title: string,
    onPress: () => void,
    subtitle?: string,
    isHighlighted?: boolean,
    showNew?: boolean,
    rightElement?: React.ReactNode
  ) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        isHighlighted && styles.highlightedItem
      ]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, isHighlighted && styles.highlightedIcon]}>
          <MaterialIcons 
            name={icon as any} 
            size={24} 
            color={isHighlighted ? 'white' : colors.primary} 
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={[styles.settingTitle, isHighlighted && styles.highlightedText]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, isHighlighted && styles.highlightedSubtitle]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.settingRight}>
        {showNew && (
          <View style={styles.newTag}>
            <Text style={styles.newTagText}>New</Text>
          </View>
        )}
        {rightElement}
        <MaterialIcons 
          name="chevron-right" 
          size={24} 
          color={isHighlighted ? 'white' : colors.text.secondary} 
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderSettingItem(
            'person',
            'Account Settings',
            handleAccountSettings
          )}

          {renderSettingItem(
            'security',
            'Privacy & Security',
            handlePrivacySecurity
          )}

          {renderSettingItem(
            'notifications',
            'Notifications',
            handleNotifications
          )}

          {renderSettingItem(
            'language',
            'Language',
            handleLanguage,
            undefined,
            false,
            false,
            <Text style={styles.rightText}>{language}</Text>
          )}

          {renderSettingItem(
            'dark-mode',
            'Theme',
            handleTheme,
            undefined,
            false,
            false,
            <Text style={styles.rightText}>{theme}</Text>
          )}

          {renderSettingItem(
            'admin-panel-settings',
            'Admin Mode',
            handleAdminMode,
            'Creator Studio Analytics',
            true,
            true
          )}

          {renderSettingItem(
            'help-outline',
            'Help & Support',
            handleHelpSupport
          )}

          {renderSettingItem(
            'logout',
            'Log Out',
            handleLogout
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  highlightedItem: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  highlightedIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  textContainer: {
    flex: 1,
  },
  settingTitle: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  highlightedText: {
    color: 'white',
  },
  settingSubtitle: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  highlightedSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightText: {
    color: colors.text.secondary,
    fontSize: 14,
    marginRight: 8,
  },
  newTag: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  newTagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
