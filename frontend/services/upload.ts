import axios from 'axios';
import config from '../constants/config';

const API_BASE_URL = config.API.BASE_URL;

// Upload image to server
export const uploadImage = async (imageUri: string, token: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'avatar.jpg',
    } as any);

    const response = await axios.post(`${API_BASE_URL}/upload/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Upload video to server
export const uploadVideo = async (videoUri: string, token: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('video', {
      uri: videoUri,
      type: 'video/mp4',
      name: 'video.mp4',
    } as any);

    const response = await axios.post(`${API_BASE_URL}/upload/video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.url;
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};
