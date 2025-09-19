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
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../constants/colors';
import useAuthStore from '../store/useAuthStore';
import { PreviousIntent } from '../types';

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
                  <Icon name="close" size={24} color="#FFFFFF" />
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
                    colors={[colors.gradientStart, colors.gradientEnd]}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  message: {
    fontSize: 16,
    color: '#CCCCCC',
    marginBottom: 24,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonOutline: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonOutlineText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  buttonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
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
