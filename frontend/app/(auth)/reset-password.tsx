import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useColors } from '../../hooks/useColors';
import { getPasswordError } from '../../utils/validators';
import { resetPassword } from '../../services/auth';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

export default function ResetPassword() {
  const { email, otp } = useLocalSearchParams<{ email: string; otp: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
  });
  const customAlert = useCustomAlert();
  const colors = useColors();
  const [isLoading, setIsLoading] = useState(false);
  
  const validateForm = () => {
    const passwordError = getPasswordError(password);
    const confirmPasswordError = password !== confirmPassword ? 'Passwords do not match' : '';
    
    setErrors({
      password: passwordError,
      confirmPassword: confirmPasswordError,
    });
    
    return !passwordError && !confirmPasswordError;
  };
  
  const handleResetPassword = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const response = await resetPassword(email!, otp!, password);
      
      customAlert.show({
        title: 'Password Reset Successful',
        message: 'Your password has been reset successfully. You can now sign in with your new password.',
        type: 'success',
        icon: 'check-circle',
        buttons: [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login')
          }
        ]
      });
    } catch (error: any) {
      customAlert.show({
        title: 'Reset Failed',
        message: error.message || 'Failed to reset password. Please try again.',
        type: 'error',
        icon: 'error-outline'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackToLogin = () => {
    router.replace('/(auth)/login');
  };
  
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={Platform.OS === 'ios' ? ['top'] : []}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 40 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.success,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24
              }}>
                <Icon name="key" size={40} color="white" />
              </View>
              
              <Text style={{ 
                color: 'white', 
                fontSize: 28, 
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 12
              }}>
                Reset Password
              </Text>
              
              <Text style={{ 
                color: colors.text.secondary, 
                fontSize: 16, 
                textAlign: 'center',
                lineHeight: 24
              }}>
                Create a new password for your account
              </Text>
            </View>
            
            {/* Form */}
            <View style={{ marginBottom: 32 }}>
              <Input
                label="New Password"
                placeholder="Enter your new password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                leftIcon="lock-closed-outline"
                isPassword
                autoFocus
              />
              
              <Input
                label="Confirm New Password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                error={errors.confirmPassword}
                leftIcon="lock-closed-outline"
                isPassword
              />
            </View>
            
            {/* Password Requirements */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ 
                color: colors.text.secondary, 
                fontSize: 12, 
                marginBottom: 8 
              }}>
                Password requirements:
              </Text>
              <Text style={{ 
                color: colors.text.secondary, 
                fontSize: 12, 
                lineHeight: 16 
              }}>
                • At least 8 characters long{'\n'}
                • Contains uppercase and lowercase letters{'\n'}
                • Contains at least one number{'\n'}
                • Contains at least one special character
              </Text>
            </View>
            
            {/* Submit Button */}
            <Button
              title="Reset Password"
              onPress={handleResetPassword}
              isLoading={isLoading}
              fullWidth
              size="lg"
            />
            
            {/* Back to Login */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
              <Text style={{ color: colors.text.secondary }}>Remember your password? </Text>
              <TouchableOpacity onPress={handleBackToLogin}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        
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
    </LinearGradient>
  );
}
