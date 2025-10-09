/**
 * Streamora color palette with light and dark theme support
 */

// Light theme colors
const lightColors = {
  // Primary colors
  primary: '#6366F1',       // Indigo blue
  secondary: '#F8FAFC',     // Light background
  white: '#FFFFFF',
  black: '#000000',
  
  // UI colors
  background: {
    primary: '#FFFFFF',     // White background
    secondary: '#F8FAFC',   // Light gray cards, modals
    tertiary: '#E2E8F0',   // Light gray for buttons, inputs
  },
  
  // Text colors
  text: {
    primary: '#1E293B',     // Dark text
    secondary: '#64748B',   // Secondary text (slate-500)
    tertiary: '#94A3B8',    // Disabled text (slate-400)
  },
  
  // Accent colors
  blue: '#3B82F6',          // Blue-500
  purple: '#6366F1',        // Indigo-500 (primary)
  indigo: '#4F46E5',        // Indigo-600
  
  // Utility colors
  gray: '#6B7280',         // Gray-500
  lightGray: '#E2E8F0',    // Gray-200
  darkGray: '#374151',     // Gray-700
  border: '#E2E8F0',       // Gray-200 for borders
  error: '#EF4444',        // Red-500
  success: '#10B981',      // Emerald-500
  warning: '#F59E0B',      // Amber-500
  info: '#3B82F6',         // Blue-500
  
  // Gradient colors
  gradientStart: '#FFFFFF',  // White
  gradientEnd: '#F8FAFC',    // Light gray
  
  // Button colors
  button: {
    primary: '#6366F1',     // Indigo-500
    secondary: '#3B82F6',   // Blue-500
    disabled: '#94A3B8',     // Slate-400
  },
  
  // Category colors
  category: {
    active: '#6366F1',      // Indigo-500
    inactive: '#E2E8F0',    // Gray-200
  },
};

// Dark theme colors
const darkColors = {
  // Primary colors
  primary: '#6366F1',       // Indigo blue
  secondary: '#1E1B4B',     // Dark blue background
  white: '#FFFFFF',
  black: '#000000',
  
  // UI colors
  background: {
    primary: '#0F0F23',     // Very dark blue background
    secondary: '#1E1B4B',   // Dark blue cards, modals
    tertiary: '#312E81',    // Darker blue for buttons, inputs
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',     // Main text
    secondary: '#A1A1AA',   // Secondary text (gray-400)
    tertiary: '#71717A',    // Disabled text (gray-500)
  },
  
  // Accent colors
  blue: '#3B82F6',          // Blue-500
  purple: '#6366F1',        // Indigo-500 (primary)
  indigo: '#4F46E5',        // Indigo-600
  
  // Utility colors
  gray: '#6B7280',         // Gray-500
  lightGray: '#A1A1AA',    // Gray-400
  darkGray: '#374151',     // Gray-700
  border: '#374151',       // Gray-700 for borders
  error: '#EF4444',        // Red-500
  success: '#10B981',      // Emerald-500
  warning: '#F59E0B',      // Amber-500
  info: '#3B82F6',         // Blue-500
  
  // Gradient colors
  gradientStart: '#0F0F23',  // Very dark blue
  gradientEnd: '#000000',    // Black
  
  // Button colors
  button: {
    primary: '#6366F1',     // Indigo-500
    secondary: '#3B82F6',   // Blue-500
    disabled: '#71717A',     // Gray-500
  },
  
  // Category colors
  category: {
    active: '#6366F1',      // Indigo-500
    inactive: '#374151',    // Gray-700
  },
};

// Function to get colors based on theme
export const getColors = (isDark: boolean) => {
  return isDark ? darkColors : lightColors;
};

// Default export for backward compatibility (dark theme)
export default darkColors;
