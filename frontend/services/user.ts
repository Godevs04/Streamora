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
