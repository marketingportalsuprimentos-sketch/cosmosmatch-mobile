import { api } from '../../../services/api';

export enum MediaType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
}

export interface FeedPost {
  id: string;
  content: string | null;
  imageUrl: string;
  mediaType: MediaType;
  videoDuration: number | null;
  createdAt: string;
  expiresAt: string;
  authorId: string;
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean; 
}

export interface FeedDeck {
  author: { id: string; name: string; profile?: { imageUrl?: string | null } };
  posts: FeedPost[];
}

export interface PostComment {
  id: string;
  content: string;
  userId: string;
  postId: string;
  createdAt: string;
  user: { id: string; name: string; profile?: { imageUrl?: string | null } };
}

interface CreateCommentData { content: string; }

export const getFeedPage = async (pageParam = 1): Promise<FeedDeck | null> => {
  try {
    const { data } = await api.get<FeedDeck | null>(`/post/feed?page=${pageParam}`);
    return data;
  } catch (error: any) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
};

export const createPost = async (formData: FormData): Promise<any> => {
  const { data } = await api.post('/post', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const likePost = async (postId: string) => {
  const { data } = await api.post<{ success: boolean }>(`/post/${postId}/like`);
  return data;
};

export const unlikePost = async (postId: string) => {
  const { data } = await api.delete<{ success: boolean }>(`/post/${postId}/like`);
  return data;
};

export const commentOnPost = async (postId: string, payload: CreateCommentData) => {
  const { data } = await api.post<PostComment>(`/post/${postId}/comment`, payload);
  return data;
};

export const getPostComments = async (postId: string) => {
  const { data } = await api.get<PostComment[]>(`/post/${postId}/comments`);
  return data;
};

export const deletePost = async (postId: string) => {
  const response = await api.delete(`/post/${postId}`);
  return response.data;
};