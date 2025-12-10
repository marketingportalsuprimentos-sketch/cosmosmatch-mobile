import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getMyProfile, 
  updateProfile, 
  getPublicProfile,
  getGalleryPhotos,
  addPhotoToGallery,
  deletePhotoFromGallery,
  likeGalleryPhoto,
  unlikeGalleryPhoto,
  commentOnGalleryPhoto,
  getGalleryPhotoComments,
  getUnreadLikesCount, 
  markLikesAsRead
} from '../services/profileApi';
import { UpdateProfileDto, CreateProfilePhotoCommentDto, ProfilePhoto } from '../types/profile.types';

// --- PROFILE CORE ---

export const useGetMyProfile = () => {
  return useQuery({
    queryKey: ['myProfile'],
    queryFn: getMyProfile,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileDto) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
};

export const useGetPublicProfile = (userId: string) => {
  return useQuery({
    queryKey: ['publicProfile', userId],
    queryFn: () => getPublicProfile(userId),
    enabled: !!userId,
  });
};

// --- GALLERY ---

export const useGetGalleryPhotos = (userId: string) => {
  return useQuery({
    queryKey: ['galleryPhotos', userId],
    queryFn: () => getGalleryPhotos(userId),
    enabled: !!userId,
  });
};

export const useAddPhotoToGallery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ photoFile, fileName }: { photoFile: any; fileName: string }) => 
      addPhotoToGallery(photoFile, fileName),
    onSuccess: () => {
      // Invalida qualquer lista de galeria para garantir atualização
      queryClient.invalidateQueries({ queryKey: ['galleryPhotos'] });
      queryClient.invalidateQueries({ queryKey: ['myProfile'] });
    },
  });
};

export const useDeletePhotoFromGallery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => deletePhotoFromGallery(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryPhotos'] });
    },
  });
};

export const useLikeGalleryPhoto = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ photoId, isLiked }: { photoId: string; isLiked: boolean }) => 
      isLiked ? unlikeGalleryPhoto(photoId) : likeGalleryPhoto(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['galleryPhotos'] });
    },
  });
};

// --- COMMENTS (ATUALIZADO PARA NÃO ZERAR CONTAGEM) ---

export const useGetGalleryPhotoComments = (photoId: string) => {
  return useQuery({
    queryKey: ['galleryPhotoComments', photoId],
    queryFn: () => getGalleryPhotoComments(photoId),
    enabled: !!photoId,
  });
};

export const useCommentOnGalleryPhoto = (targetUserId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ photoId, content }: { photoId: string; content: string }) => {
      const dto: CreateProfilePhotoCommentDto = { content };
      return commentOnGalleryPhoto(photoId, dto);
    },
    onSuccess: (_, { photoId }) => {
      // 1. Atualiza a lista de comentários interna (dentro do modal)
      queryClient.invalidateQueries({ queryKey: ['galleryPhotoComments', photoId] });
      
      // 2. ATUALIZAÇÃO MANUAL DA CONTAGEM (CORREÇÃO)
      // Procura em TODAS as listas de galeria carregadas no cache
      // e incrementa o contador da foto específica manualmente.
      queryClient.setQueriesData({ queryKey: ['galleryPhotos'] }, (oldData: ProfilePhoto[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(photo => 
          photo.id === photoId 
            ? { ...photo, commentsCount: (photo.commentsCount || 0) + 1 }
            : photo
        );
      });

      // 3. Força um refetch no servidor para garantir consistência
      if (targetUserId) {
        queryClient.invalidateQueries({ queryKey: ['galleryPhotos', targetUserId] });
      } else {
        // Se não tiver targetUserId, invalida todas as galerias por segurança
        queryClient.invalidateQueries({ queryKey: ['galleryPhotos'] });
      }
    },
  });
};

// --- LIKES NOTIFICATIONS ---

export const useGetUnreadLikesCount = () => {
  return useQuery({
    queryKey: ['unreadLikesCount'],
    queryFn: getUnreadLikesCount,
    refetchInterval: 10000, 
  });
};

export const useMarkLikesAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markLikesAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unreadLikesCount'] });
    },
  });
};