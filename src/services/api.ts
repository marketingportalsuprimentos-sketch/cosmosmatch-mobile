import axios, { AxiosError } from 'axios';
import { ENV } from '../config/env';
import { storage } from '../lib/storage';
import { toast } from '../lib/toast';
import { navigate } from '../navigation/navigationRef';

export const api = axios.create({
  baseURL: ENV.API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// INTERCEPTOR DE REQUEST - Único e centralizado
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getToken();
      if (token) {
        // Garantindo que o Bearer seja injetado corretamente
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Erro ao recuperar token no interceptor:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// INTERCEPTOR DE RESPONSE
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

    // 2. Paywall / Limites Premium
    if (status === 402 || (status === 403 && message.toLowerCase().includes('limite'))) {
      toast.error(message);
      navigate('Premium');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);