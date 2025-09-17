import React, { useState } from 'react';
import { TextInput, Text, View, TextInputProps, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import colors from '../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  isPassword?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  // Handle password visibility toggle
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  
  // Border color based on state
  const getBorderColor = () => {
    if (error) return 'border-error';
    if (isFocused) return 'border-primary';
    return 'border-gray-300';
  };
  
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-white mb-1 text-sm font-medium">{label}</Text>
      )}
      
      <View className={`flex-row items-center border rounded-lg px-3 py-2 bg-gray-800 ${getBorderColor()}`}>
        {leftIcon && (
          <Icon name={leftIcon} size={20} color={isFocused ? colors.primary : colors.gray} className="mr-2" />
        )}
        
        <TextInput
          className="flex-1 text-white text-base"
          placeholderTextColor={colors.gray}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !isPasswordVisible}
          {...rest}
        />
        
        {isPassword ? (
          <TouchableOpacity onPress={togglePasswordVisibility}>
            <Icon
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.gray}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress}>
            <Icon name={rightIcon} size={20} color={colors.gray} />
          </TouchableOpacity>
        ) : null}
      </View>
      
      {error && (
        <Text className="text-error text-xs mt-1">{error}</Text>
      )}
    </View>
  );
};

export default Input;
