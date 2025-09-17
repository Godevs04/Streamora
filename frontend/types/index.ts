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
  tags: string[];
  likes: string[];
  likesCount: number;
  views: number;
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
  thumbnailUrl?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: 'recent' | 'popular';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}
