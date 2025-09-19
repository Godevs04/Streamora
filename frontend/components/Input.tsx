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
    if (error) return colors.error;
    if (isFocused) return colors.primary;
    return '#4B5563'; // gray-300
  };
  
  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ color: 'white', marginBottom: 4, fontSize: 14, fontWeight: '500' }}>{label}</Text>
      )}
      
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderWidth: 1, 
        borderColor: getBorderColor(), 
        borderRadius: 8, 
        paddingHorizontal: 12, 
        paddingVertical: 8, 
        backgroundColor: '#1F2937' // gray-800
      }}>
        {leftIcon && (
          <Icon 
            name={leftIcon} 
            size={20} 
            color={isFocused ? colors.primary : colors.gray} 
            style={{ marginRight: 8 }} 
          />
        )}
        
        <TextInput
          style={{ flex: 1, color: 'white', fontSize: 16 }}
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
        <Text style={{ color: colors.error, fontSize: 12, marginTop: 4 }}>{error}</Text>
      )}
    </View>
  );
};

export default Input;
