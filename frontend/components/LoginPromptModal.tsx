import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../constants/colors';
import useAuthStore from '../store/useAuthStore';
import { PreviousIntent } from '../types';
import { APP_ICONS } from '../utils/iconLoader';

interface LoginPromptModalProps {
  visible: boolean;
  onClose: () => void;
  intent: PreviousIntent;
}

const LoginPromptModal: React.FC<LoginPromptModalProps> = ({
  visible,
  onClose,
  intent,
}) => {
  const { setPreviousIntent } = useAuthStore();

  const handleLogin = () => {
    // Store the intent for after login
    setPreviousIntent(intent);
    // Navigate to login screen
    router.push('/(auth)/login');
    onClose();
  };

  const handleRegister = () => {
    // Store the intent for after registration
    setPreviousIntent(intent);
    // Navigate to register screen
    router.push('/(auth)/register');
    onClose();
  };

  // Get appropriate message based on intent type
  const getMessage = () => {
    switch (intent.type) {
      case 'like':
        return 'like this video';
      case 'dislike':
        return 'dislike this video';
      case 'subscribe':
        return 'subscribe to this channel';
      case 'comment':
        return 'leave a comment';
      case 'post':
        return 'create a post';
      case 'profile':
        return 'view your profile';
      case 'shorts':
        return 'create shorts';
      case 'share':
        return 'share this content';
      default:
        return 'continue';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Sign in required</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name={APP_ICONS.CLOSE as any} size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.message}>
                You need to be signed in to {getMessage()}
              </Text>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.buttonOutline}
                  onPress={handleRegister}
                >
                  <Text style={styles.buttonOutlineText}>Register</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleLogin}>
                  <LinearGradient
                    colors={['#FF0000', '#CC0000']} // YouTube's red gradient
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>Sign In</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: '#212121', // YouTube's dark theme color
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 6,
  },
  message: {
    fontSize: 16,
    color: '#E0E0E0',
    marginBottom: 28,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  buttonOutline: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#3EA6FF', // YouTube's blue color
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonOutlineText: {
    color: '#3EA6FF',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoginPromptModal;
