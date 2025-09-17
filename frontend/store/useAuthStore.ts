import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AuthState, LoginCredentials, RegisterCredentials, User } from '../types';
import config from '../constants/config';
import { login as loginApi, register as registerApi, getMe } from '../services/auth';

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  
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
  
  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true });
    try {
      const response = await loginApi(credentials);
      const { user, token } = response.data;
      
      await get().setToken(token);
      set({ user, isAuthenticated: true, isLoading: false });
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
      const token = await SecureStore.getItemAsync(config.STORAGE.AUTH_TOKEN);
      
      if (!token) {
        set({ isLoading: false, isAuthenticated: false });
        return false;
      }
      
      set({ token });
      
      const response = await getMe();
      const { user } = response.data;
      
      set({ user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      await get().setToken(null);
      set({ user: null, isAuthenticated: false, isLoading: false });
      return false;
    }
  },
}));

export default useAuthStore;
