// src/features/feed/services/feedApi.ts

import { api } from '@/services/api'; 
import { FeedDeck, CreatedPost, PostComment, ReportReason } from '@/types/feed.types';

// Interfaces locais para payload
interface CreateCommentData { content: string; }
interface ReportPostData { reason: ReportReason; }

// 1. Feed e Posts
export const getFeed = async (params: { skip: number; take: number }): Promise<FeedDeck[]> => {
  try {
    const { data } = await api.get<FeedDeck[]>('/post/feed', { 
      params: { 
        skip: params.skip, 
        take: params.take 
      } 
    });

    if (data && data.length > 0) {
       console.log('--- DEBUG FEED ---');
       console.log('Autor do primeiro post:', data[0].author.name);
       console.log('Eu sigo ele? (isFollowedByMe):', data[0].author.isFollowedByMe); 
       console.log('------------------');
    }

    return data;
  } catch (error: any) {
    if (error?.response?.status === 404) return [];
    throw error;
  }
};

export const createPost = async (formData: FormData): Promise<CreatedPost> => {
  const { data } = await api.post<CreatedPost>('/post', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const deletePost = async (postId: string): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete(`/post/${postId}`);
  return response.data;
};

// 2. Interações (Like/Comment)
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

/**
 * CORREÇÃO: Adicionada a função deleteComment que estava faltando e causando erro no Hook.
 * Esta função chama a rota DELETE definida no seu PostController.
 */
export const deleteComment = async (commentId: string): Promise<{ success: boolean }> => {
  const { data } = await api.delete<{ success: boolean }>(`/post/comment/${commentId}`);
  return data;
};

// 3. Denúncias e Moderação
export const reportPost = async (postId: string, payload: ReportPostData) => {
  const { data } = await api.post<{ success: boolean }>(`/post/${postId}/report`, payload);
  return data;
};

export const restorePost = async (postId: string) => {
  const { data } = await api.patch<{ success: boolean }>(`/post/${postId}/restore`);
  return data;
};