import api from './api';
import config from '../constants/config';
import { AuthResponse, RegisterResponse, LoginCredentials, RegisterCredentials } from '../types';

/**
 * Register a new user
 * @param credentials - User registration credentials
 * @returns Promise with auth response
 */
export const register = async (credentials: RegisterCredentials): Promise<RegisterResponse> => {
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

/**
 * Verify email with OTP
 * @param email - User email
 * @param otp - 6-digit OTP code
 * @returns Promise with auth response
 */
export const verifyEmail = async (email: string, otp: string): Promise<AuthResponse> => {
  return api.post(config.API.ENDPOINTS.AUTH.VERIFY_EMAIL, { email, otp });
};

/**
 * Resend OTP for email verification
 * @param email - User email
 * @returns Promise with success response
 */
export const resendOTP = async (email: string): Promise<{ success: boolean; message: string }> => {
  return api.post(config.API.ENDPOINTS.AUTH.RESEND_OTP, { email });
};
