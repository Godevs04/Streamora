import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AuthState, LoginCredentials, PreviousIntent, RegisterCredentials, User } from '../types';
import config from '../constants/config';
import { login as loginApi, register as registerApi, getMe } from '../services/auth';

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  previousIntent: null,
  
  setUser: (user: User | null) => set({ user, isAuthenticated: !!user }),
  
  setToken: async (token: string | null) => {
    set({ token });
    
    if (token) {
      await SecureStore.setItemAsync(config.STORAGE.AUTH_TOKEN, token);
    } else {
      await SecureStore.deleteItemAsync(config.STORAGE.AUTH_TOKEN);
    }
  },
  
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  
  setPreviousIntent: (previousIntent: PreviousIntent | null) => set({ previousIntent }),
  
  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true });
    try {
      const response = await loginApi(credentials);
      const { user, token } = response.data;
      
      await get().setToken(token);
      set({ user, isAuthenticated: true, isLoading: false });
      
      // Return the previous intent for navigation after login
      return get().previousIntent;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  register: async (credentials: RegisterCredentials) => {
    set({ isLoading: true });
    try {
      const response = await registerApi(credentials);
      const { user, token } = response.data;
      
      await get().setToken(token);
      set({ user, isAuthenticated: true, isLoading: false });
      
      // Return the previous intent for navigation after registration
      return get().previousIntent;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  logout: async () => {
    set({ isLoading: true });
    try {
      await get().setToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  checkAuth: async () => {
    set({ isLoading: true });
    try {
      // First, quickly set isLoading to false to ensure UI renders
      setTimeout(() => {
        if (get().isLoading) {
          console.log('Forcing loading state to false to prevent UI blocking');
          set({ isLoading: false });
        }
      }, 2000);
      
      const token = await SecureStore.getItemAsync(config.STORAGE.AUTH_TOKEN);
      
      if (!token) {
        console.log('No token found, user is not authenticated');
        set({ isLoading: false, isAuthenticated: false });
        return false;
      }
      
      // Set token but don't wait for API response to show UI
      set({ token, isLoading: false });
      
      // Try to get user data in background
      try {
        console.log('Attempting to fetch user data...');
        const response = await getMe();
        const { user } = response.data;
        
        console.log('User authenticated successfully');
        set({ user, isAuthenticated: true });
        return true;
      } catch (apiError) {
        console.error('API error during authentication:', apiError);
        // API error - clear token and continue
        await get().setToken(null);
        set({ user: null, isAuthenticated: false });
        return false;
      }
    } catch (error) {
      console.error('Error during auth check:', error);
      // Handle any other errors
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  },
}));

export default useAuthStore;
