import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from '../../components/Button';
import colors from '../../constants/colors';
import { verifyForgotOTP, forgotPassword } from '../../services/auth';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

export default function VerifyOTP() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);
  const customAlert = useCustomAlert();
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(timer - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer]);
  
  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  
  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };
  
  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      customAlert.show({
        title: 'Error',
        message: 'Please enter a valid 6-digit OTP',
        type: 'error',
        icon: 'error-outline'
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await verifyForgotOTP(email!, otpCode);
      
      if (response.data?.verified) {
        // Navigate to reset password page
        router.push({
          pathname: '/(auth)/reset-password',
          params: { email, otp: otpCode }
        });
      } else {
        customAlert.show({
          title: 'Verification Failed',
          message: 'Invalid OTP. Please try again.',
          type: 'error',
          icon: 'error-outline'
        });
      }
    } catch (error: any) {
      customAlert.show({
        title: 'Verification Failed',
        message: error.message || 'Invalid OTP. Please try again.',
        type: 'error',
        icon: 'error-outline'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendOTP = async () => {
    setIsLoading(true);
    try {
      const response = await forgotPassword(email!);
      
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      
      customAlert.show({
        title: 'Success',
        message: 'OTP has been resent to your email',
        type: 'success',
        icon: 'check-circle'
      });
    } catch (error: any) {
      customAlert.show({
        title: 'Error',
        message: error.message || 'Failed to resend OTP. Please try again.',
        type: 'error',
        icon: 'error-outline'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBackToForgotPassword = () => {
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
                onPress={handleBackToForgotPassword}
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
                <Icon name="mail" size={40} color="white" />
              </View>
              
              <Text style={{ 
                color: 'white', 
                fontSize: 28, 
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 12
              }}>
                Verify OTP
              </Text>
              
              <Text style={{ 
                color: colors.text.secondary, 
                fontSize: 16, 
                textAlign: 'center',
                lineHeight: 24,
                marginBottom: 8
              }}>
                We've sent a 6-digit code to:
              </Text>
              
              <Text style={{ 
                color: colors.primary, 
                fontSize: 16, 
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {email}
              </Text>
            </View>
            
            {/* OTP Input */}
            <View style={{ marginBottom: 32 }}>
              <Text style={{ 
                color: 'white', 
                fontSize: 16, 
                fontWeight: '500',
                textAlign: 'center',
                marginBottom: 24
              }}>
                Enter the verification code
              </Text>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                paddingHorizontal: 20
              }}>
                {otp.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      if (ref) inputRefs.current[index] = ref;
                    }}
                    style={{
                      width: 45,
                      height: 55,
                      borderWidth: 2,
                      borderColor: digit ? colors.primary : colors.border,
                      borderRadius: 8,
                      backgroundColor: '#1F2937',
                      color: 'white',
                      fontSize: 24,
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}
                    value={digit}
                    onChangeText={(value) => handleOtpChange(value, index)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, index)}
                    keyboardType="numeric"
                    maxLength={1}
                    autoFocus={index === 0}
                  />
                ))}
              </View>
            </View>
            
            {/* Timer */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ 
                color: colors.text.secondary, 
                fontSize: 14 
              }}>
                {canResend ? (
                  <Text>Didn't receive the code? </Text>
                ) : (
                  <Text>Resend code in {timer}s</Text>
                )}
              </Text>
            </View>
            
            {/* Verify Button */}
            <Button
              title="Verify OTP"
              onPress={handleVerifyOTP}
              isLoading={isLoading}
              fullWidth
              size="lg"
            />
            
            {/* Resend Button */}
            {canResend && (
              <Button
                title="Resend OTP"
                onPress={handleResendOTP}
                isLoading={isLoading}
                fullWidth
                variant="outline"
                style={{ marginTop: 16 }}
              />
            )}
            
            {/* Back to Login */}
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
              <Text style={{ color: colors.text.secondary }}>Remember your password? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
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
