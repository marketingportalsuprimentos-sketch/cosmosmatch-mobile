import { useMutation } from '@tanstack/react-query';
import * as paymentApi from '../services/paymentApi';

export const useCreateSubscription = () => {
  return useMutation({
    mutationFn: paymentApi.createSubscription,
    // REMOVEMOS onSuccess e onError daqui.
    // Agora o controle total é da tela (PremiumScreen), sem alertas duplicados.
  });
};