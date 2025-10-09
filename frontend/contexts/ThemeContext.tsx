import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { theme: storedTheme, setTheme: setStoredTheme } = useSettingsStore();
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemTheme(colorScheme === 'dark' ? 'dark' : 'light');
    });

    // Set initial system theme
    setSystemTheme(Appearance.getColorScheme() === 'dark' ? 'dark' : 'light');

    return () => subscription?.remove();
  }, []);

  // Determine if we should use dark mode
  const isDark = storedTheme === 'system' ? systemTheme === 'dark' : storedTheme === 'dark';

  const setTheme = (theme: Theme) => {
    setStoredTheme(theme);
  };

  return (
    <ThemeContext.Provider value={{ theme: storedTheme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
