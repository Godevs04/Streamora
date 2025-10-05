export interface User {
  _id: string;
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  roles: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  _id: string;
  owner: User;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl: string;
  thumbnailAspectRatio?: '16:9' | '4:3' | '1:1';
  duration: number;
  tags: string[];
  likes: string[];
  likesCount: number;
  views: number;
  type: 'normal' | 'shorts';
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
}

export interface Comment {
  _id: string;
  video: string;
  author: User;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VideosApiResponse {
  success: boolean;
  data: {
    videos: Video[];
  };
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  username?: string;
}

export interface VideoUpload {
  title: string;
  description?: string;
  tags?: string[];
  videoUri?: string;
  videoUrl?: string;
  thumbnailUri?: string;
  thumbnailUrl?: string;
  thumbnailAspectRatio?: '16:9' | '4:3' | '1:1';
  duration?: number;
  type?: 'normal' | 'shorts';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: 'recent' | 'popular' | 'newest' | 'oldest' | 'top';
}

export interface PreviousIntent {
  type: 'like' | 'dislike' | 'subscribe' | 'post' | 'profile' | 'shorts' | 'comment' | 'share';
  data?: any;
  screen?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  previousIntent: PreviousIntent | null;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setPreviousIntent: (intent: PreviousIntent | null) => void;
  login: (credentials: LoginCredentials) => Promise<PreviousIntent | null>;
  register: (credentials: RegisterCredentials) => Promise<PreviousIntent | null>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  updateUser: (updatedUser: User) => Promise<User>;
}
