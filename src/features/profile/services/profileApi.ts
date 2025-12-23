// src/features/profile/services/profileApi.ts
import { api } from '@/services/api';
import type {
  Profile,
  UpdateProfileDto,
  CompatibilityResult,
  ProfilePhoto,
  ProfilePhotoLike,
  ProfilePhotoComment,
  CreateProfilePhotoCommentDto,
  BasicUserInfo,
} from '@/types/profile.types';
import type { NatalChartData } from '../hooks/useProfile';

// --- Funções de Perfil ---

// Função Get My Profile
export const getMyProfile = async (): Promise<Profile> => {
  const { data } = await api.get<Profile>('/profile/me');
  return data;
};

/**
 * Busca o número do dia pessoal
 */
export const getPersonalDayVibration = async (): Promise<{ dayNumber: number }> => {
  const { data } = await api.get<{ dayNumber: number }>(
    '/profile/me/personal-day',
  );
  return data;
};

// Função Update Profile
export const updateProfile = async (
  profileData: UpdateProfileDto
): Promise<Profile> => {
  const { data } = await api.patch<Profile>('/profile', profileData);
  return data;
};

// Função Update Avatar
export const updateAvatar = async (
  avatarFile: File,
  fileName: string
): Promise<Profile> => {
  const formData = new FormData();
  formData.append('file', avatarFile, fileName);
  const { data } = await api.post<Profile>('/profile/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// Função Get Public Profile
export const getPublicProfile = async (
  userId: string
): Promise<Profile & { compatibility: CompatibilityResult | null }> => {
  const { data } = await api.get<Profile & {
    compatibility: CompatibilityResult | null;
  }>(`/profile/${userId}`);
  return data;
};

// --- SEGURANÇA / CONTA ---

/**
 * Solicita a exclusão da conta (Soft Delete / Quarentena)
 * Rota: DELETE /users/me
 */
export const deleteMyAccount = async (): Promise<void> => {
  await api.delete('/users/me');
};

// --- GALERIA ---

export const getGalleryPhotos = async (userId: string): Promise<ProfilePhoto[]> => {
  const url = `/profile/${userId}/gallery`;
  const { data } = await api.get<ProfilePhoto[]>(url);
  return data;
};

export const addPhotoToGallery = async (
  photoFile: File,
  fileName: string
): Promise<ProfilePhoto> => {
  const formData = new FormData();
  formData.append('file', photoFile, fileName);
  const { data } = await api.post<ProfilePhoto>('/profile/gallery', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

export const deletePhotoFromGallery = async (photoId: string): Promise<void> => {
  await api.delete(`/profile/gallery/${photoId}`);
};

export const likeGalleryPhoto = async (
  photoId: string
): Promise<ProfilePhotoLike> => {
  const { data } = await api.post<ProfilePhotoLike>(
    `/profile/gallery/${photoId}/like`
  );
  return data;
};

export const unlikeGalleryPhoto = async (photoId: string): Promise<void> => {
  await api.delete(`/profile/gallery/${photoId}/like`);
};

export const commentOnGalleryPhoto = async (
  photoId: string,
  commentData: CreateProfilePhotoCommentDto
): Promise<ProfilePhotoComment> => {
  const { data } = await api.post<ProfilePhotoComment>(
    `/profile/gallery/${photoId}/comment`,
    commentData
  );
  return data;
};

export const getGalleryPhotoComments = async (
  photoId: string
): Promise<ProfilePhotoComment[]> => {
  const { data } = await api.get<ProfilePhotoComment[]>(
    `/profile/gallery/${photoId}/comments`
  );
  return data;
};


// --- SOCIAL (Follow/Block) ---

export const followUser = async (userId: string): Promise<void> => {
  await api.post(`/social/follow/${userId}`);
};

export const unfollowUser = async (userId: string): Promise<void> => {
  await api.delete(`/social/unfollow/${userId}`);
};

export const getFollowers = async (userId: string): Promise<BasicUserInfo[]> => {
  const { data } = await api.get<BasicUserInfo[]>(`/social/${userId}/followers`);
  return data;
};

export const getFollowing = async (userId: string): Promise<BasicUserInfo[]> => {
  const { data } = await api.get<BasicUserInfo[]>(`/social/${userId}/following`);
  return data;
};

export const blockUser = async (userId: string): Promise<void> => {
  await api.post(`/social/block/${userId}`);
};

export const unblockUser = async (userId: string): Promise<void> => {
  await api.delete(`/social/unblock/${userId}`);
};

export const getMyBlockedList = async (): Promise<BasicUserInfo[]> => {
  const { data } = await api.get<BasicUserInfo[]>('/social/block/list');
  return data;
};

// --- LIKES (Discovery) ---

export const likeUser = async (userId: string): Promise<void> => {
  await api.post(`/social/like/${userId}`);
};

export const getLikesReceived = async (): Promise<BasicUserInfo[]> => {
  const { data } = await api.get<BasicUserInfo[]>('/social/likes/received');
  return data;
};

export const getUnreadLikesCount = async (): Promise<{ count: number }> => {
  const { data } = await api.get<{ count: number }>('/social/likes/unread-count');
  return data;
};

export const markLikesAsRead = async (): Promise<{ updatedCount: number }> => {
  const { data } = await api.post<{ updatedCount: number }>('/social/likes/mark-as-read');
  return data;
};

// --- ASTROLOGIA ---

export const getMyNatalChart = async (): Promise<NatalChartData> => {
  const { data } = await api.get<NatalChartData>('/astrology/my-natal-chart');
  return data;
};