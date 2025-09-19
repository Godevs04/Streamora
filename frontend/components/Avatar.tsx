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
  // Size styles (in pixels)
  const sizeStyles = {
    xs: { width: 24, height: 24 },
    sm: { width: 32, height: 32 },
    md: { width: 40, height: 40 },
    lg: { width: 64, height: 64 },
    xl: { width: 96, height: 96 },
  };
  
  // Font size styles
  const fontSizeStyles = {
    xs: { fontSize: 12 },
    sm: { fontSize: 14 },
    md: { fontSize: 16 },
    lg: { fontSize: 20 },
    xl: { fontSize: 24 },
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
    <View style={[
      sizeStyles[size],
      { 
        borderRadius: 9999,
        overflow: 'hidden',
        backgroundColor: '#4B5563', // gray-700
        alignItems: 'center',
        justifyContent: 'center'
      }
    ]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      ) : showInitials ? (
        <Text style={[
          fontSizeStyles[size],
          { fontWeight: 'bold', color: 'white' }
        ]}>
          {getInitials()}
        </Text>
      ) : null}
    </View>
  );
};

export default Avatar;
