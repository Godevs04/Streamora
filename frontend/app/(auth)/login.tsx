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
      className="flex-1"
    >
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerClassName="flex-grow p-6 justify-center"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-10">
            <Text className="text-white text-3xl font-bold">Streamora</Text>
            <Text className="text-gray-300 text-lg mt-2">Sign in to your account</Text>
          </View>
          
          <View className="mb-6">
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
          
          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-300">Don't have an account? </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-medium">Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
