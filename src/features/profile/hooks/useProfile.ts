import { useQuery, useMutation, useQueryClient, InfiniteData } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Keyboard, Platform } from 'react-native'; 
import * as profileApi from '../services/profileApi'; 
import { chatApi } from '../../chat/services/chatApi'; 
import { api } from '../../../services/api';
import { toast } from '../../../lib/toast';
import { UpdateProfileDto } from '../../../types/profile.types';
import { useAuth } from '@/contexts/AuthContext';

// --- LEITURA (Queries) ---

/**
 * Hook para obter o perfil do utilizador logado.
 * Certifica-te de que este nome é exatamente o que chamas nos teus ecrãs.
 */
export const useGetMyProfile = () => {
  return useQuery({
    queryKey: ['myProfile'],
    queryFn: profileApi.getMyProfile, 
  });
};

export const useGetPublicProfile = (userId?: string) => {
  return useQuery({
    queryKey: ['publicProfile', userId],
    queryFn: () => profileApi.getPublicProfile(userId!),
    enabled: !!userId,
  });
};

export const useGetGalleryPhotos = (userId?: string) => {
  return useQuery({
    queryKey: ['galleryPhotos', userId],
    queryFn: async () => {
      const endpoint = userId ? `/profile/${userId}/gallery` : '/profile/gallery';
      const { data } = await api.get(endpoint);
      return data;
    },
  });
};

export const useGetPersonalDayVibration = () => {
  return useQuery({
    queryKey: ['personalDay'],
    queryFn: profileApi.getPersonalDayVibration,
  });
};

// --- SEGUIDORES / SOCIAL ---

export const useGetFollowers = (userId?: string) => {
  return useQuery({
    queryKey: ['followers', userId],
    queryFn: () => profileApi.getFollowers(userId!),
    enabled: !!userId,
  });
};

export const useGetFollowing = (userId?: string) => {
  return useQuery({
    queryKey: ['following', userId],
    queryFn: () => profileApi.getFollowing(userId!),
    enabled: !!userId,
  });
};

// --- EDIÇÃO DE PERFIL ---

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateProfileDto) => {
      const response = await api.patch('/profile', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      toast.success('Perfil atualizado!');
    },
    onError: (error) => {
      console.error('Erro update profile:', error);
      toast.error('Erro ao atualizar perfil.');
    }
  });
};

export const useUpdateAvatar = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageUri: string) => {
      const formData = new FormData();
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';
      const uri = Platform.OS === 'android' ? imageUri : imageUri.replace('file://', '');
      // @ts-ignore
      formData.append('file', { uri, name: `avatar.${fileType}`, type: mimeType });
      const response = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['myProfile'] })
  });
};

// --- GALERIA (Upload e Ações) ---

export const useAddPhotoToGallery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (imageUri: string) => {
      const formData = new FormData();
      const uriParts = imageUri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      const uri = Platform.OS === 'android' ? imageUri : imageUri.replace('file://', '');
      // @ts-ignore
      formData.append('file', { 
        uri, 
        name: `photo.${fileType || 'jpg'}`, 
        type: `image/${fileType === 'png' ? 'png' : 'jpeg'}` 
      });
      const { data } = await api.post('/profile/gallery', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryPhotos'] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      toast.success('Foto adicionada!');
    }
  });
};

export const useDeletePhotoFromGallery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.deletePhotoFromGallery,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryPhotos'] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
      toast.success('Foto removida.');
    }
  });
};

// --- INTERAÇÕES DA GALERIA ---

export const useLikeGalleryPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.likeGalleryPhoto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['galleryPhotos'] })
  });
};

export const useUnlikeGalleryPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.unlikeGalleryPhoto,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['galleryPhotos'] })
  });
};

export const useGetGalleryPhotoComments = (photoId: string) => {
  return useQuery({
    queryKey: ['galleryComments', photoId],
    queryFn: () => profileApi.getGalleryPhotoComments(photoId),
    enabled: !!photoId, 
  });
};

