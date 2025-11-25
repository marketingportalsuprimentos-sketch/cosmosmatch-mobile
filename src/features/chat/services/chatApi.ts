import { api } from '../../../services/api';

// Definição de Tipos Básicos
export interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: {
    userId: string;
    user: {
      id: string;
      name: string;
      profile: { imageUrl: string | null };
    };
  }[];
  messages: Message[];
}

export const chatApi = {
  getConversations: async () => {
    const response = await api.get('/chat/conversations');
    return response.data;
  },

  getConversationById: async (id: string) => {
    const response = await api.get(`/chat/conversations/${id}`);
    return response.data;
  },

  createOrGetConversation: async (data: { targetUserId: string; content?: string }) => {
    const response = await api.post('/chat/conversations', data);
    return response.data;
  },

  sendMessage: async (conversationId: string, content: string) => {
    const response = await api.post(`/chat/conversations/${conversationId}/messages`, { content });
    return response.data;
  },
  
  hideConversation: async (conversationId: string) => {
    // Backend espera DELETE para esconder conversa
    const response = await api.delete(`/chat/conversations/${conversationId}`);
    return response.data;
  },

  deleteMessage: async (messageId: string) => {
    // Apagar para TODOS (Unsend)
    const response = await api.delete(`/chat/messages/${messageId}`);
    return response.data;
  },

  hideMessageForMe: async (messageId: string) => {
    // AQUI ESTAVA O ERRO: Mudamos de PATCH para DELETE
    // Rota: DELETE /chat/messages/:id/hide
    const response = await api.delete(`/chat/messages/${messageId}/hide`);
    return response.data;
  },

  // Badge da TabBar
  getUnreadCount: async () => {
    const response = await api.get<{ count: number }>('/chat/conversations/unread-count'); 
    return response.data;
  }
};