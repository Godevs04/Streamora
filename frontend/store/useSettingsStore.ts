import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  // Theme settings
  theme: 'light' | 'dark' | 'system';
  isDarkMode: boolean;
  
  // Language settings
  language: 'English' | 'Spanish' | 'French';
  
  // Notification settings
  notifications: {
    push: boolean;
    email: boolean;
    likes: boolean;
    comments: boolean;
    followers: boolean;
  };
  
  // Privacy settings
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showEmail: boolean;
    allowMessages: boolean;
    dataCollection: boolean;
    analytics: boolean;
  };
  
  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: 'English' | 'Spanish' | 'French') => void;
  updateNotifications: (notifications: Partial<SettingsState['notifications']>) => void;
  updatePrivacy: (privacy: Partial<SettingsState['privacy']>) => void;
  toggleDarkMode: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'system',
      isDarkMode: false,
      language: 'English',
      notifications: {
        push: true,
        email: true,
        likes: true,
        comments: true,
        followers: true,
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        allowMessages: true,
        dataCollection: true,
        analytics: true,
      },
      
      // Actions
      setTheme: (theme) => {
        set({ theme });
        if (theme === 'dark') {
          set({ isDarkMode: true });
        } else if (theme === 'light') {
          set({ isDarkMode: false });
        } else {
          // System theme - you can implement system detection here
          set({ isDarkMode: false });
        }
      },
      
      setLanguage: (language) => {
        set({ language });
      },
      
      updateNotifications: (notifications) => {
        set((state) => ({
          notifications: { ...state.notifications, ...notifications }
        }));
      },
      
      updatePrivacy: (privacy) => {
        set((state) => ({
          privacy: { ...state.privacy, ...privacy }
        }));
      },
      
      toggleDarkMode: () => {
        set((state) => ({ isDarkMode: !state.isDarkMode }));
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        notifications: state.notifications,
        privacy: state.privacy,
      }),
    }
  )
);
