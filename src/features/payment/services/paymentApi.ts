import { api } from '../../../services/api';

export const createSubscription = async () => {
  // Chama exatamente a mesma rota da Web
  const { data } = await api.post('/payment/subscribe');
  return data; // Espera receber { checkoutUrl: '...' }
};