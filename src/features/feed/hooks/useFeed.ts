import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
  type InfiniteData,
} from '@tanstack/react-query';
import { Alert, Keyboard } from 'react-native'; // <--- ADICIONADO Keyboard
import { useNavigation } from '@react-navigation/native';
import * as feedApi from '../services/feedApi';
import { chatApi } from '../../chat/services/chatApi'; 
import type { FeedDeck } from '../services/feedApi'; 

export const useGetFeed = () => {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => feedApi.getFeedPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || !lastPage.posts || lastPage.posts.length === 0) return undefined;
      return allPages.length + 1;
    },
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => feedApi.createPost(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      Alert.alert('Sucesso', 'Post criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar post:', error);
      Alert.alert('Erro', 'Não foi possível criar o post.');
    },
  });
};

export const useLikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => feedApi.likePost(postId),
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previousFeed = queryClient.getQueryData<InfiniteData<FeedDeck | null>>(['feed']);
      
      queryClient.setQueryData<InfiniteData<FeedDeck | null>>(['feed'], (oldFeed) => {
          if (!oldFeed) return oldFeed;
          return {
            ...oldFeed,
            pages: oldFeed.pages.map((page) => {
              if (!page) return page;
              return {
                ...page,
                posts: page.posts.map((post) => {
                  if (post.id === postId) {
                    return { ...post, isLikedByMe: true, likesCount: post.likesCount + 1 };
                  }
                  return post;
                }),
              };
            }),
          };
      });
      return { previousFeed };
    },
    onError: (err, postId, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed'], context.previousFeed);
      }
      console.log('Erro ao curtir:', err);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};

export const useUnlikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => feedApi.unlikePost(postId),
    onMutate: async (postId: string) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previousFeed = queryClient.getQueryData<InfiniteData<FeedDeck | null>>(['feed']);
      
      queryClient.setQueryData<InfiniteData<FeedDeck | null>>(['feed'], (oldFeed) => {
          if (!oldFeed) return oldFeed;
          return {
            ...oldFeed,
            pages: oldFeed.pages.map((page) => {
              if (!page) return page;
              return {
                ...page,
                posts: page.posts.map((post) => {
                  if (post.id === postId) {
                    return { ...post, isLikedByMe: false, likesCount: Math.max(0, post.likesCount - 1) };
                  }
                  return post;
                }),
              };
            }),
          };
      });
      return { previousFeed };
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};

// --- COMENTÁRIO HÍBRIDO COM CORREÇÃO DE TECLADO ---
export const useCommentOnPost = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();

  return useMutation({
    mutationFn: async ({ postId, content, authorId }: { postId: string; content: string; authorId?: string }) => {
      const response = await feedApi.commentOnPost(postId, { content });
      if (authorId) {
          try {
             await chatApi.createOrGetConversation({
                 targetUserId: authorId,
                 content: `Comentou no seu post: "${content}"`
             });
          } catch (error: any) {
             if (error?.response?.status === 402) {
                 throw error; 
             }
             console.log("Erro silencioso ao enviar DM do post:", error);
          }
      }
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['postComments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      if (variables.authorId) queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: (error: any) => {
      // --- FECHA O TECLADO ANTES DE NAVEGAR ---
      Keyboard.dismiss(); 

      if (error?.response?.status === 402) {
          navigation.navigate('Premium');
          return;
      }
      Alert.alert('Erro', 'Não foi possível enviar o comentário.');
    },
  });
};

export const useGetPostComments = (postId: string | null) => {
  return useQuery({
    queryKey: ['postComments', postId],
    queryFn: () => feedApi.getPostComments(postId!),
    enabled: !!postId,
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => feedApi.deletePost(postId),
    onSuccess: () => {
      Alert.alert('Sucesso', 'Post apagado.');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: () => Alert.alert('Erro', 'Não foi possível apagar.'),
  });
};