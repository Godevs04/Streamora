import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import Avatar from '../components/Avatar';
import useAuthStore from '../store/useAuthStore';
import { uploadImage } from '../services/upload';
import colors from '../constants/colors';

export default function EditProfile() {
  const { user, updateUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    bio: user?.bio || '',
    email: user?.email || '',
  });
  const [avatarUri, setAvatarUri] = useState(user?.avatarUrl || '');

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (!formData.username.trim()) {
      Alert.alert('Error', 'Username is required');
      return;
    }

    setIsLoading(true);
    try {
      // In a real app, you would make an API call to update the user
      await updateUser({
        _id: user?._id || '',
        name: formData.name.trim(),
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        email: formData.email.trim(),
        avatarUrl: avatarUri,
        roles: user?.roles || ['user'],
        createdAt: user?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please allow access to your media library to change your avatar.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setAvatarUri(imageUri);
        
        // Upload the image to server
        setIsLoading(true);
        try {
          const { token } = useAuthStore.getState();
          if (!token) {
            throw new Error('No authentication token');
          }
          
          const uploadedUrl = await uploadImage(imageUri, token);
          setAvatarUri(uploadedUrl);
          
          // Update the user in the store with the new avatar URL
          await updateUser({
            _id: user?._id || '',
            name: formData.name.trim(),
            username: formData.username.trim(),
            bio: formData.bio.trim(),
            email: formData.email.trim(),
            avatarUrl: uploadedUrl,
            roles: user?.roles || ['user'],
            createdAt: user?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          
          Alert.alert('Success', 'Avatar updated successfully');
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          Alert.alert('Error', 'Failed to upload avatar. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Edit Profile</Text>
      <TouchableOpacity 
        style={styles.saveButton}
        onPress={handleSave}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Text style={styles.saveButtonText}>Save</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderAvatarSection = () => (
    <View style={styles.avatarSection}>
      <Text style={styles.sectionTitle}>Profile Picture</Text>
      <View style={styles.avatarContainer}>
        <TouchableOpacity onPress={handleChangeAvatar}>
          <View style={styles.avatarWrapper}>
            <Avatar uri={avatarUri} name={formData.name} size="xl" />
            <View style={styles.cameraIcon}>
              <MaterialIcons name="camera-alt" size={20} color="white" />
            </View>
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Tap to change profile picture</Text>
      </View>
    </View>
  );

  const renderFormSection = () => (
    <View style={styles.formSection}>
      <Text style={styles.sectionTitle}>Personal Information</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Name *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.name}
          onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
          placeholder="Enter your name"
          placeholderTextColor={colors.text.tertiary}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Username *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.username}
          onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
          placeholder="Enter your username"
          placeholderTextColor={colors.text.tertiary}
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Email</Text>
        <TextInput
          style={styles.textInput}
          value={formData.email}
          onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
          placeholder="Enter your email"
          placeholderTextColor={colors.text.tertiary}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Bio</Text>
        <TextInput
          style={[styles.textInput, styles.bioInput]}
          value={formData.bio}
          onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
          placeholder="Tell us about yourself"
          placeholderTextColor={colors.text.tertiary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.characterCount}>{formData.bio.length}/500</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.safeArea}>
        {renderHeader()}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {renderAvatarSection()}
          {renderFormSection()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background.secondary,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  avatarSection: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    alignItems: 'center',
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  avatarHint: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  formSection: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    color: colors.text.secondary,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
});
