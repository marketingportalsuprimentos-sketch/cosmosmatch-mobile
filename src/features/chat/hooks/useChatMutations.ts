import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '../../../lib/toast'; 
import { chatApi } from '../services/chatApi'; 
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface SendMessageVars {
  conversationId: string;
  content: string;
}

interface CreateConversationVars {
  targetUserId: string;
  content?: string;
}

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const { user, incrementFreeContactsUsed } = useAuth(); 
  const navigation = useNavigation<any>();

  return useMutation({
    mutationFn: ({ conversationId, content }: SendMessageVars) =>
      chatApi.sendMessage(conversationId, content),
    
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });

      if (user?.subscription?.status === 'FREE') {
        incrementFreeContactsUsed(); 
      }
    },
    onError: (error: any) => {
      if (error?.response?.status === 402) {
        // CORRIGIDO: Nome da rota ajustado para 'Premium'
        navigation.navigate('Premium'); 
        return;
      }
      toast.error('Erro ao enviar mensagem.');
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.deleteMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
      toast.success('Mensagem apagada para todos.');
    },
    onError: () => toast.error('Erro ao apagar mensagem.'),
  });
};

export const useHideMessageForMe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { messageId: string; conversationId: string }) =>
      chatApi.hideMessageForMe(vars.messageId),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['conversation', vars.conversationId] });
      toast.success('Mensagem ocultada.');
    },
    onError: () => toast.error('Erro ao ocultar mensagem.')
  });
};

export const useCreateOrGetConversation = () => {
    const queryClient = useQueryClient();
    const navigation = useNavigation<any>();

    return useMutation({
        mutationFn: (data: CreateConversationVars) => chatApi.createOrGetConversation(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
        },
        onError: (error: any) => {
            if (error?.response?.status === 402) {
                // CORRIGIDO: Nome da rota ajustado para 'Premium'
                navigation.navigate('Premium');
                return;
            }
            toast.error('Erro ao iniciar conversa.');
        }
    });
};

export const useHideConversation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: chatApi.hideConversation,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] })
    });
};