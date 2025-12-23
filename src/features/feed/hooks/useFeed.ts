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
// Caminho ajustado conforme seu arquivo original
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
      const data = await feedApi.getFeed({ skip: pageParam, take: 2 });
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // AJUSTE CRÍTICO: Suporta tanto Objeto quanto Array
      if (!lastPage) return undefined;
      
      const isArray = Array.isArray(lastPage);
      // Se for array vazio, acabou
      if (isArray && lastPage.length === 0) return undefined;
      // Se for objeto único mas vazio (sem posts), acabou
      if (!isArray && (!lastPage.posts || lastPage.posts.length === 0)) return undefined;
      
      // Incrementa a paginação
      return allPages.length * 2; 
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

// --- FUNÇÃO AUXILIAR PARA ATUALIZAR DECK (HÍBRIDA) ---
// Atualiza um deck (objeto de usuário+posts) com o novo like
function updateDeckLike(deck: FeedDeck | any, postId: string, isLike: boolean) {
    if (!deck || !deck.posts) return deck;
    
    // Verifica se o post alvo está dentro deste deck
    const postExists = deck.posts.some((p: any) => p.id === postId);
    if (!postExists) return deck;
    
    return {
      ...deck,
      posts: deck.posts.map((post: any) => {
        if (post.id === postId) {
          return { 
            ...post, 
            isLikedByMe: isLike, 
            likesCount: Math.max(0, isLike ? post.likesCount + 1 : post.likesCount - 1)
          };
        }
        return post;
      }),
    };
}

// --- LOGICA DE LIKE (HÍBRIDA) ---
export const useLikePost = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: feedApi.likePost,
    onMutate: async (postId) => {
      const feedKey = ['feed', user?.id];
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previousFeed = queryClient.getQueryData<InfiniteData<any>>(feedKey);

      queryClient.setQueryData<InfiniteData<any>>(feedKey, (old) => {
        if (!old || !old.pages) return old;
        const newPages = old.pages.map((page: any) => {
           // CENÁRIO A: É uma Lista (Array)
           if (Array.isArray(page)) {
               return page.map(deck => updateDeckLike(deck, postId, true));
           }
           // CENÁRIO B: É um Objeto Único (Backend Atual)
           return updateDeckLike(page, postId, true);
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
      const previousFeed = queryClient.getQueryData<InfiniteData<any>>(feedKey);

      queryClient.setQueryData<InfiniteData<any>>(feedKey, (old) => {
        if (!old || !old.pages) return old;
        const newPages = old.pages.map((page: any) => {
            if (Array.isArray(page)) {
               return page.map(deck => updateDeckLike(deck, postId, false));
            }
            return updateDeckLike(page, postId, false);
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

// --- SEGUIR PELO FEED (HÍBRIDO: ARRAY OU OBJETO) ---
export const useFollowAuthorInFeed = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (authorId: string) => followUser(authorId), 
    onMutate: async (authorId) => {
      const feedKey = ['feed', user?.id];
      
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previousFeed = queryClient.getQueryData<InfiniteData<any>>(feedKey);

      queryClient.setQueryData<InfiniteData<any>>(feedKey, (old) => {
        if (!old || !old.pages) return old;
        
        const newPages = old.pages.map((page: any) => {
           // CENÁRIO A: Backend devolve Array (Web/Antigo)
           if (Array.isArray(page)) {
               return page.map(deck => {
                   if (deck.author.id === authorId) {
                       return { ...deck, author: { ...deck.author, isFollowedByMe: true } };
                   }
                   return deck;
               });
           }
           
           // CENÁRIO B: Backend devolve Objeto (Mobile Atual)
           if (page?.author?.id === authorId) {
               return { ...page, author: { ...page.author, isFollowedByMe: true } };
           }
           return page;
        });
        return { ...old, pages: newPages };
      });

      return { previousFeed };
    },
    onError: (err, variables, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed', user?.id], context.previousFeed);
      }
      // Opcional: silenciar o alerta se for erro de concorrência, mas manter para debug
      Alert.alert('Erro', 'Não foi possível seguir.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['following'] }); 
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
      const previousFeed = queryClient.getQueryData<InfiniteData<any>>(feedKey);

      queryClient.setQueryData<InfiniteData<any>>(feedKey, (old) => {
        if (!old || !old.pages) return old;
        const newPages = old.pages.map((page: any) => {
           // CENÁRIO A: Array
           if (Array.isArray(page)) {
               return page.map(deck => {
                   if (deck.author.id === authorId) {
                       return { ...deck, author: { ...deck.author, isFollowedByMe: false } };
                   }
                   return deck;
               });
           }
           // CENÁRIO B: Objeto
           if (page?.author?.id === authorId) {
               return { ...page, author: { ...page.author, isFollowedByMe: false } };
           }
           return page;
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

// --- COMENTÁRIOS E DELETE (Mantidos iguais) ---
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