import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import useAuthStore from '../../store/useAuthStore';
import Button from '../../components/Button';
import Input from '../../components/Input';
import colors from '../../constants/colors';
import { getEmailError, getPasswordError } from '../../utils/validators';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({
    email: '',
    password: '',
  });
  
  const { login, isLoading } = useAuthStore();
  
  const validateForm = () => {
    const emailError = getEmailError(email);
    const passwordError = getPasswordError(password);
    
    setErrors({
      email: emailError,
      password: passwordError,
    });
    
    return !emailError && !passwordError;
  };
  
  const handleLogin = async () => {
    if (!validateForm()) return;
    
    try {
      const previousIntent = await login({ email, password });
      console.log('Login successful');
      
      // If there was a previous intent, handle it
      if (previousIntent) {
        console.log('Returning to previous intent:', previousIntent);
        
        // Handle different intent types
        switch (previousIntent.type) {
          case 'profile':
            router.replace('/(tabs)/profile');
            break;
          case 'post':
            router.replace('/(tabs)/upload');
            break;
          case 'shorts':
            router.replace('/(tabs)/upload');
            break;
          default:
            // For like, subscribe, comment intents, go back to home
            router.replace('/(tabs)/home');
        }
      } else {
        // Default navigation to home
        console.log('No previous intent, navigating to home');
        router.replace('/(tabs)/home');
      }
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.message || 'Failed to login. Please check your credentials and try again.'
      );
    }
  };
  
  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
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
                backgroundColor: colors.primary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24
              }}>
                <Icon name="videocam" size={40} color="white" />
              </View>
              
              <Text style={{ 
                color: 'white', 
                fontSize: 32, 
                fontWeight: 'bold',
                textAlign: 'center',
                marginBottom: 8
              }}>
                Welcome Back
              </Text>
              
              <Text style={{ 
                color: colors.text.secondary, 
                fontSize: 16, 
                textAlign: 'center',
                lineHeight: 24
              }}>
                Sign in to continue your streaming journey
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
              
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                leftIcon="lock-closed-outline"
                isPassword
              />
            </View>
            
            {/* Forgot Password Link */}
            <View style={{ alignItems: 'flex-end', marginBottom: 24 }}>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={{ 
                  color: colors.primary, 
                  fontSize: 14, 
                  fontWeight: '500' 
                }}>
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>
            
            {/* Submit Button */}
            <Button
              title="Sign In"
              onPress={handleLogin}
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
            
            {/* Sign Up Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <Text style={{ color: colors.text.secondary }}>Don't have an account? </Text>
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={{ 
                    color: colors.primary, 
                    fontWeight: '600' 
                  }}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}