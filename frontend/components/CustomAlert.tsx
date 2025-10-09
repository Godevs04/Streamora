import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '../hooks/useColors';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onClose: () => void;
  type?: 'success' | 'error' | 'warning' | 'info';
  icon?: string;
  verticalButtons?: boolean;
}

const { width } = Dimensions.get('window');

export default function CustomAlert({
  visible,
  title,
  message,
  buttons = [{ text: 'OK' }],
  onClose,
  type = 'info',
  icon,
  verticalButtons = false
}: CustomAlertProps) {
  const colors = useColors();
  const styles = createStyles(colors);
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: icon || 'check-circle',
          iconColor: '#10B981',
          gradientColors: ['#10B981', '#059669'],
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
        };
      case 'error':
        return {
          icon: icon || 'error',
          iconColor: '#EF4444',
          gradientColors: ['#EF4444', '#DC2626'],
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
        };
      case 'warning':
        return {
          icon: icon || 'warning',
          iconColor: '#F59E0B',
          gradientColors: ['#F59E0B', '#D97706'],
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
        };
      default:
        return {
          icon: icon || 'info',
          iconColor: colors.primary,
          gradientColors: [colors.primary, '#7b61ff'],
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
        };
    }
  };

  const config = getTypeConfig();

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    onClose();
  };

  const getButtonStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'destructive':
        return styles.destructiveButton;
      case 'cancel':
        return styles.cancelButton;
      default:
        return styles.defaultButton;
    }
  };

  const getButtonTextStyle = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'destructive':
        return styles.destructiveButtonText;
      case 'cancel':
        return styles.cancelButtonText;
      default:
        return styles.defaultButtonText;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
      hardwareAccelerated={Platform.OS === 'android'}
    >
      <View style={styles.backdrop}>
        <View style={styles.alertContainer}>
          <View style={styles.alertBackground}>
            <View style={styles.iconContainer}>
              <View style={[styles.iconBackground, { backgroundColor: config.backgroundColor }]}>
                <MaterialIcons name={config.icon as any} size={32} color={config.iconColor} />
              </View>
            </View>
            
            <Text style={styles.title}>{title}</Text>
            
            {message && (
              <Text style={styles.message}>{message}</Text>
            )}
            
            <View style={[
              styles.buttonContainer,
              verticalButtons && styles.verticalButtonContainer
            ]}>
              {buttons.map((button, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.button,
                    getButtonStyle(button.style),
                    buttons.length === 1 && styles.singleButton,
                    verticalButtons && styles.verticalButton
                  ]}
                  onPress={() => handleButtonPress(button)}
                >
                  <Text style={getButtonTextStyle(button.style)}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.background.secondary,
  },
  alertBackground: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconBackground: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: colors.text.secondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  verticalButtonContainer: {
    flexDirection: 'column',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  verticalButton: {
    flex: 0,
    width: '100%',
    marginBottom: 4,
  },
  singleButton: {
    flex: 0,
    minWidth: 120,
  },
  defaultButton: {
    backgroundColor: colors.primary,
  },
  cancelButton: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.background.tertiary,
  },
  destructiveButton: {
    backgroundColor: '#EF4444',
  },
  defaultButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '600',
  },
  destructiveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
