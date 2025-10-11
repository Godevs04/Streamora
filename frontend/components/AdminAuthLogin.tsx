import React, { useState, useEffect } from 'react';
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
import CustomAlert from './CustomAlert';

interface AdminAuthLoginProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  onForgot: () => void;
}

export default function AdminAuthLogin({ visible, onSuccess, onCancel, onForgot }: AdminAuthLoginProps) {
  const [credential, setCredential] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<AdminAuthMethod | null>(null);
  const colors = useColors();
  const customAlert = useCustomAlert();
  const styles = createStyles(colors);

  useEffect(() => {
    if (visible) {
      // Get auth method from store
      import('../store/useAdminAuthStore').then(({ useAdminAuthStore }) => {
        const store = useAdminAuthStore.getState();
        setAuthMethod(store.authMethod);
      });
    }
  }, [visible]);

  const handleLogin = async () => {
    if (!credential) {
      customAlert.show({
        title: 'Error',
        message: 'Please enter your credentials',
        type: 'error',
        icon: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { useAdminAuthStore } = await import('../store/useAdminAuthStore');
      const isValid = await useAdminAuthStore.getState().authenticate(credential);
      
      if (isValid) {
        onSuccess();
      } else {
        // Show custom alert for invalid credentials
        customAlert.show({
          title: 'Authentication Failed',
          message: 'Invalid credentials. Please try again.',
          type: 'error',
          icon: 'error'
        });
      }
    } catch (error) {
      // Show custom alert for any authentication errors
      customAlert.show({
        title: 'Authentication Failed',
        message: error instanceof Error ? error.message : 'Invalid credentials. Please try again.',
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

  const getPlaceholder = (method: AdminAuthMethod) => {
    switch (method) {
      case 'pin': return 'Enter your PIN';
      case 'password': return 'Enter your password';
      case 'pattern': return 'Draw your pattern';
      default: return 'Enter your PIN';
    }
  };

  if (!authMethod) {
    return null;
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Admin Access</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="admin-panel-settings" size={64} color={colors.primary} />
            </View>

            <Text style={styles.title}>Admin Authentication</Text>
            <Text style={styles.subtitle}>
              Enter your {getMethodTitle(authMethod).toLowerCase()} to access admin features
            </Text>

            {/* Method Indicator */}
            <View style={styles.methodIndicator}>
              <MaterialIcons
                name={getMethodIcon(authMethod)}
                size={20}
                color={colors.primary}
              />
              <Text style={styles.methodText}>{getMethodTitle(authMethod)} Required</Text>
            </View>

            {/* Credential Input */}
            <View style={styles.inputContainer}>
              {authMethod === 'pattern' ? (
                <View style={styles.patternContainer}>
                  <PatternInput
                    onPatternComplete={(pattern) => {
                      setCredential(pattern);
                      handleLogin();
                    }}
                    size={250}
                    dotSize={16}
                    lineWidth={2}
                  />
                </View>
              ) : (
                <Input
                  placeholder={getPlaceholder(authMethod)}
                  value={credential}
                  onChangeText={setCredential}
                  secureTextEntry={authMethod === 'password'}
                  autoCapitalize="none"
                  autoCorrect={false}
                  onSubmitEditing={handleLogin}
                  returnKeyType="done"
                />
              )}
            </View>

            {/* Login Button */}
            <Button
              title="Access Admin"
              onPress={handleLogin}
              isLoading={isLoading}
              style={styles.loginButton}
            />

            {/* Forgot Option */}
            <TouchableOpacity onPress={onForgot} style={styles.forgotButton}>
              <Text style={styles.forgotText}>Forgot {getMethodTitle(authMethod)}?</Text>
            </TouchableOpacity>

            <Text style={styles.note}>
              This is a secure admin area. Your session will expire when you close the app.
            </Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
      
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
  methodIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  methodText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 32,
  },
  loginButton: {
    marginBottom: 16,
  },
  forgotButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  forgotText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    color: colors.text.tertiary,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 24,
  },
  patternContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
});
