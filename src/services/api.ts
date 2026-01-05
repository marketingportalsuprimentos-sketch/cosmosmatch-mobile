import axios, { AxiosError } from 'axios';
import { ENV } from '../config/env';
import { storage } from '../lib/storage';
import { toast } from '../lib/toast';
import { navigate } from '../navigation/navigationRef';

export const api = axios.create({
  baseURL: ENV.API_URL,
  withCredentials: true,
});

// Interceptor de REQUEST
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor de RESPONSE
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const errorData = error.response?.data as { message?: string };
    const message = errorData?.message || 'Ocorreu um erro inesperado.';

    // 1. Token Expirado (401)
    if (status === 401) {
      await storage.removeToken();
      navigate('Login');
      toast.error('Sessão expirada. Por favor, faça login novamente.');
      return Promise.reject(error);
    }

    // 2. Paywall / Premium (402 ou 403 com mensagem de limite)
    // Se o erro for 402 ou um 403 que mencione "limite", enviamos para a tela Premium
    if (status === 402 || (status === 403 && message.toLowerCase().includes('limite'))) {
      toast.error(message);
      navigate('Premium');
      return Promise.reject(error);
    }

    // 3. Bloqueio por Verificação de Email
    if (status === 403 && message.toLowerCase().includes('verifique o seu email')) {
      toast.info('Verifique seu email para continuar.');
      // navigate('VerifyEmail'); // Ative se tiver esta tela
      return Promise.reject(error);
    }

    // Erros genéricos de Servidor
    if (status && status >= 500) {
      toast.error('Erro no servidor. Tente novamente mais tarde.');
    }

    return Promise.reject(error);
  },
);