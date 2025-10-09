import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import useAuthStore from '../../store/useAuthStore';
import Button from '../../components/Button';
import Input from '../../components/Input';
import colors from '../../constants/colors';
import { getEmailError, getNameError, getPasswordError, getUsernameError } from '../../utils/validators';
import CustomAlert from '../../components/CustomAlert';
import { useCustomAlert } from '../../hooks/useCustomAlert';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
  });
  
  const { register, isLoading } = useAuthStore();
  const customAlert = useCustomAlert();
  
  const validateForm = () => {
    const nameError = getNameError(name);
    const emailError = getEmailError(email);
    const usernameError = getUsernameError(username);
    const passwordError = getPasswordError(password);
    
    setErrors({
      name: nameError,
      email: emailError,
      username: usernameError,
      password: passwordError,
    });
    
    return !nameError && !emailError && !passwordError && !usernameError;
  };
  
  const handleRegister = async () => {
    if (!validateForm()) return;
    
    try {
      const response = await register({
        name,
        email,
        password,
        username: username || undefined,
      });
      
      console.log('Registration successful:', response);
      
      // Check if email verification is required
      if (response?.data?.requiresVerification) {
        // Navigate to email verification screen
        router.push({
          pathname: '/auth/verify-email',
          params: { email: email }
        });
      } else {
        // If no verification required (shouldn't happen with current backend), navigate to home
        console.log('No verification required, navigating to home');
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      customAlert.show({
        title: 'Registration Failed',
        message: error.message || 'Failed to register. Please try again.',
        type: 'error',
        icon: 'error-outline'
      });
    }
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
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24
              }}>
                <Icon name="person-add" size={40} color="white" />
              </View>
              
              <Text style={{ 
                color: 'white', 
                fontSize: 32, 
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 8
              }}>
                Join Streamora
              </Text>
              
              <Text style={{ 
                color: colors.text.secondary, 
                fontSize: 16, 
                textAlign: 'center',
                lineHeight: 24
              }}>
                Create your account and start streaming today
              </Text>
            </View>
            
            {/* Form */}
            <View style={{ marginBottom: 32 }}>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                error={errors.name}
                leftIcon="person-outline"
                autoFocus
              />
              
              <Input
                label="Email Address"
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                leftIcon="mail-outline"
              />
              
              <Input
                label="Username (Optional)"
                placeholder="Choose a unique username"
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                error={errors.username}
                leftIcon="at-outline"
              />
              
              <Input
                label="Password"
                placeholder="Create a strong password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                leftIcon="lock-closed-outline"
                isPassword
              />
            </View>
            
            {/* Terms and Conditions */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ 
                color: colors.text.secondary, 
                fontSize: 12, 
                textAlign: 'center',
                lineHeight: 18
              }}>
                By creating an account, you agree to our{' '}
                <Text style={{ color: colors.primary }}>Terms of Service</Text>
                {' '}and{' '}
                <Text style={{ color: colors.primary }}>Privacy Policy</Text>
              </Text>
            </View>
            
            {/* Submit Button */}
            <Button
              title="Create Account"
              onPress={handleRegister}
              isLoading={isLoading}
              fullWidth
              size="lg"
            />
            
            {/* Divider */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginVertical: 32 
            }}>
              <View style={{ 
                flex: 1, 
                height: 1, 
                backgroundColor: colors.border 
              }} />
              <Text style={{ 
                color: colors.text.secondary, 
                marginHorizontal: 16, 
                fontSize: 14 
              }}>
                or
              </Text>
              <View style={{ 
                flex: 1, 
                height: 1, 
                backgroundColor: colors.border 
              }} />
            </View>
            
            {/* Sign In Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <Text style={{ color: colors.text.secondary }}>Already have an account? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={{ 
                    color: colors.primary, 
                    fontWeight: '600' 
                  }}>
                    Sign In
                  </Text>
                </TouchableOpacity>
              </Link>
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