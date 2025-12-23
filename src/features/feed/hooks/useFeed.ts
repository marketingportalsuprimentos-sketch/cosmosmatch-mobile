// src/features/feed/hooks/useFeed.ts

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
  InfiniteData,
} from '@tanstack/react-query';
import { Alert } from 'react-native';
import * as feedApi from '../services/feedApi';
// --- IMPORTANTE: Ajuste o caminho se necessário para apontar para sua API de Profile ---
import { followUser, unfollowUser } from '../../profile/services/profileApi'; 
import { chatApi } from '../../chat/services/chatApi'; 
import { FeedDeck } from '@/types/feed.types';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

export const useGetFeed = () => {
  const { user } = useAuth();

  return useInfiniteQuery({
    queryKey: ['feed', user?.id],
    queryFn: async ({ pageParam = 0 }) => {
      // O feedApi agora retorna FeedDeck[] (Array), garantido
      const data = await feedApi.getFeed({ skip: pageParam, take: 2 });
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // Como agora é um array, verificamos o tamanho dele
      if (!lastPage || lastPage.length === 0) {
        return undefined;
      }
      return allPages.length * 2; // Multiplicamos pelo 'take' ou apenas retornamos o tamanho acumulado
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, 
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => feedApi.createPost(formData),
    onSuccess: () => {
      Alert.alert('Sucesso', 'Post criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.message || 'Não foi possível criar o post.';
      Alert.alert('Erro', msg);
    },
  });
};

// --- LOGICA DE LIKE (Já existia e funcionava) ---
export const useLikePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: feedApi.likePost,
    onMutate: async (postId) => {
      const feedKey = ['feed', user?.id];
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previousFeed = queryClient.getQueryData<InfiniteData<FeedDeck[]>>(feedKey);

      queryClient.setQueryData<InfiniteData<FeedDeck[]>>(feedKey, (old) => {
        if (!old || !old.pages) return old;
        const newPages = old.pages.map((page) => {
           // page é FeedDeck[]
           return page.map(deck => {
              const postExists = deck.posts.some(p => p.id === postId);
              if (!postExists) return deck;
              return {
                ...deck,
                posts: deck.posts.map((post) => {
                  if (post.id === postId) {
                    return { 
                      ...post, 
                      isLikedByMe: true, 
                      likesCount: post.isLikedByMe ? post.likesCount : post.likesCount + 1 
                    };
                  }
                  return post;
                }),
              };
           });
        });
        return { ...old, pages: newPages };
      });
      return { previousFeed };
    },
    onError: (err, newPost, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed', user?.id], context.previousFeed);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};

export const useUnlikePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: feedApi.unlikePost,
    onMutate: async (postId) => {
      const feedKey = ['feed', user?.id];
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previousFeed = queryClient.getQueryData<InfiniteData<FeedDeck[]>>(feedKey);

      queryClient.setQueryData<InfiniteData<FeedDeck[]>>(feedKey, (old) => {
        if (!old || !old.pages) return old;
        const newPages = old.pages.map((page) => {
            return page.map(deck => {
                const postExists = deck.posts.some(p => p.id === postId);
                if (!postExists) return deck;
                return {
                  ...deck,
                  posts: deck.posts.map((post) => {
                    if (post.id === postId) {
                      return { 
                        ...post, 
                        isLikedByMe: false, 
                        likesCount: Math.max(0, post.isLikedByMe ? post.likesCount - 1 : post.likesCount)
                      };
                    }
                    return post;
                  }),
                };
            });
        });
        return { ...old, pages: newPages };
      });
      return { previousFeed };
    },
    onError: (err, newPost, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed', user?.id], context.previousFeed);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    }
  });
};

// --- NOVA LÓGICA: SEGUIR PELO FEED (ATUALIZAÇÃO OTIMISTA) ---
export const useFollowAuthorInFeed = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (authorId: string) => followUser(authorId), // Usa a API de profile
    onMutate: async (authorId) => {
      const feedKey = ['feed', user?.id];
      
      // 1. Cancela refetchs em andamento
      await queryClient.cancelQueries({ queryKey: feedKey });
      
      // 2. Guarda o estado anterior
      const previousFeed = queryClient.getQueryData<InfiniteData<FeedDeck[]>>(feedKey);

      // 3. Atualiza o cache manualment (Isso é o que "Segura" o botão)
      queryClient.setQueryData<InfiniteData<FeedDeck[]>>(feedKey, (old) => {
        if (!old || !old.pages) return old;
        
        const newPages = old.pages.map((page) => {
           // Percorre todos os decks da pagina
           return page.map(deck => {
             // Se achou o autor que clicamos, força o status para TRUE
             if (deck.author.id === authorId) {
                return {
                    ...deck,
                    author: {
                        ...deck.author,
                        isFollowedByMe: true // <--- A MÁGICA ACONTECE AQUI
                    }
                };
             }
             return deck;
           });
        });
        return { ...old, pages: newPages };
      });

      return { previousFeed };
    },
    onError: (err, variables, context) => {
      // Se der erro, volta como estava
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed', user?.id], context.previousFeed);
      }
      Alert.alert('Erro', 'Não foi possível seguir.');
    },
    onSettled: () => {
      // Sincroniza com o servidor depois
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['following'] }); // Atualiza perfil também
    },
  });
};

export const useUnfollowAuthorInFeed = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (authorId: string) => unfollowUser(authorId),
    onMutate: async (authorId) => {
      const feedKey = ['feed', user?.id];
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previousFeed = queryClient.getQueryData<InfiniteData<FeedDeck[]>>(feedKey);

      queryClient.setQueryData<InfiniteData<FeedDeck[]>>(feedKey, (old) => {
        if (!old || !old.pages) return old;
        const newPages = old.pages.map((page) => {
           return page.map(deck => {
             if (deck.author.id === authorId) {
                return {
                    ...deck,
                    author: {
                        ...deck.author,
                        isFollowedByMe: false // <--- Força para FALSE instantaneamente
                    }
                };
             }
             return deck;
           });
        });
        return { ...old, pages: newPages };
      });

      return { previousFeed };
    },
    onError: (err, variables, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed', user?.id], context.previousFeed);
      }
      Alert.alert('Erro', 'Não foi possível deixar de seguir.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
    },
  });
};

// --- COMENTÁRIOS E DELETE ---
export const useCommentOnPost = () => {
  const queryClient = useQueryClient();
  
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
             if (error?.response?.status === 402) throw error; 
             console.log("Chat error:", error);
          }
      }
      return response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['postComments', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      if (variables.authorId) queryClient.invalidateQueries({ queryKey: ['conversations'] });
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

export const useDeletePostComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`/post/comment/${commentId}`);
    },
    onSuccess: () => {
      Alert.alert('Sucesso', 'Comentário apagado.');
      queryClient.invalidateQueries({ queryKey: ['postComments'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || 'Não foi possível apagar.';
      Alert.alert('Erro', msg);
    }
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: feedApi.deletePost,
    onSuccess: () => {
      Alert.alert('Sucesso', 'Post apagado.');
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
    onError: () => Alert.alert('Erro', 'Não foi possível apagar post.'),
  });
};