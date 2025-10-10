import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import config from '../constants/config';

// Create axios instance with base URL
const api = axios.create({
  baseURL: config.API.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add request interceptor to attach token to requests
api.interceptors.request.use(
  async (reqConfig) => {
    const token = await SecureStore.getItemAsync(config.STORAGE.AUTH_TOKEN);
    
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
    
    return reqConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Don't log warnings for admin authentication endpoints to avoid console spam
    const isAdminAuthEndpoint = error?.config?.url?.includes('/admin-auth/');
    
    if (!isAdminAuthEndpoint) {
      // Use console.warn to avoid triggering RedBox in development for handled 4xx/5xx
      console.warn('API Warning:', error?.response?.status, error?.response?.data?.message || error?.message);
    }
    
    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: 'Network error. Please check your internet connection.',
        status: 0,
        errors: [],
        isNetworkError: true
      });
    }
    
    const customError = {
      message: error.response?.data?.message || 'Something went wrong',
      status: error.response?.status || 500,
      errors: error.response?.data?.errors || [],
    };
    
    return Promise.reject(customError);
  }
);

export default api;
