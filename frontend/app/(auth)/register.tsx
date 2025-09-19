import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, router } from 'expo-router';
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
      const previousIntent = await register({
        name,
        email,
        password,
        username: username || undefined,
      });
      
      console.log('Registration successful');
      
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
        'Registration Failed',
        error.message || 'Failed to register. Please try again.'
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
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Streamora</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 16, marginTop: 8 }}>Create your account</Text>
          </View>
          
          <View style={{ marginBottom: 24 }}>
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
          
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ color: '#9CA3AF' }}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={{ color: colors.primary, fontWeight: '500' }}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}