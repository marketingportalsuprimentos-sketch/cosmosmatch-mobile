import { Alert } from 'react-native';

export const toast = {
  success: (m: string) => Alert.alert('Sucesso', m),
  error:   (m: string) => Alert.alert('Erro', m),
  info:    (m: string) => Alert.alert('Info', m),
};