export default {
  // API endpoints
  API: {
    BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
    ENDPOINTS: {
      AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        ME: '/auth/me',
      },
      USERS: {
        GET_BY_ID: (id: string) => `/users/${id}`,
        UPDATE_PROFILE: '/users/me',
      },
      VIDEOS: {
        LIST: '/videos',
        GET_BY_ID: (id: string) => `/videos/${id}`,
        CREATE: '/videos',
        LIKE: (id: string) => `/videos/${id}/like`,
        VIEW: (id: string) => `/videos/${id}/view`,
        COMMENTS: {
          LIST: (videoId: string) => `/videos/${videoId}/comments`,
          CREATE: (videoId: string) => `/videos/${videoId}/comments`,
          DELETE: (commentId: string) => `/comments/${commentId}`,
        },
      },
      NOTIFICATIONS: {
        REGISTER: '/notifications/register',
        SEND: '/notifications/send',
      },
    },
  },
  
  // Storage keys
  STORAGE: {
    AUTH_TOKEN: 'streamora_auth_token',
    USER_DATA: 'streamora_user_data',
  },
  
  // FCM
  FCM: {
    SENDER_ID: process.env.EXPO_PUBLIC_FCM_SENDER_ID,
  },
  
  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
  },
  
  // Video upload
  UPLOAD: {
    MAX_VIDEO_DURATION: 60, // seconds
    MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
    ALLOWED_TYPES: ['video/mp4', 'video/quicktime'],
  },
};
