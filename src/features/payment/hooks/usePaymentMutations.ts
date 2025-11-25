import { useMutation } from '@tanstack/react-query';
import { Linking, Alert } from 'react-native';
import * as paymentApi from '../services/paymentApi';

export const useCreateSubscription = () => {
  return useMutation({
    mutationFn: paymentApi.createSubscription,

    onSuccess: (data) => {
      const { checkoutUrl } = data;

      if (checkoutUrl) {
        // Abre o navegador do celular (Safari/Chrome) no link do Asaas
        Linking.openURL(checkoutUrl).catch((err) => {
          console.error("Erro ao abrir link", err);
          Alert.alert("Erro", "Não foi possível abrir o navegador.");
        });
      } else {
        Alert.alert("Erro", "URL de pagamento não recebida do servidor.");
      }
    },

    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erro ao iniciar pagamento.';
      Alert.alert("Atenção", message);
    },
  });
};