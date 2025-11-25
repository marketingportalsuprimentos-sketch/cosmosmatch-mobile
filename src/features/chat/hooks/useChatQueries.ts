import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../services/chatApi';

export const useGetConversations = () => {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: chatApi.getConversations,
    refetchInterval: 3000, 
    refetchOnWindowFocus: true,
  });
};

export const useGetConversationById = (id: string) => {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: () => chatApi.getConversationById(id),
    enabled: !!id,
    refetchInterval: 3000,
  });
};

// --- VERSÃO SEGURA (SEM DEPENDÊNCIAS EXTERNAS) ---
export const useGetUnreadMessageCount = () => {
  return useQuery({
    // Usamos a mesma chave para aproveitar o cache, mas definimos a função explicitamente
    queryKey: ['conversations'], 
    queryFn: chatApi.getConversations,
    refetchInterval: 3000,
    
    // Usamos 'select' para transformar a lista em número de forma segura
    select: (data: any) => {
      if (!Array.isArray(data)) return { count: 0 };
      
      const count = data.reduce((total: number, conv: any) => {
        // Proteção contra valores nulos
        const unread = conv?.unreadCount || conv?.unread_count || 0;
        return total + unread;
      }, 0);
      
      return { count };
    }
  });
};