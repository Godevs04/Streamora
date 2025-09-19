import { Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';

/**
 * Helper function to load all icon fonts at app startup
 * This prevents the "?" icon issue on first render
 */
export const loadIconFonts = async () => {
  try {
    // Load fonts for the most commonly used icon sets
    await Promise.all([
      Ionicons.loadFont(),
      MaterialIcons.loadFont(),
      FontAwesome.loadFont(),
    ]);
    console.log('Icon fonts loaded successfully');
  } catch (error) {
    console.warn('Failed to load icon fonts:', error);
  }
};

/**
 * Helper function to get the correct tab bar icon name
 * Ensures icons are properly displayed across platforms
 */
export const getTabBarIconName = (name: string): string => {
  // Map of icon names to their respective components
  const iconMap: Record<string, string> = {
    home: 'home',
    explore: 'compass',
    post: 'add-circle',
    profile: 'person',
    // Add more icon mappings as needed
  };

  // Use the mapped icon name or fallback to the provided name
  return iconMap[name] || name;
};

export default {
  loadIconFonts,
  getTabBarIconName,
};
