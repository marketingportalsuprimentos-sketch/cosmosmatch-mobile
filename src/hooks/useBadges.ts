// src/hooks/useBadges.ts
import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../features/chat/services/chatApi';
// Mantendo o hook original de likes
import { useGetUnreadLikesCount as useProfileLikes } from '../features/profile/hooks/useProfile';

// Hook para Mensagens (Versão Limpa - Sem Logs)
export const useGetUnreadMessageCount = () => {
  return useQuery({
    queryKey: ['unread-messages-count'],
    queryFn: async () => {
      try {
        const data = await chatApi.getUnreadCount();
        // Log removido para não poluir o terminal
        return data; 
      } catch (error) {
        return { count: 0 };
      }
    },
    refetchInterval: 5000, // Mantém a verificação automática a cada 5s
    refetchOnWindowFocus: true, 
  });
};

export const useGetUnreadLikesCount = useProfileLikes;