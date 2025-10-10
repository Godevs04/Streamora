import api from './api';
import config from '../constants/config';
import { ApiResponse, Comment, PaginationParams, Video, VideoUpload, VideosApiResponse } from '../types';

/**
 * Get videos with pagination
 * @param params - Pagination parameters
 * @returns Promise with videos response
 */
export const getVideos = async (params: PaginationParams & { type?: string; search?: string } = {}): Promise<VideosApiResponse> => {
  const { page = config.PAGINATION.DEFAULT_PAGE, limit = config.PAGINATION.DEFAULT_LIMIT, type, search } = params;
  const queryParams: any = { page, limit };
  if (type) {
    queryParams.type = type;
  }
  if (search) {
    queryParams.search = search;
  }
  return api.get(config.API.ENDPOINTS.VIDEOS.LIST, { params: queryParams });
};

/**
 * Get video by ID
 * @param id - Video ID
 * @returns Promise with video response
 */
export const getVideoById = async (id: string): Promise<ApiResponse<Video>> => {
  return api.get(config.API.ENDPOINTS.VIDEOS.GET_BY_ID(id));
};

/**
 * Upload a new video
 * @param videoData - Video data and file
 * @returns Promise with video response
 */
export const uploadVideo = async (videoData: VideoUpload): Promise<ApiResponse<Video>> => {
  const formData = new FormData();
  
  // Append text fields
  formData.append('title', videoData.title);
  
  if (videoData.description) {
    formData.append('description', videoData.description);
  }
  
  if (videoData.tags && videoData.tags.length > 0) {
    formData.append('tags', JSON.stringify(videoData.tags));
  }
  
  // Add thumbnail aspect ratio if provided
  if (videoData.thumbnailAspectRatio) {
    formData.append('thumbnailAspectRatio', videoData.thumbnailAspectRatio);
  }
  
  // Add duration if provided
  if (videoData.duration) {
    formData.append('duration', videoData.duration.toString());
  }
  
  // Add video type if provided
  if (videoData.type) {
    formData.append('type', videoData.type);
  }
  
  // Add scheduling information if provided
  if (videoData.isScheduled) {
    formData.append('isScheduled', 'true');
    if (videoData.scheduledDate) {
      formData.append('scheduledDate', videoData.scheduledDate.toISOString());
    }
  }
  
  // If we have a video URI (from image picker)
  if (videoData.videoUri) {
    const uriParts = videoData.videoUri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('video', {
      uri: videoData.videoUri,
      name: `video.${fileType}`,
      type: `video/${fileType}`,
    } as any);
  } else if (videoData.videoUrl) {
    // If we have a video URL (from external source)
    formData.append('videoUrl', videoData.videoUrl);
  } else {
    throw new Error('Video file or URL is required');
  }
  
  // Handle thumbnail
  if (videoData.thumbnailUri) {
    const uriParts = videoData.thumbnailUri.split('.');
    const fileType = uriParts[uriParts.length - 1] || 'jpg';
    
    formData.append('thumbnail', {
      uri: videoData.thumbnailUri,
      name: `thumbnail.${fileType}`,
      type: `image/${fileType}`,
    } as any);
  } else if (videoData.thumbnailUrl) {
    formData.append('thumbnailUrl', videoData.thumbnailUrl);
  }
  
  return api.post(config.API.ENDPOINTS.VIDEOS.CREATE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Toggle like/unlike a video
 * @param id - Video ID
 * @returns Promise with like response
 */
export const toggleLikeVideo = async (id: string): Promise<ApiResponse<{ liked: boolean, likesCount: number }>> => {
  return api.put(config.API.ENDPOINTS.VIDEOS.LIKE(id));
};

/**
 * Publish a scheduled video immediately
 * @param id - Video ID
 * @returns Promise with publish response
 */
export const publishScheduledVideo = async (id: string): Promise<ApiResponse<Video>> => {
  return api.put(config.API.ENDPOINTS.VIDEOS.PUBLISH(id));
};

/**
 * Increment video view count
 * @param id - Video ID
 * @returns Promise with view response
 */
export const incrementVideoView = async (id: string): Promise<ApiResponse<{ views: number }>> => {
  return api.put(config.API.ENDPOINTS.VIDEOS.VIEW(id));
};

/**
 * Get comments for a video
 * @param videoId - Video ID
 * @param params - Pagination parameters
 * @returns Promise with comments response
 */
export const getVideoComments = async (
  videoId: string,
  params: PaginationParams = {}
): Promise<ApiResponse<Comment[]>> => {
  const { page = config.PAGINATION.DEFAULT_PAGE, limit = config.PAGINATION.DEFAULT_LIMIT, sort = 'newest' } = params as any;
  return api.get(config.API.ENDPOINTS.VIDEOS.COMMENTS.LIST(videoId), { params: { page, limit, sort } });
};

/**
 * Add a comment to a video
 * @param videoId - Video ID
 * @param text - Comment text
 * @returns Promise with comment response
 */
export const addComment = async (videoId: string, text: string): Promise<ApiResponse<Comment>> => {
  return api.post(config.API.ENDPOINTS.VIDEOS.COMMENTS.CREATE(videoId), { text });
};

/**
 * Delete a comment
 * @param commentId - Comment ID
 * @returns Promise with success response
 */
export const deleteComment = async (commentId: string): Promise<ApiResponse<{ message: string }>> => {
  return api.delete(config.API.ENDPOINTS.VIDEOS.COMMENTS.DELETE(commentId));
};

/**
 * Toggle like/unlike a comment
 */
export const toggleLikeComment = async (commentId: string): Promise<ApiResponse<{ liked: boolean, likesCount: number }>> => {
  return api.put(config.API.ENDPOINTS.VIDEOS.COMMENTS.LIKE(commentId));
};
