import axios, { AxiosError } from 'axios';
import { ENV } from '../config/env';
import { storage } from '../lib/storage';
import { toast } from '../lib/toast';
import { navigate } from '../navigation/navigationRef';

export const api = axios.create({
  baseURL: ENV.API_URL,
  withCredentials: true,
  timeout: 15000, // Previne que o app trave se o servidor demorar nos cálculos de compatibilidade
});

// Interceptor de REQUEST: Garante que o Token seja injetado em cada chamada
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erro ao recuperar token para a requisição:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de RESPONSE: Trata erros globais (401, 402, 403)
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const errorData = error.response?.data as { message?: string };
    const message = errorData?.message || 'Ocorreu um erro inesperado.';

    // 1. Sessão Expirada
    if (status === 401) {
      await storage.removeToken();
      navigate('Login');
      toast.error('Sessão expirada. Por favor, faça login novamente.');
      return Promise.reject(error);
    }

    // 2. Limite de Uso / Paywall (402 ou 403 com mensagem de limite)
    if (status === 402 || (status === 403 && message.toLowerCase().includes('limite'))) {
      toast.error(message);
      navigate('Premium');
      return Promise.reject(error);
    }

    // 3. Verificação de Email
    if (status === 403 && message.toLowerCase().includes('verifique o seu email')) {
      toast.info('Verifique seu email para continuar.');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);