// mobile/src/hooks/useGalleryHooks.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { 
  ProfilePhotoComment, 
  CreateCommentDto,
  ProfilePhoto,
  User // Necessário para o placeholder otimista
} from '../types/profile.types';
import { Alert } from 'react-native'; // Usamos Alert no mobile

// --- 1. QUERY: Buscar Comentários de uma Foto ---
export const useGetGalleryPhotoComments = (photoId: string) => {
  return useQuery<ProfilePhotoComment[]>({
    queryKey: ['galleryPhotoComments', photoId],
    queryFn: async () => {
      // MOCK: Substitua por await api.get(`/gallery/${photoId}/comments`);
      const mockComments: ProfilePhotoComment[] = [
        // Mock de comentários para a UI
        { id: 'c1', text: 'Excelente foto!', photoId, createdAt: new Date().toISOString(), user: { id: 'u1', name: 'Lua', profile: { imageUrl: 'https://i.pravatar.cc/300?img=5' } } },
      ];
      return new Promise(resolve => setTimeout(() => resolve(mockComments), 500));
    },
  });
};


// --- 2. MUTATION: Comentar uma Foto ---
export const useCommentOnGalleryPhoto = (photoId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCommentDto) => {
      // MOCK: Substitua por await api.post(`/gallery/${photoId}/comments`, data)
      const response = { 
          id: `new-${Date.now()}`, 
          text: data.text, 
          photoId, 
          createdAt: new Date().toISOString(), 
          user: queryClient.getQueryData(['me']) as User 
      } as ProfilePhotoComment;
      return new Promise(resolve => setTimeout(() => resolve(response), 500));
    },
    
    onMutate: async (newComment) => {
      await queryClient.cancelQueries({ queryKey: ['galleryPhotoComments', photoId] });

      const currentUser = queryClient.getQueryData<User>(['me']); 
      if (!currentUser) return;
      
      const newCommentPlaceholder: ProfilePhotoComment = {
          id: `temp-${Date.now()}`,
          text: newComment.text,
          photoId: photoId,
          createdAt: new Date().toISOString(),
          user: { 
              id: currentUser.id, 
              name: currentUser.name, 
              profile: { imageUrl: currentUser.profile?.imageUrl || null } 
          }
      };

      queryClient.setQueryData<ProfilePhotoComment[]>(
        ['galleryPhotoComments', photoId],
        (old) => old ? [...old, newCommentPlaceholder] : [newCommentPlaceholder]
      );

      return { tempId: newCommentPlaceholder.id };
    },

    onSuccess: (data, variables, context) => {
        // Substitui o placeholder pelo dado real
        queryClient.setQueryData<ProfilePhotoComment[]>(
            ['galleryPhotoComments', photoId],
            (old) => old?.map(c => c.id === context?.tempId ? data : c)
        );
        
        // Invalida a galeria para atualizar a contagem de comentários (opcional)
        // Você precisará da prop `profileUserId` aqui, que viria do hook.
        // Assumindo que o profileUserId é `data.user.id` (dono do comentário)
        queryClient.invalidateQueries({ queryKey: ['galleryPhotos', data.user.id] });
    },

    onError: (error, variables, context) => {
        queryClient.setQueryData<ProfilePhotoComment[]>(
            ['galleryPhotoComments', photoId],
            (old) => old?.filter(c => c.id !== context?.tempId)
        );
        Alert.alert('Erro', 'Não foi possível enviar o comentário.');
    },
  });
};