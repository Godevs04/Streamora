import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AdminAuthMethod = 'pin' | 'password' | 'pattern';

interface AdminAuthState {
  isAuthenticated: boolean;
  authMethod: AdminAuthMethod | null;
  hasSetup: boolean;
  encryptedCredentials: string | null;
  setupComplete: boolean;
  authEnabled: boolean; // New field to enable/disable auth
  
  // Actions
  setupAuth: (method: AdminAuthMethod, credential: string) => Promise<void>;
  authenticate: (credential: string) => Promise<boolean>;
  logout: () => void;
  resetAuth: () => Promise<void>;
  sendResetOTP: (email: string) => Promise<boolean>;
  verifyResetOTP: (email: string, otp: string) => Promise<boolean>;
  updateAuthMethod: (method: AdminAuthMethod, credential: string) => Promise<void>;
  toggleAuth: (enabled: boolean) => void;
  changeCredentials: (method: AdminAuthMethod, credential: string) => Promise<void>;
  checkAdminSetup: () => Promise<void>;
}

// Encryption is now handled on the backend

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      authMethod: null,
      hasSetup: false,
      encryptedCredentials: null,
      setupComplete: false,
      authEnabled: true, // Default to enabled

      setupAuth: async (method: AdminAuthMethod, credential: string) => {
        try {
          const api = (await import('../services/api')).default;
          const response = await api.post('/admin-auth/setup', {
            authMethod: method,
            credential: credential
          });
          
          if (response.data.success) {
            set({
              authMethod: method,
              hasSetup: true,
              setupComplete: true,
              isAuthenticated: true,
              authEnabled: true,
            });
          } else {
            throw new Error(response.data.message || 'Setup failed');
          }
        } catch (error: any) {
          console.error('Error setting up admin auth:', error);
          // Check if this is actually a successful response wrapped in an error
          if (error.response?.data?.success === true) {
            set({
              authMethod: method,
              hasSetup: true,
              setupComplete: true,
              isAuthenticated: true,
              authEnabled: true,
            });
            return;
          }
          throw error;
        }
      },

      authenticate: async (credential: string): Promise<boolean> => {
        try {
          const api = (await import('../services/api')).default;
          const response = await api.post('/admin-auth/authenticate', {
            credential: credential
          });
          
          // Check if authentication was successful based on the response structure
          if (response.data.isAuthenticated === true || response.data.success === true) {
            // Update authentication state
            set((state) => ({ ...state, isAuthenticated: true }));
            return true;
          } else {
            return false;
          }
        } catch (error: any) {
          // If admin authentication is not set up, return false to trigger setup
          if (error.response?.status === 400 && error.response?.data?.message?.includes('not set up')) {
            set({ hasSetup: false, setupComplete: false });
            return false;
          }
          // For invalid credentials (401), throw the error so the component can show custom alert
          if (error.response?.status === 401) {
            throw new Error('Invalid credentials');
          }
          return false;
        }
      },

      logout: () => {
        set({ isAuthenticated: false });
      },

      resetAuth: async () => {
        try {
          // Clear all admin auth data
          set({
            isAuthenticated: false,
            authMethod: null,
            hasSetup: false,
            encryptedCredentials: null,
            setupComplete: false,
          });
        } catch (error) {
          console.error('Error resetting admin auth:', error);
          throw error;
        }
      },

      sendResetOTP: async (email: string): Promise<boolean> => {
        try {
          const api = (await import('../services/api')).default;
          // Try to get current user's email as fallback
          const authStore = (await import('./useAuthStore')).default;
          const currentUser = authStore.getState().user;
          const emailToUse = email || currentUser?.email;
          
          const response = await api.post('/admin-auth/reset-otp', { email: emailToUse });
          return response.data.success;
        } catch (error) {
          console.error('Error sending admin reset OTP:', error);
          return false;
        }
      },

      verifyResetOTP: async (email: string, otp: string): Promise<boolean> => {
        try {
          const api = (await import('../services/api')).default;
          // Try to get current user's email as fallback
          const authStore = (await import('./useAuthStore')).default;
          const currentUser = authStore.getState().user;
          const emailToUse = email || currentUser?.email;
          
          const response = await api.post('/admin-auth/verify-reset-otp', { email: emailToUse, otp });
          return response.data.success;
        } catch (error) {
          console.error('Error verifying admin reset OTP:', error);
          return false;
        }
      },

      updateAuthMethod: async (method: AdminAuthMethod, credential: string) => {
        try {
          // Use changeCredentials instead
          await get().changeCredentials(method, credential);
        } catch (error) {
          console.error('Error updating admin auth method:', error);
          throw error;
        }
      },

      toggleAuth: async (enabled: boolean) => {
        try {
          const api = (await import('../services/api')).default;
          const response = await api.put('/admin-auth/toggle-auth', {
            enabled: enabled
          });
          
          if (response.data.success) {
            set({ authEnabled: enabled });
            if (!enabled) {
              set({ isAuthenticated: true }); // Auto-authenticate when disabled
            }
          } else {
            throw new Error(response.data.message || 'Toggle failed');
          }
        } catch (error: any) {
          console.error('Error toggling admin auth:', error);
          // Check if this is actually a successful response wrapped in an error
          if (error.response?.data?.success === true) {
            set({ authEnabled: enabled });
            if (!enabled) {
              set({ isAuthenticated: true });
            }
            return;
          }
          throw error;
        }
      },

      changeCredentials: async (method: AdminAuthMethod, credential: string) => {
        try {
          const api = (await import('../services/api')).default;
          
          const requestData = {
            authMethod: method,
            credential: credential
          };
          
          // Add timeout to prevent hanging
          const response = await Promise.race([
            api.put('/admin-auth/credentials', requestData),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Request timeout')), 10000)
            )
          ]) as any;
          
          // Check if the response indicates success (either success field or message indicates success)
          if (response.data.success || response.data.message?.includes('successfully')) {
            set({
              authMethod: method,
              isAuthenticated: true,
              hasSetup: true,
              setupComplete: true,
            });
          } else {
            throw new Error(response.data.message || 'Change credentials failed');
          }
        } catch (error: any) {
          // Check if this is actually a successful response wrapped in an error
          if (error.response?.data?.message?.includes('successfully')) {
            set({
              authMethod: method,
              isAuthenticated: true,
              hasSetup: true,
              setupComplete: true,
            });
            return;
          }
          throw error;
        }
      },

      checkAdminSetup: async () => {
        try {
          const api = (await import('../services/api')).default;
          const response = await api.get('/admin-auth/settings');
          
          if (response.data.success) {
            const { auth } = response.data.data;
            set((state) => ({
              ...state, // Preserve existing state including isAuthenticated
              hasSetup: auth.hasSetup,
              setupComplete: auth.hasSetup,
              authMethod: auth.authMethod,
              authEnabled: auth.authEnabled,
            }));
          }
        } catch (error: any) {
          console.error('Error checking admin setup:', error);
          // If there's a validation error, it means admin record doesn't exist or is incomplete
          // This is expected for new users, so we'll set up as needed
          if (error.response?.status === 400) {
            set({ hasSetup: false, setupComplete: false });
          } else {
            // For other errors, assume setup is needed
            set({ hasSetup: false, setupComplete: false });
          }
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        authMethod: state.authMethod,
        hasSetup: state.hasSetup,
        setupComplete: state.setupComplete,
        // Don't persist isAuthenticated - should ask every time
        authEnabled: state.authEnabled, // Persist auth enabled state
      }),
    }
  )
);
