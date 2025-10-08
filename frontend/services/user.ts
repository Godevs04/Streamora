import axios from 'axios';
import config from '../constants/config';

const API_BASE_URL = config.API.BASE_URL;

// Get user profile
export const getUserProfile = async (token: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (token: string, profileData: {
  name?: string;
  username?: string;
  bio?: string;
  email?: string;
  avatarUrl?: string;
}) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/users/profile`, profileData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Update user avatar
export const updateUserAvatar = async (token: string, avatarUrl: string) => {
  try {
    const response = await axios.put(`${API_BASE_URL}/users/avatar`, { avatarUrl }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error updating user avatar:', error);
    throw error;
  }
};

// Get user statistics
export const getUserStats = async (token: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user stats:', error);
    throw error;
  }
};

// Get public stats for any user
export const getPublicUserStats = async (userId: string, token: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching public user stats:', error);
    throw error;
  }
};

// Subscribe to a user
export const subscribeToUser = async (userId: string, token: string) => {
  const response = await axios.post(`${API_BASE_URL}/users/${userId}/subscribe`, {}, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Unsubscribe from a user
export const unsubscribeFromUser = async (userId: string, token: string) => {
  const response = await axios.delete(`${API_BASE_URL}/users/${userId}/subscribe`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Check if current user is subscribed to another user
export const checkSubscriptionStatus = async (userId: string, token: string) => {
  const response = await axios.get(`${API_BASE_URL}/users/${userId}/subscription-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
