import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
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
      await login({ email, password });
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
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Streamora</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 16, marginTop: 8 }}>Sign in to your account</Text>
          </View>
          
          <View style={{ marginBottom: 24 }}>
            <Input
              label="Email"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              leftIcon="mail-outline"
            />
            
            <Input
              label="Password"
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              leftIcon="lock-closed-outline"
              isPassword
            />
          </View>
          
          <Button
            title="Sign In"
            onPress={handleLogin}
            isLoading={isLoading}
            fullWidth
          />
          
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ color: '#9CA3AF' }}>Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={{ color: colors.primary, fontWeight: '500' }}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