export const useCommentOnGalleryPhoto = (targetUserId?: string) => {
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>(); 
  
  return useMutation({
    mutationFn: async ({ photoId, content }: { photoId: string, content: string }) => {
      const response = await profileApi.commentOnGalleryPhoto(photoId, { content });
      if (targetUserId) {
          try {
              await chatApi.createOrGetConversation({
                  targetUserId,
                  content: `Comentou na sua foto: "${content}"` 
              });
          } catch (e) { console.log("Erro silencioso DM:", e); }
      }
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['galleryComments', variables.photoId] });
      queryClient.invalidateQueries({ queryKey: ['galleryPhotos'] });
    },
    onError: (error: any) => {
        if (error?.response?.status === 402) navigation.navigate('Premium');
    }
  });
};

/**
 * Hook para deletar comentário.
 * Alinhado com a rota do teu Backend.
 */
export const useDeleteGalleryPhotoComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId }: { photoId: string; commentId: string }) => 
      profileApi.deleteGalleryPhotoComment(commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['galleryComments', variables.photoId] });
      queryClient.invalidateQueries({ queryKey: ['galleryPhotos'] });
      toast.success('Comentário removido.');
    },
    onError: (error: any) => {
      console.error('Erro ao deletar comentário:', error);
      const msg = error?.response?.data?.message || 'Erro ao remover comentário.';
      toast.error(msg);
    }
  });
};

// --- FOLLOW / UNFOLLOW ---

export const useFollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.followUser,
    onMutate: async (targetUserId: string) => {
      const feedKey = ['feed'];
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previousFeed = queryClient.getQueryData<InfiniteData<any>>(feedKey);

      queryClient.setQueryData<InfiniteData<any>>(feedKey, (oldFeed) => {
        if (!oldFeed || !oldFeed.pages) return oldFeed;
        return {
          ...oldFeed,
          pages: oldFeed.pages.map(page => {
             if (!page || !page.posts) return page;
             return {
                ...page,
                posts: page.posts.map((p: any) => 
                   p.authorId === targetUserId ? { ...p, author: { ...p.author, isFollowedByMe: true } } : p
                )
             };
          })
        };
      });
      return { previousFeed };
    },
    onSettled: (_, __, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['following'] }); 
      queryClient.invalidateQueries({ queryKey: ['followers'] }); 
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['publicProfile', targetUserId] });
      toast.success('A seguir!');
    }
  });
};

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.unfollowUser,
    onMutate: async (targetUserId: string) => {
      const feedKey = ['feed'];
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previousFeed = queryClient.getQueryData<InfiniteData<any>>(feedKey);

      queryClient.setQueryData<InfiniteData<any>>(feedKey, (oldFeed) => {
        if (!oldFeed || !oldFeed.pages) return oldFeed;
        return {
          ...oldFeed,
          pages: oldFeed.pages.map(page => {
             if (!page || !page.posts) return page;
             return {
                ...page,
                posts: page.posts.map((p: any) => 
                   p.authorId === targetUserId ? { ...p, author: { ...p.author, isFollowedByMe: false } } : p
                )
             };
          })
        };
      });
      return { previousFeed };
    },
    onSettled: (_, __, targetUserId) => {
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] }); 
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['publicProfile', targetUserId] });
    }
  });
};

// --- BLOQUEIOS ---

export const useGetBlockedUsers = () => {
  return useQuery({
    queryKey: ['blockedUsers'],
    queryFn: profileApi.getMyBlockedList,
  });
};

export const useBlockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.blockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Usuário bloqueado');
    }
  });
};

export const useUnblockUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.unblockUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      toast.success('Usuário desbloqueado');
    }
  });
};

// --- NOTIFICAÇÕES / LIKES ---

export const useGetLikesReceived = () => {
  return useQuery({
    queryKey: ['likesReceived'],
    queryFn: profileApi.getLikesReceived
  });
};

export const useGetUnreadLikesCount = () => {
  return useQuery({
    queryKey: ['unreadLikesCount'],
    queryFn: profileApi.getUnreadLikesCount,
    refetchInterval: 3000, 
    staleTime: 0, 
  });
};

export const useMarkLikesAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.markLikesAsRead,
    onMutate: async () => {
       await queryClient.cancelQueries({ queryKey: ['likesReceived'] });
       queryClient.setQueryData(['unreadLikesCount'], { count: 0 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['likesReceived'] });
      queryClient.invalidateQueries({ queryKey: ['unreadLikesCount'] });
    }
  });
};