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
  commentsCount?: number;
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
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

// Admin / Creator Studio
export interface CreatorStats {
  subscribers: number;
  totalViews: number;
  watchTimeHours: number; // aggregated hours
}

export interface AdminDashboardData {
  stats: CreatorStats;
  latestVideos: Video[];
}

// Analytics
export interface EngagementPoint {
  date: string; // ISO date (day)
  views: number;
}

export interface TrafficSources {
  direct: number;
  external: number;
  search?: number;
  suggested?: number;
}

export interface AudienceDemographics {
  male?: number;   // 0-100
  female?: number; // 0-100
  other?: number;  // 0-100
}

export interface PerVideoKpis {
  videoId: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares?: number;
  retentionPercent?: number; // 0-100
}

export interface AnalyticsData {
  engagement: EngagementPoint[];
  traffic: TrafficSources;
  demographics?: AudienceDemographics;
  perVideo: PerVideoKpis[];
}

// Monetization
export interface MonetizationEligibility {
  subscribers: number;
  watchHours: number;
  policyCompliance: boolean;
  approved: boolean;
}

export interface EarningsOverview {
  estimatedRevenue: number;
  cpm: number;
  rpm: number;
}

export interface PayoutRecord {
  amount: number;
  date: string;
  method: string;
  status: 'pending' | 'paid' | 'processing';
}

export interface AdRevenueBreakdown {
  ads: number;
  shorts: number;
  memberships?: number;
  superChat?: number;
}

export interface MonetizationData {
  eligibility: MonetizationEligibility;
  earnings: EarningsOverview;
  balance: number;
  payouts: PayoutRecord[];
  revenueBreakdown: AdRevenueBreakdown;
  earningsHistory: { date: string; revenue: number }[];
}

// Community
export interface ModerationComment {
  _id: string;
  author: User;
  text: string;
  video: { _id: string; title: string };
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ReportedComment {
  _id: string;
  author: User;
  text: string;
  video: { _id: string; title: string };
  reportedBy: User;
  reason: string;
  createdAt: string;
  status: 'pending' | 'resolved';
}

export interface CommunityPost {
  _id: string;
  title: string;
  content: string;
  author: User;
  createdAt: string;
  status: 'draft' | 'published';
}

export interface CommunityData {
  moderationComments: ModerationComment[];
  reportedComments: ReportedComment[];
  communityPosts: CommunityPost[];
}

// Content
export interface UploadVideo {
  _id: string;
  title: string;
  status: 'scheduled' | 'published' | 'draft';
  thumbnailUrl?: string;
  createdAt: string;
}

export interface ThumbnailSlot {
  _id: string;
  videoId?: string;
  thumbnailUrl?: string;
  status: 'empty' | 'uploaded';
}

export interface ScheduledPost {
  _id: string;
  title: string;
  content: string;
  scheduledFor: string;
  status: 'scheduled' | 'published';
}

export interface ContentData {
  uploads: UploadVideo[];
  thumbnails: ThumbnailSlot[];
  scheduledPosts: ScheduledPost[];
}

// Settings
export interface ChannelCustomization {
  channelName: string;
  bio: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
}

export interface PaymentMethod {
  _id: string;
  type: 'paypal' | 'bank' | 'crypto';
  identifier: string; // email for PayPal, account number for bank, wallet address for crypto
  isDefault: boolean;
  createdAt: string;
}

export interface PolicyGuidelines {
  communityGuidelines: string;
  monetizationPolicies: string;
  copyrightPolicies: string;
  lastUpdated: string;
}

export interface AdminSettingsData {
  channelCustomization: ChannelCustomization;
  paymentMethods: PaymentMethod[];
  policyGuidelines: PolicyGuidelines;
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
