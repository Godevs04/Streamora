export default {
  // API endpoints
  API: {
    BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.23:5001/api',
    ENDPOINTS: {
      AUTH: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        ME: '/auth/me',
        VERIFY_EMAIL: '/auth/verify-email',
        RESEND_OTP: '/auth/resend-otp',
        FORGOT_PASSWORD: '/auth/forgot-password',
        VERIFY_FORGOT_OTP: '/auth/verify-forgot-otp',
        RESET_PASSWORD: '/auth/reset-password',
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
        SCHEDULED: '/videos/scheduled',
        PUBLISH: (id: string) => `/videos/${id}/publish`,
        COMMENTS: {
          LIST: (videoId: string) => `/videos/${videoId}/comments`,
          CREATE: (videoId: string) => `/videos/${videoId}/comments`,
          DELETE: (commentId: string) => `/comments/${commentId}`,
          LIKE: (commentId: string) => `/comments/${commentId}/like`,
        },
      },
      NOTIFICATIONS: {
        REGISTER: '/notifications/register',
        SEND: '/notifications/send',
      },
      ADMIN: {
        CREATOR: {
          STATS: '/admin/creator/stats',
          LATEST_VIDEOS: '/admin/creator/latest-videos',
          ANALYTICS: '/admin/creator/analytics',
          MONETIZATION: '/admin/creator/monetization',
          CONTENT: '/admin/creator/content',
          COMMUNITY: '/admin/creator/community',
          SETTINGS: '/admin/creator/settings',
        },
        CHANNEL: {
          UPDATE: '/admin/channel/update',
          UPLOAD_PROFILE: '/admin/channel/upload-profile',
          UPLOAD_BANNER: '/admin/channel/upload-banner',
        },
        PAYMENTS: {
          LIST: '/admin/payments/methods',
          ADD: '/admin/payments/methods',
          DELETE: (id: string) => `/admin/payments/methods/${id}`,
          SET_DEFAULT: (id: string) => `/admin/payments/methods/${id}/default`,
        },
        POLICIES: {
          GET: '/admin/policies',
        },
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
