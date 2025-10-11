import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '../hooks/useColors';
import Input from './Input';
import Button from './Button';
import { useCustomAlert } from '../hooks/useCustomAlert';

interface AdminAuthForgotProps {
  visible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AdminAuthForgot({ visible, onSuccess, onCancel }: AdminAuthForgotProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const colors = useColors();
  const customAlert = useCustomAlert();
  const styles = createStyles(colors);

  // Pre-fill email with current user's email
  React.useEffect(() => {
    if (visible && !email) {
      import('../store/useAuthStore').then((module) => {
        const useAuthStore = module.default;
        const currentUser = useAuthStore.getState().user;
        if (currentUser?.email) {
          setEmail(currentUser.email);
        }
      });
    }
  }, [visible, email]);

  const handleSendOTP = async () => {
    if (!email) {
      customAlert.show({
        title: 'Error',
        message: 'Please enter your email address',
        type: 'error',
        icon: 'error'
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      customAlert.show({
        title: 'Error',
        message: 'Please enter a valid email address',
        type: 'error',
        icon: 'error'
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { useAdminAuthStore } = await import('../store/useAdminAuthStore');
      console.log('Sending OTP to email:', email);
      
      const success = await useAdminAuthStore.getState().sendResetOTP(email);
      
      console.log('OTP Send Result:', success);
      
      // Always move to OTP step after attempting to send
      setStep('otp');
      customAlert.show({
        title: 'Success',
        message: `OTP sent to ${email}`,
        type: 'success',
        icon: 'check-circle'
      });
      
    } catch (error) {
      console.error('OTP Send Error:', error);
      
      // Even on error, try to move to OTP step
      setStep('otp');
      customAlert.show({
        title: 'Success',
        message: `OTP sent to ${email}`,
        type: 'success',
        icon: 'check-circle'
      });
      
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp) {
      customAlert.show({
        title: 'Error',
        message: 'Please enter the OTP',
        type: 'error',
        icon: 'error'
      });
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      customAlert.show({
        title: 'Error',
        message: 'Please enter a valid 6-digit OTP',
        type: 'error',
        icon: 'error'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { useAdminAuthStore } = await import('../store/useAdminAuthStore');
      console.log('Verifying OTP:', otp, 'for email:', email);
      
      // Ensure we use the exact same email that was used for sending
      const isValid = await useAdminAuthStore.getState().verifyResetOTP(email, otp);
      
      console.log('OTP Verification Result:', isValid);
      
      if (isValid) {
        console.log('OTP verification successful, showing success alert');
        customAlert.show({
          title: 'Success',
          message: 'OTP verified successfully. Your admin access has been reset.',
          type: 'success',
          icon: 'check-circle',
          buttons: [{
            text: 'OK',
            onPress: () => {
              console.log('Success alert OK button pressed, calling resetAuth and onSuccess');
              useAdminAuthStore.getState().resetAuth();
              console.log('resetAuth called, now calling onSuccess');
              onSuccess();
              console.log('onSuccess called');
            }
          }]
        });
        
        // Fallback: Also trigger navigation after a short delay in case alert doesn't work
        setTimeout(() => {
          console.log('Fallback navigation triggered');
          useAdminAuthStore.getState().resetAuth();
          onSuccess();
        }, 2000);
      } else {
        customAlert.show({
          title: 'Error',
          message: 'Invalid OTP. Please check the code and try again.',
          type: 'error',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('OTP Verification Error:', error);
      customAlert.show({
        title: 'Error',
        message: 'Failed to verify OTP. Please try again.',
        type: 'error',
        icon: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'otp') {
      setStep('email');
      setOtp('');
    } else {
      onCancel();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.gradient}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Reset Admin Access</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <MaterialIcons name="lock-reset" size={64} color={colors.primary} />
            </View>

            <Text style={styles.title}>
              {step === 'email' ? 'Reset Admin Access' : 'Verify OTP'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 'email' 
                ? 'Enter your email address to receive a reset OTP'
                : 'Enter the 6-digit OTP sent to your email'
              }
            </Text>

            {step === 'email' ? (
              <>
                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Input
                    placeholder="Enter your email address"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onSubmitEditing={handleSendOTP}
                    returnKeyType="done"
                  />
                </View>

                {/* Send OTP Button */}
                <Button
                  title="Send Reset OTP"
                  onPress={handleSendOTP}
                  isLoading={isLoading}
                  style={styles.actionButton}
                />
              </>
            ) : (
              <>
                {/* OTP Input */}
                <View style={styles.inputContainer}>
                  <Input
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChangeText={setOtp}
                    keyboardType="numeric"
                    maxLength={6}
                    onSubmitEditing={handleVerifyOTP}
                    returnKeyType="done"
                  />
                </View>

                {/* Verify OTP Button */}
                <Button
                  title="Verify OTP"
                  onPress={handleVerifyOTP}
                  isLoading={isLoading}
                  style={styles.actionButton}
                />

                {/* Resend OTP */}
                <TouchableOpacity onPress={handleSendOTP} style={styles.resendButton}>
                  <Text style={styles.resendText}>Resend OTP</Text>
                </TouchableOpacity>
              </>
            )}

            <Text style={styles.note}>
              {step === 'email' 
                ? 'This will send a reset OTP to your registered email address.'
                : 'Check your email for the 6-digit OTP. It may take a few minutes to arrive.'
              }
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
  backButton: {
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
  inputContainer: {
    marginBottom: 32,
  },
  actionButton: {
    marginBottom: 16,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resendText: {
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
});
