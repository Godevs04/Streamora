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
    sm: 'py-2 px-3',
    md: 'py-3 px-4',
    lg: 'py-4 px-6',
  };
  
  // Text size styles
  const textSizeStyles = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };
  
  // Variant styles
  const getButtonStyles = () => {
    switch (variant) {
      case 'primary':
        return 'rounded-lg';
      case 'secondary':
        return 'rounded-lg bg-gray-800';
      case 'outline':
        return 'rounded-lg border border-primary';
      default:
        return 'rounded-lg';
    }
  };
  
  // Text color based on variant
  const getTextColor = () => {
    switch (variant) {
      case 'outline':
        return 'text-primary';
      default:
        return 'text-white';
    }
  };
  
  // Width style
  const widthStyle = fullWidth ? 'w-full' : '';
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
      className={`${widthStyle} overflow-hidden ${rest.className || ''}`}
      {...rest}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className={`${getButtonStyles()} ${sizeStyles[size]} items-center justify-center flex-row`}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              {icon && <>{icon}</>}
              <Text className={`${textSizeStyles[size]} font-medium ${getTextColor()} ${icon ? 'ml-2' : ''}`}>
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
          className={`${getButtonStyles()} ${sizeStyles[size]} items-center justify-center flex-row`}
          {...rest}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={variant === 'outline' ? colors.primary : 'white'} />
          ) : (
            <>
              {icon && <>{icon}</>}
              <Text className={`${textSizeStyles[size]} font-medium ${getTextColor()} ${icon ? 'ml-2' : ''}`}>
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
