import React from 'react';
import { Image, View, Text } from 'react-native';
import colors from '../constants/colors';

interface AvatarProps {
  uri?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  name?: string;
  showInitials?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({
  uri,
  size = 'md',
  name = '',
  showInitials = true,
}) => {
  // Size styles
  const sizeStyles = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };
  
  // Font size styles
  const fontSizeStyles = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl',
  };
  
  // Get initials from name
  const getInitials = () => {
    if (!name) return '';
    
    const names = name.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
  };
  
  return (
    <View className={`${sizeStyles[size]} rounded-full overflow-hidden bg-gray-700 items-center justify-center`}>
      {uri ? (
        <Image
          source={{ uri }}
          className="w-full h-full"
          resizeMode="cover"
        />
      ) : showInitials ? (
        <Text className={`${fontSizeStyles[size]} font-bold text-white`}>
          {getInitials()}
        </Text>
      ) : null}
    </View>
  );
};

export default Avatar;
