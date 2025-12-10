import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { 
  ProfilePhotoComment, 
  ProfilePhoto // Certifique-se que este tipo existe em profile.types
} from '../types/profile.types';
import { Alert, Platform } from 'react-native';

// --- 1. QUERY: Buscar Fotos da Galeria (O QUE ESTAVA FALTANDO) ---
export const useGetGalleryPhotos = (userId?: string) => {
  return useQuery<ProfilePhoto[]>({
    // A chave inclui o userId. Se for undefined (meu perfil), a chave é ['galleryPhotos', undefined]
    queryKey: ['galleryPhotos', userId],
    queryFn: async () => {
      // Se tiver userId, busca a galeria daquela pessoa. Se não, busca a minha (/profile/gallery).
      // NOTA: Ajuste a rota `/profile/${userId}/gallery` se o seu backend usar outro padrão (ex: /users/${userId}/gallery)
      const endpoint = userId 
        ? `/profile/${userId}/gallery` 
        : '/profile/gallery';
      
      const { data } = await api.get(endpoint);
      return data;
    },
  });
};

// --- 2. QUERY: Buscar Comentários de uma Foto ---
export const useGetGalleryPhotoComments = (photoId: string) => {
  return useQuery<ProfilePhotoComment[]>({
    queryKey: ['galleryPhotoComments', photoId],
    queryFn: async () => {
      const { data } = await api.get(`/profile/gallery/photo/${photoId}/comments`);
      return data;
    },
    enabled: !!photoId,
  });
};

// --- 3. MUTATION: Comentar uma Foto ---
export const useCommentOnGalleryPhoto = (targetUserId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ photoId, content }: { photoId: string; content: string }) => {
      const { data } = await api.post(`/profile/gallery/photo/${photoId}/comment`, { content });
      return data;
    },
    
    onSuccess: (newComment, variables) => {
        // Atualiza a lista de comentários localmente
        queryClient.setQueryData<ProfilePhotoComment[]>(
            ['galleryPhotoComments', variables.photoId],
            (old) => old ? [...old, newComment] : [newComment]
        );

        // Atualiza a contagem de comentários na lista de fotos
        // Invalida tanto a minha galeria quanto a de outros para garantir
        queryClient.invalidateQueries({ queryKey: ['galleryPhotos'] }); 
    },

    onError: (error: any) => {
        const message = error.response?.data?.message || 'Erro ao enviar comentário.';
        Alert.alert('Erro', message);
    },
  });
};

// --- 4. MUTATION: Adicionar Foto à Galeria ---
export const useAddGalleryPhoto = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (fileUri: string) => {
            const formData = new FormData();
            const uriParts = fileUri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            
            let mimeType = 'image/jpeg';
            if (fileType.toLowerCase() === 'png') mimeType = 'image/png';
            
            const uri = Platform.OS === 'android' ? fileUri : fileUri.replace('file://', '');

            formData.append('file', {
                uri: uri,
                name: `photo.${fileType}`,
                type: mimeType,
            } as any);

            const { data } = await api.post('/profile/gallery', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return data;
        },
        onSuccess: () => {
            // Atualiza a MINHA galeria
            queryClient.invalidateQueries({ queryKey: ['galleryPhotos'] });
            // Atualiza contagem no perfil
            queryClient.invalidateQueries({ queryKey: ['myProfile'] });
        },
        onError: (error: any) => {
            console.error("Erro no upload:", error);
            throw error;
        }
    });
};