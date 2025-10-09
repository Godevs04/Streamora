import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import useAuthStore from '../store/useAuthStore';
import colors from '../constants/colors';
import CustomAlert from '../components/CustomAlert';
import { useCustomAlert } from '../hooks/useCustomAlert';

export default function Settings() {
  const { logout } = useAuthStore();
  const insets = useSafeAreaInsets();
  const customAlert = useCustomAlert();
  const [language, setLanguage] = useState('English');
  const [theme, setTheme] = useState('Dark');
  const [notifications, setNotifications] = useState(true);
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    allowMessages: true,
    dataCollection: true,
    analytics: true
  });

  const handleAccountSettings = () => {
    router.push('/edit-profile');
  };

  const handlePrivacySecurity = () => {
    customAlert.show({
      title: 'Privacy & Security',
      message: 'Configure your privacy and security preferences',
      type: 'info',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Profile Visibility', 
          onPress: () => {
            customAlert.show({
              title: 'Profile Visibility',
              message: 'Choose who can see your profile',
              type: 'info',
              buttons: [
                { text: 'Public', onPress: () => setPrivacySettings(prev => ({ ...prev, profileVisibility: 'public' })) },
                { text: 'Friends Only', onPress: () => setPrivacySettings(prev => ({ ...prev, profileVisibility: 'friends' })) },
                { text: 'Private', onPress: () => setPrivacySettings(prev => ({ ...prev, profileVisibility: 'private' })) },
                { text: 'Cancel', style: 'cancel' }
              ]
            });
          }
        },
        { 
          text: 'Data Settings', 
          onPress: () => {
            customAlert.show({
              title: 'Data Collection',
              message: 'Manage your data preferences',
              type: 'warning',
              buttons: [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Disable Analytics', 
                  onPress: () => {
                    setPrivacySettings(prev => ({ ...prev, analytics: false }));
                    customAlert.show({
                      title: 'Analytics Disabled',
                      message: 'Analytics tracking has been turned off',
                      type: 'success'
                    });
                  }
                },
                { 
                  text: 'Delete Data', 
                  style: 'destructive',
                  onPress: () => {
                    customAlert.show({
                      title: 'Delete All Data',
                      message: 'This will permanently delete all your data. This action cannot be undone.',
                      type: 'error',
                      buttons: [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Delete', 
                          style: 'destructive',
                          onPress: () => {
                            customAlert.show({
                              title: 'Data Deleted',
                              message: 'All your data has been permanently deleted',
                              type: 'success'
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
        }
      ]
    });
  };

  const handleNotifications = () => {
    customAlert.show({
      title: 'Notification Settings',
      message: 'Configure your notification preferences',
      type: 'info',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Push Notifications', 
          onPress: () => {
            customAlert.show({
              title: 'Push Notifications',
              message: 'Manage push notification settings',
              type: 'info',
              buttons: [
                { text: 'Enable All', onPress: () => setNotifications(true) },
                { text: 'Disable All', onPress: () => setNotifications(false) },
                { text: 'Customize', onPress: () => {
                  customAlert.show({
                    title: 'Customize Notifications',
                    message: 'Choose which notifications you want to receive',
                    type: 'info',
                    buttons: [
                      { text: 'Likes & Comments', onPress: () => {
                        customAlert.show({
                          title: 'Enabled',
                          message: 'You will receive notifications for likes and comments',
                          type: 'success'
                        });
                      }},
                      { text: 'New Followers', onPress: () => {
                        customAlert.show({
                          title: 'Enabled',
                          message: 'You will receive notifications for new followers',
                          type: 'success'
                        });
                      }},
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  });
                }},
                { text: 'Cancel', style: 'cancel' }
              ]
            });
          }
        },
        { 
          text: 'Email Notifications', 
          onPress: () => {
            customAlert.show({
              title: 'Email Notifications',
              message: 'Manage email notification preferences',
              type: 'info',
              buttons: [
                { text: 'Enable', onPress: () => {
                  customAlert.show({
                    title: 'Email Notifications Enabled',
                    message: 'You will receive important updates via email',
                    type: 'success'
                  });
                }},
                { text: 'Disable', onPress: () => {
                  customAlert.show({
                    title: 'Email Notifications Disabled',
                    message: 'You will no longer receive email notifications',
                    type: 'info'
                  });
                }},
                { text: 'Cancel', style: 'cancel' }
              ]
            });
          }
        }
      ]
    });
  };

  const handleLanguage = () => {
    customAlert.show({
      title: 'Language',
      message: 'Select your preferred language',
      type: 'info',
      buttons: [
        { text: 'English', onPress: () => setLanguage('English') },
        { text: 'Spanish', onPress: () => setLanguage('Spanish') },
        { text: 'French', onPress: () => setLanguage('French') },
        { text: 'Cancel', style: 'cancel' }
      ]
    });
  };

  const handleTheme = () => {
    customAlert.show({
      title: 'Theme',
      message: 'Select your preferred theme',
      type: 'info',
      buttons: [
        { text: 'Dark', onPress: () => setTheme('Dark') },
        { text: 'Light', onPress: () => setTheme('Light') },
        { text: 'System', onPress: () => setTheme('System') },
        { text: 'Cancel', style: 'cancel' }
      ]
    });
  };

  const handleAdminMode = () => {
    router.push('/admin');
  };

  const handleHelpSupport = () => {
    customAlert.show({
      title: 'Help & Support',
      message: 'Get help and support for your Streamora experience',
      type: 'info',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Contact Support', 
          onPress: () => {
            customAlert.show({
              title: 'Contact Support',
              message: 'Choose how you would like to contact our support team',
              type: 'info',
              buttons: [
                { 
                  text: 'Email Support', 
                  onPress: () => {
                    Linking.openURL('mailto:support@streamora.com?subject=Support Request&body=Please describe your issue...');
                  }
                },
                { 
                  text: 'Live Chat', 
                  onPress: () => {
                    customAlert.show({
                      title: 'Live Chat',
                      message: 'Live chat is currently unavailable. Please use email support.',
                      type: 'warning'
                    });
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            });
          }
        },
        { 
          text: 'FAQ', 
          onPress: () => {
            customAlert.show({
              title: 'Frequently Asked Questions',
              message: 'Common questions and answers',
              type: 'info',
              buttons: [
                { 
                  text: 'Account Issues', 
                  onPress: () => {
                    customAlert.show({
                      title: 'Account Issues',
                      message: 'Q: How do I reset my password?\nA: Go to login page and tap "Forgot Password" to reset via email.\n\nQ: How do I delete my account?\nA: Contact support at support@streamora.com',
                      type: 'info'
                    });
                  }
                },
                { 
                  text: 'Video Upload', 
                  onPress: () => {
                    customAlert.show({
                      title: 'Video Upload',
                      message: 'Q: What video formats are supported?\nA: MP4, MOV, AVI formats are supported.\n\nQ: What is the maximum file size?\nA: Videos up to 100MB are supported.',
                      type: 'info'
                    });
                  }
                },
                { text: 'Cancel', style: 'cancel' }
              ]
            });
          }
        },
        { 
          text: 'Report Bug', 
          onPress: () => {
            customAlert.show({
              title: 'Report Bug',
              message: 'Help us improve Streamora by reporting bugs',
              type: 'warning',
              buttons: [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Submit Report', 
                  onPress: () => {
                    Linking.openURL('mailto:bugs@streamora.com?subject=Bug Report&body=Please describe the bug you encountered...');
                  }
                }
              ]
            });
          }
        }
      ]
    });
  };

  const handleLogout = () => {
    customAlert.show({
      title: 'Log Out',
      message: 'Are you sure you want to log out?',
      type: 'warning',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Out', style: 'destructive', onPress: logout }
      ]
    });
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 20, 40) }
          ]}
          showsVerticalScrollIndicator={false}
        >
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
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40, // Same width as back button to center the title
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
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
    minHeight: 60, // Ensure consistent height
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
    flexShrink: 0, // Prevent icon container from shrinking
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
    flexShrink: 0, // Prevent right side from shrinking
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
