import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../constants/colors';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  icon,
  ...rest
}) => {
  // Size styles
  const sizeStyles = {
    sm: { paddingVertical: 8, paddingHorizontal: 12 },
    md: { paddingVertical: 12, paddingHorizontal: 16 },
    lg: { paddingVertical: 16, paddingHorizontal: 24 },
  };
  
  // Text size styles
  const textSizeStyles = {
    sm: { fontSize: 14 },
    md: { fontSize: 16 },
    lg: { fontSize: 18 },
  };
  
  // Get button style based on variant
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: 8,
    };
    
    switch (variant) {
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: '#1F2937', // gray-800
        };
      case 'outline':
        return {
          ...baseStyle,
          borderWidth: 1,
          borderColor: colors.primary,
        };
      default:
        return baseStyle;
    }
  };
  
  // Get text color based on variant
  const getTextColor = () => {
    switch (variant) {
      case 'outline':
        return colors.primary;
      default:
        return 'white';
    }
  };
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
      style={[
        { overflow: 'hidden' },
        fullWidth ? { width: '100%' } : {},
      ]}
      {...rest}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            getButtonStyle(),
            sizeStyles[size],
            { alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              {icon && <>{icon}</>}
              <Text style={[
                textSizeStyles[size],
                { color: getTextColor(), fontWeight: '500' },
                icon ? { marginLeft: 8 } : {}
              ]}>
                {title}
              </Text>
            </>
          )}
        </LinearGradient>
      ) : (
        <TouchableOpacity
          onPress={onPress}
          disabled={isLoading}
          activeOpacity={0.8}
          style={[
            getButtonStyle(),
            sizeStyles[size],
            { alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }
          ]}
          {...rest}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={variant === 'outline' ? colors.primary : 'white'} />
          ) : (
            <>
              {icon && <>{icon}</>}
              <Text style={[
                textSizeStyles[size],
                { color: getTextColor(), fontWeight: '500' },
                icon ? { marginLeft: 8 } : {}
              ]}>
                {title}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default Button;
