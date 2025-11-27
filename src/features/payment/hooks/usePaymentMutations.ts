import { useMutation } from '@tanstack/react-query';
import * as paymentApi from '../services/paymentApi';

export const useCreateSubscription = () => {
  return useMutation({
    mutationFn: paymentApi.createSubscription,
    // V3: Limpeza forçada - Sem alertas aqui!
  });
};