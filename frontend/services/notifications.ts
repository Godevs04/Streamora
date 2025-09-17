import api from './api';
import config from '../constants/config';
import { ApiResponse } from '../types';

/**
 * Register FCM token with backend
 * @param fcmToken - Firebase Cloud Messaging token
 * @returns Promise with success response
 */
export const registerFCMToken = async (fcmToken: string): Promise<ApiResponse<{ message: string }>> => {
  return api.post(config.API.ENDPOINTS.NOTIFICATIONS.REGISTER, { fcmToken });
};

/**
 * Send push notification to a user
 * @param title - Notification title
 * @param body - Notification body
 * @param recipientUserId - Recipient user ID
 * @returns Promise with success response
 */
export const sendNotification = async (
  title: string,
  body: string,
  recipientUserId: string
): Promise<ApiResponse<{ message: string, result: any }>> => {
  return api.post(config.API.ENDPOINTS.NOTIFICATIONS.SEND, { title, body, recipientUserId });
};
