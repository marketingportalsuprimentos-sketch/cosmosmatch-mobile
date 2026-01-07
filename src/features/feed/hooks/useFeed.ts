import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Alert } from 'react-native';
import * as feedApi from '../services/feedApi';
import { api } from '../../../services/api';

// HOOK PRINCIPAL PARA BUSCAR O FEED
export const useGetFeed = () => {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = 0 }) => {
      const data = await feedApi.getFeed({ skip: pageParam, take: 1 });
      if (data && data.posts) {
        data.posts.forEach((p: any) => {
          console.log(`📡 [API Feed] Post ${p.id.slice(-4)} | isSensitive: ${p.isSensitive} | reports: ${p.reportsCount}`);
        });
      }
      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || !lastPage.author) return undefined;
      return allPages.length;
    },
    staleTime: 0,
  });
};

// HOOK PARA DENUNCIAR POST
export const useReportPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason: string }) => 
      feedApi.reportPost(postId, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    }
  });
};

// HOOKS PARA COMENTÁRIOS
export const useGetPostComments = (postId: string) => {
  return useQuery({
    queryKey: ['postComments', postId],
    queryFn: () => feedApi.getPostComments(postId),
  });
};

export const useCommentOnPost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      feedApi.commentOnPost(postId, content),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ['postComments', postId] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};

// --- CORREÇÃO: ADICIONADO useDeleteComment ---
export const useDeleteComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => feedApi.deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['postComments'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};

// HOOKS PARA LIKE
export const useLikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => feedApi.likePost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previousFeed = queryClient.getQueryData(['feed']);
      queryClient.setQueryData(['feed'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((p: any) =>
              p.id === postId 
                ? { ...p, isLikedByMe: true, likesCount: (p.likesCount || 0) + 1, isSensitive: p.isSensitive } 
                : p
            ),
          })),
        };
      });
      return { previousFeed };
    },
    onError: (err, postId, context: any) => {
      if (context?.previousFeed) queryClient.setQueryData(['feed'], context.previousFeed);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });
};

export const useUnlikePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => feedApi.unlikePost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previousFeed = queryClient.getQueryData(['feed']);
      queryClient.setQueryData(['feed'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((p: any) =>
              p.id === postId 
                ? { ...p, isLikedByMe: false, likesCount: Math.max(0, (p.likesCount || 0) - 1), isSensitive: p.isSensitive } 
                : p
            ),
          })),
        };
      });
      return { previousFeed };
    },
    onError: (err, postId, context: any) => {
      if (context?.previousFeed) queryClient.setQueryData(['feed'], context.previousFeed);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['feed'] }),
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => feedApi.createPost(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => feedApi.deletePost(postId),
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['feed'] });
      const previousFeed = queryClient.getQueryData(['feed']);
      queryClient.setQueryData(['feed'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            posts: page.posts.filter((p: any) => p.id !== postId)
          })).filter((page: any) => page.posts.length > 0)
        };
      });
      return { previousFeed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
};