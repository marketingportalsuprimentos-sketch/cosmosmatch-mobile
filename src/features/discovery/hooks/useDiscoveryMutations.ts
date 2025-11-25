import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { likeProfile } from '../services/discoveryApi';
// --- MUDANÇA 1: Importar a API de Chat (que tem o bloqueio funcionando) ---
import { chatApi } from '../../chat/services/chatApi'; 

export function useDiscoveryMutations() {
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>(); 

  // Mutação de Like (Mantém igual)
  const likeMutation = useMutation({
    mutationFn: (userId: string) => likeProfile(userId), 
    onSuccess: (data) => {
      if (data.matched) {
        console.log("It's a match!");
      }
    },
    onError: (error) => {
      console.error('Erro ao dar like:', error);
    }
  });

  // Mutação de Mensagem (AGORA USA A API DO CHAT)
  const icebreakerMutation = useMutation({
    mutationFn: ({ userId, content }: { userId: string; content: string }) => 
      // --- MUDANÇA 2: Usar a rota de chat que valida o Paywall ---
      chatApi.createOrGetConversation({
          targetUserId: userId,
          content: content
      }),
    
    onSuccess: () => {
        // Opcional: Atualizar lista de conversas se necessário
        queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },

    onError: (error: any) => {
      // Fecha o teclado para não atrapalhar a navegação
      Keyboard.dismiss();

      // Verifica erro 402 (Limite Atingido)
      if (error?.response?.status === 402) {
        navigation.navigate('Premium'); 
        return; 
      }

      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
    }
  });

  return {
    like: likeMutation.mutateAsync,
    likeStatus: likeMutation.status,
    
    sendIcebreaker: icebreakerMutation.mutateAsync,
    icebreakerStatus: icebreakerMutation.status,
  };
}