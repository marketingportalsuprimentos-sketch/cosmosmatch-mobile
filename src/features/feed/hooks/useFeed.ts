import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  useQuery,
  InfiniteData,
} from '@tanstack/react-query';
import { Alert } from 'react-native';
import * as feedApi from '../services/feedApi';
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
      return await feedApi.getFeed({ skip: pageParam, take: 2 });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return allPages.length * 2; 
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, 
  });
};

export const useFollowAuthorInFeed = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (authorId: string) => followUser(authorId),
    onMutate: async (authorId) => {
      const queryKey = ['feed', user?.id];
      await queryClient.cancelQueries({ queryKey });
      const previousFeed = queryClient.getQueryData<InfiniteData<FeedDeck[]>>(queryKey);

      queryClient.setQueryData<InfiniteData<FeedDeck[]>>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => 
            page.map((deck) => 
              deck.author.id === authorId 
                ? { ...deck, author: { ...deck.author, isFollowedByMe: true } } 
                : deck
            )
          ),
        };
      });
      return { previousFeed };
    },
    onError: (err, authorId, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed', user?.id], context.previousFeed);
      }
      Alert.alert('Erro', 'Não foi possível seguir o utilizador.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['discovery'] });
    },
  });
};

export const useUnfollowAuthorInFeed = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (authorId: string) => unfollowUser(authorId),
    onMutate: async (authorId) => {
      const queryKey = ['feed', user?.id];
      await queryClient.cancelQueries({ queryKey });
      const previousFeed = queryClient.getQueryData<InfiniteData<FeedDeck[]>>(queryKey);

      queryClient.setQueryData<InfiniteData<FeedDeck[]>>(queryKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page) => 
            page.map((deck) => 
              deck.author.id === authorId 
                ? { ...deck, author: { ...deck.author, isFollowedByMe: false } } 
                : deck
            )
          ),
        };
      });
      return { previousFeed };
    },
    onError: (err, authorId, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(['feed', user?.id], context.previousFeed);
      }
      Alert.alert('Erro', 'Não foi possível deixar de seguir.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['discovery'] });
    },
  });
};

// ... Restante do ficheiro (Likes e Comentários) permanece igual
export const useLikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: feedApi.likePost,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['feed'] }); },
  });
};

export const useUnlikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: feedApi.unlikePost,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['feed'] }); },
  });
};