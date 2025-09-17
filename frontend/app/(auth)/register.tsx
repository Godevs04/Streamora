import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link } from 'expo-router';
import useAuthStore from '../../store/useAuthStore';
import Button from '../../components/Button';
import Input from '../../components/Input';
import colors from '../../constants/colors';
import { getEmailError, getNameError, getPasswordError, getUsernameError } from '../../utils/validators';

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
      await register({
        name,
        email,
        password,
        username: username || undefined,
      });
    } catch (error: any) {
      Alert.alert(
        'Registration Failed',
        error.message || 'Failed to register. Please try again.'
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
          contentContainerClassName="flex-grow p-6"
          keyboardShouldPersistTaps="handled"
        >
          <View className="items-center mb-8">
            <Text className="text-white text-3xl font-bold">Streamora</Text>
            <Text className="text-gray-300 text-lg mt-2">Create your account</Text>
          </View>
          
          <View className="mb-6">
            <Input
              label="Full Name"
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              error={errors.name}
              leftIcon="person-outline"
            />
            
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
              label="Username (optional)"
              placeholder="Choose a username"
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
              error={errors.username}
              leftIcon="at-outline"
            />
            
            <Input
              label="Password"
              placeholder="Create a password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              leftIcon="lock-closed-outline"
              isPassword
            />
          </View>
          
          <Button
            title="Create Account"
            onPress={handleRegister}
            isLoading={isLoading}
            fullWidth
          />
          
          <View className="flex-row justify-center mt-6">
            <Text className="text-gray-300">Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary font-medium">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
