import api from './api';
import config from '../constants/config';
import { AuthResponse, LoginCredentials, RegisterCredentials } from '../types';

/**
 * Register a new user
 * @param credentials - User registration credentials
 * @returns Promise with auth response
 */
export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  return api.post(config.API.ENDPOINTS.AUTH.REGISTER, credentials);
};

/**
 * Login a user
 * @param credentials - User login credentials
 * @returns Promise with auth response
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  return api.post(config.API.ENDPOINTS.AUTH.LOGIN, credentials);
};

/**
 * Get current user profile
 * @returns Promise with auth response
 */
export const getMe = async (): Promise<AuthResponse> => {
  return api.get(config.API.ENDPOINTS.AUTH.ME);
};
