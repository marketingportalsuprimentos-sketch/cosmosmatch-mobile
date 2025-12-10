import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Keyboard, Platform } from 'react-native'; 
import * as profileApi from '../services/profileApi'; 
import { chatApi } from '../../chat/services/chatApi'; 
import { api } from '../../../services/api';
import { toast } from '../../../lib/toast';
import { UpdateProfileDto } from '../../../types/profile.types';

// --- LEITURA (Queries) ---

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
      const endpoint = userId 
        ? `/profile/${userId}/gallery` 
        : '/profile/gallery';
      
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

// --- EDIÇÃO (Mutations) ---

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
      formData.append('file', { uri: uri, name: `avatar.${fileType}`, type: mimeType });

      const response = await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
    onError: (error) => {
      console.error('Erro avatar:', error);
      toast.error('Erro ao enviar foto.');
    }
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
      
      let mimeType = 'image/jpeg';
      if (fileType && fileType.toLowerCase() === 'png') mimeType = 'image/png';

      const uri = Platform.OS === 'android' ? imageUri : imageUri.replace('file://', '');

      // @ts-ignore
      formData.append('file', { 
        uri: uri, 
        name: `photo.${fileType || 'jpg'}`, 
        type: mimeType 
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
    },
    onError: (error) => {
      console.error('Erro upload galeria:', error);
      toast.error('Erro ao enviar foto.');
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

export const useLikeGalleryPhoto = (targetUserId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.likeGalleryPhoto,
    onSuccess: (_, photoId) => {
        queryClient.setQueriesData({ queryKey: ['galleryPhotos'] }, (oldData: any) => {
            if (!Array.isArray(oldData)) return oldData;
            return oldData.map((photo: any) => {
                if (photo.id === photoId) {
                    return { 
                        ...photo, 
                        isLikedByMe: true, 
                        likesCount: (photo.likesCount || 0) + 1 
                    };
                }
                return photo;
            });
        });
    }
  });
};

export const useUnlikeGalleryPhoto = (targetUserId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.unlikeGalleryPhoto,
    onSuccess: (_, photoId) => {
        queryClient.setQueriesData({ queryKey: ['galleryPhotos'] }, (oldData: any) => {
            if (!Array.isArray(oldData)) return oldData;
            return oldData.map((photo: any) => {
                if (photo.id === photoId) {
                    return { 
                        ...photo, 
                        isLikedByMe: false, 
                        likesCount: Math.max(0, (photo.likesCount || 0) - 1) 
                    };
                }
                return photo;
            });
        });
    }
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
      const commentResponse = await profileApi.commentOnGalleryPhoto(photoId, { content });
      
      if (targetUserId) {
          try {
              await chatApi.createOrGetConversation({
                  targetUserId,
                  content: `Comentou na sua foto: "${content}"` 
              });
          } catch (error: any) {
              if (error?.response?.status === 402) throw error;
              console.log("Erro silencioso ao enviar DM:", error);
          }
      }
      return commentResponse;
    },
    
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['galleryComments', variables.photoId] });
      
      queryClient.setQueriesData({ queryKey: ['galleryPhotos'] }, (oldData: any) => {
          if (!Array.isArray(oldData)) return oldData;
          return oldData.map((photo: any) => {
              if (photo.id === variables.photoId) {
                  return { ...photo, commentsCount: (photo.commentsCount || 0) + 1 };
              }
              return photo;
          });
      });
      
      if (targetUserId) {
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
      }
    },

    onError: (error: any) => {
        Keyboard.dismiss(); 
        if (error?.response?.status === 402) {
            navigation.navigate('Premium');
        }
    }
  });
};

// --- NOVO: DELETE COMMENT ---
export const useDeleteGalleryPhotoComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      // Endpoint padrão para deletar comentário
      const { data } = await api.delete(`/profile/gallery/comments/${commentId}`);
      return data;
    },
    onSuccess: () => {
      // Atualiza a lista de comentários para sumir o item deletado
      queryClient.invalidateQueries({ queryKey: ['galleryComments'] });
      // Atualiza a contagem na lista de fotos
      queryClient.invalidateQueries({ queryKey: ['galleryPhotos'] });
      toast.success("Comentário apagado");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Erro ao apagar comentário");
    }
  });
};

// --- SOCIAL ---

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

export const useFollowUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.followUser,
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['following'] }); 
      queryClient.invalidateQueries({ queryKey: ['publicProfile', userId] });
      toast.success('A seguir!');
    }
  });
};

export const useUnfollowUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.unfollowUser,
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: ['followers', userId] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['publicProfile', userId] });
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
      queryClient.invalidateQueries({ queryKey: ['discoveryQueue'] });
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
      toast.success('Usuário desbloqueado');
    }
  });
};

// --- NOTIFICAÇÕES / LIKES RECEBIDOS ---

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
    refetchOnWindowFocus: true,
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