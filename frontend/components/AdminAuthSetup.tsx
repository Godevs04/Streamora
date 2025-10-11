import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';
import { AdminAuthMethod } from '../store/useAdminAuthStore';
import Input from './Input';
import Button from './Button';
import PatternInput from './PatternInput';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface AdminAuthSetupProps {
  visible: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

export default function AdminAuthSetup({ visible, onComplete, onCancel }: AdminAuthSetupProps) {
  const [selectedMethod, setSelectedMethod] = useState<AdminAuthMethod>('pin');
  const [credential, setCredential] = useState('');
  const [confirmCredential, setConfirmCredential] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const colors = useColors();
  const customAlert = useCustomAlert();
  const styles = createStyles(colors);

  const handleSetup = async () => {
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
      // Import the store dynamically to avoid circular imports
      const { useAdminAuthStore } = await import('../store/useAdminAuthStore');
      await useAdminAuthStore.getState().setupAuth(selectedMethod, credential);
      
      // Show success message
      setTimeout(() => {
        customAlert.show({
          title: 'Success',
          message: 'Admin authentication setup successfully!',
          type: 'success',
          icon: 'check-circle',
          buttons: [
            {
              text: 'OK',
              onPress: () => {
                onComplete();
              }
            }
          ]
        });
      }, 100);
    } catch (error: any) {
      console.error('Setup error:', error);
      
      // Check if it's actually a success message wrapped in an error
      if (error.message?.includes('successfully') || 
          error.message?.includes('Admin authentication setup successfully')) {
        setTimeout(() => {
          customAlert.show({
            title: 'Success',
            message: 'Admin authentication setup successfully!',
            type: 'success',
            icon: 'check-circle',
            buttons: [
              {
                text: 'OK',
                onPress: () => {
                  onComplete();
                }
              }
            ]
          });
        }, 100);
        return;
      }
      
      customAlert.show({
        title: 'Setup Failed',
        message: error.message || 'Failed to setup admin authentication. Please try again.',
        type: 'error',
        icon: 'error'
      });
    } finally {
      setIsLoading(false);
    }
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
      case 'pin': return 'Enter PIN (4-8 digits)';
      case 'password': return 'Enter password';
      case 'pattern': return 'Draw pattern';
      default: return 'Enter PIN';
    }
  };

  const getConfirmPlaceholder = (method: AdminAuthMethod) => {
    switch (method) {
      case 'pin': return 'Confirm PIN';
      case 'password': return 'Confirm password';
      case 'pattern': return 'Confirm pattern';
      default: return 'Confirm PIN';
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Admin Setup</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="admin-panel-settings" size={64} color={colors.primary} />
            </View>

            <Text style={styles.title}>Secure Admin Access</Text>
            <Text style={styles.subtitle}>
              Choose your preferred authentication method for admin access
            </Text>

            {/* Method Selection */}
            <View style={styles.methodContainer}>
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
                    size={24}
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
                    size={250}
                    dotSize={16}
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
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  <Input
                    placeholder={getConfirmPlaceholder(selectedMethod)}
                    value={confirmCredential}
                    onChangeText={setConfirmCredential}
                    secureTextEntry={selectedMethod === 'password'}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </>
              )}
            </View>

            {/* Setup Button */}
            <Button
              title="Setup Admin Access"
              onPress={handleSetup}
              isLoading={isLoading}
              style={styles.setupButton}
            />

            <Text style={styles.note}>
              This will secure your admin access. You can change this later in settings.
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    backgroundColor: colors.background.primary,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  methodContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  methodOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: colors.border,
  },
  methodOptionSelected: {
    backgroundColor: colors.background.tertiary,
    borderColor: colors.primary,
  },
  methodText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  methodTextSelected: {
    color: colors.primary,
  },
  inputContainer: {
    marginBottom: 32,
  },
  inputLabel: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  setupButton: {
    marginBottom: 16,
  },
  note: {
    color: colors.text.tertiary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  patternContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
});
