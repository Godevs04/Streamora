import React, { useState } from 'react';
import { TextInput, Text, View, TextInputProps, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useColors } from '../hooks/useColors';

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
  const colors = useColors();
  
  // Handle password visibility toggle
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  
  // Border color based on state
  const getBorderColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.primary;
    return colors.border;
  };
  
  // Background color based on theme
  const getBackgroundColor = () => {
    return colors.background.tertiary;
  };
  
  // Text color based on theme
  const getTextColor = () => {
    return colors.text.primary;
  };
  
  // Label color based on theme
  const getLabelColor = () => {
    return colors.text.primary;
  };
  
  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ color: getLabelColor(), marginBottom: 4, fontSize: 14, fontWeight: '500' }}>{label}</Text>
      )}
      
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        borderWidth: 2, 
        borderColor: getBorderColor(), 
        borderRadius: 12, 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        backgroundColor: getBackgroundColor(),
      }}>
        {leftIcon && (
          <Icon 
            name={leftIcon} 
            size={20} 
            color={isFocused ? colors.primary : colors.text.secondary} 
            style={{ marginRight: 8 }} 
          />
        )}
        
        <TextInput
          style={{ 
            flex: 1, 
            color: getTextColor(), 
            fontSize: 16, 
            fontWeight: '500',
            height: 24,
            paddingVertical: 0,
            paddingHorizontal: 0,
          }}
          placeholderTextColor={colors.text.secondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword ? !isPasswordVisible : rest.secureTextEntry}
          autoCorrect={false}
          autoCapitalize="none"
          {...rest}
        />
        
        {isPassword ? (
          <TouchableOpacity onPress={togglePasswordVisibility}>
            <Icon
              name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity onPress={onRightIconPress}>
            <Icon name={rightIcon} size={20} color={colors.text.secondary} />
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
