import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useColors } from '../../hooks/useColors';
import { getEmailError } from '../../utils/validators';
import { forgotPassword } from '../../services/auth';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({ email: '' });
  const [isLoading, setIsLoading] = useState(false);
  const customAlert = useCustomAlert();
  const colors = useColors();
  
  const validateForm = () => {
    const emailError = getEmailError(email);
    setErrors({ email: emailError });
    return !emailError;
  };
  
  const handleForgotPassword = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const response = await forgotPassword(email);
      
      customAlert.show({
        title: 'OTP Sent Successfully',
        message: 'Please check your email for the verification code.',
        type: 'success',
        icon: 'check-circle',
        buttons: [
          {
            text: 'OK',
            onPress: () => {
              router.push({
                pathname: '/(auth)/verify-otp',
                params: { email }
              });
            }
          }
        ]
      });
    } catch (error: any) {
      customAlert.show({
        title: 'Error',
        message: error.message || 'Failed to send OTP. Please try again.',
        type: 'error',
        icon: 'error-outline'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackToLogin = () => {
    router.back();
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
              <TouchableOpacity 
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  padding: 8,
                  borderRadius: 8,
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }}
                onPress={handleBackToLogin}
              >
                <Icon name="arrow-back" size={24} color="white" />
              </TouchableOpacity>
              
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24
              }}>
                <Icon name="lock-closed" size={40} color="white" />
              </View>
              
              <Text style={{ 
                color: 'white', 
                fontSize: 28, 
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 12
              }}>
                Forgot Password?
              </Text>
              
              <Text style={{ 
                color: colors.text.secondary, 
                fontSize: 16, 
                textAlign: 'center',
                lineHeight: 24
              }}>
                No worries! Enter your email address and we'll send you a verification code to reset your password.
              </Text>
            </View>
            
            {/* Form */}
            <View style={{ marginBottom: 32 }}>
              <Input
                label="Email Address"
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                leftIcon="mail-outline"
                autoFocus
              />
            </View>
            
            {/* Submit Button */}
            <Button
              title="Send Verification Code"
              onPress={handleForgotPassword}
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
