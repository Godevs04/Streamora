import { Platform } from 'react-native';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome, FontAwesome5 } from '@expo/vector-icons';
import { MaterialIcons as MaterialIconsType } from '@expo/vector-icons/build/Icons';
import { Ionicons as IoniconsType } from '@expo/vector-icons/build/Icons';

// Define all icons that will be used in the app
export const APP_ICONS: {[key: string]: keyof typeof IoniconsType.glyphMap} = {
  // Tab icons
  HOME: 'home-outline',
  HOME_FILLED: 'home',
  EXPLORE: 'compass-outline',
  EXPLORE_FILLED: 'compass',
  ADD: 'add-outline',
  ADD_FILLED: 'add',
  PROFILE: 'person-outline',
  PROFILE_FILLED: 'person',
  
  // Action icons
  LIKE: 'thumbs-up-outline',
  LIKE_FILLED: 'thumbs-up',
  DISLIKE: 'thumbs-down-outline',
  DISLIKE_FILLED: 'thumbs-down',
  COMMENT: 'chatbubble-outline',
  COMMENT_FILLED: 'chatbubble',
  SHARE: 'share-social-outline',
  SHARE_FILLED: 'share-social',
  SUBSCRIBE: 'add-circle-outline',
  SUBSCRIBED: 'checkmark-circle-outline',
  
  // UI icons
  CLOSE: 'close',
  SEARCH: 'search-outline',
  NOTIFICATIONS: 'notifications-outline',
  NOTIFICATIONS_FILLED: 'notifications',
  SETTINGS: 'settings-outline',
  MENU: 'menu-outline',
  MORE: 'ellipsis-vertical',
};

// Material icon names used in the app
export const MATERIAL_ICONS: {[key: string]: keyof typeof MaterialIconsType.glyphMap} = {
  THUMB_UP: 'thumb-up',
  THUMB_UP_OFF: 'thumb-up-off-alt',
  THUMB_DOWN: 'thumb-down',
  THUMB_DOWN_OFF: 'thumb-down-off-alt',
  SHARE: 'share',
  MORE: 'more-vert',
};

// Map of all icons to preload
const ICON_MAP = {
  Ionicons: Object.values(APP_ICONS),
  MaterialIcons: Object.values(MATERIAL_ICONS),
  MaterialCommunityIcons: ['youtube', 'bell-outline', 'bell'],
  FontAwesome: ['thumbs-up', 'thumbs-down', 'share', 'comment'],
  FontAwesome5: ['youtube', 'share-alt'],
};

/**
 * Preload all icon fonts to prevent "?" icons
 * 
 * Note: With @expo/vector-icons, we don't need to explicitly preload fonts
 * as Expo handles this automatically. This function is kept for compatibility
 * and to log the loading process.
 */
export async function preloadIcons(): Promise<void> {
  try {
    // With @expo/vector-icons, fonts are loaded automatically
    // We'll just log that we're using the icons to ensure they're imported
    console.log('Using Ionicons:', Ionicons.name);
    console.log('Using MaterialIcons:', MaterialIcons.name);
    console.log('Using MaterialCommunityIcons:', MaterialCommunityIcons.name);
    console.log('Using FontAwesome:', FontAwesome.name);
    console.log('Using FontAwesome5:', FontAwesome5.name);
    
    console.log('All icon fonts should be available through Expo');
    return Promise.resolve();
  } catch (error) {
    console.error('Error with icon fonts:', error);
    // Continue even if there's an error with logging
    return Promise.resolve();
  }
}

export default {
  APP_ICONS,
  preloadIcons,
};
