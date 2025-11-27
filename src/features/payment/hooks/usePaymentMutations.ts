import { useMutation } from '@tanstack/react-query';
// Removemos o Linking e Alert daqui, pois quem vai usar isso é a tela
import * as paymentApi from '../services/paymentApi';

export const useCreateSubscription = () => {
  return useMutation({
    mutationFn: paymentApi.createSubscription,
    
    // --- MUDANÇA CRÍTICA ---
    // Removemos onSuccess e onError globais.
    // Agora o hook apenas repassa o resultado para quem chamou (a PremiumScreen).
    // Isso evita alertas duplos e permite mensagens personalizadas na tela.
  });
};