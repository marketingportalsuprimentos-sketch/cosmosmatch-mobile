import axios, { AxiosError } from 'axios';
import { ENV } from '../config/env';
import { storage } from '../lib/storage';
import { toast } from '../lib/toast';
import { navigate } from '../navigation/navigationRef';

export const api = axios.create({
  baseURL: ENV.API_URL,
  withCredentials: true,
  timeout: 15000, 
});

// VARIÁVEL DE CONTROLE: Mantém o registro do último alerta de Premium exibido
let lastPremiumAlertTime = 0;
const ALERT_COOLDOWN = 8000; // 8 segundos de intervalo mínimo entre alertas repetidos

api.interceptors.request.use(
  async (config) => {
    try {
      const token = await storage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Erro ao recuperar token:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const errorData = error.response?.data as { message?: string };
    const message = errorData?.message || 'Ocorreu um erro inesperado.';
    const now = Date.now();

    // 1. Erro de Autenticação
    if (status === 401) {
      await storage.removeToken();
      navigate('Login');
      toast.error('Sessão expirada.');
      return Promise.reject(error);
    }

    // 2. Silenciador de Quarentena (Soft Delete)
    const isQuarantine = status === 403 && 
                       !message.toLowerCase().includes('limite') && 
                       !message.toLowerCase().includes('verifique o seu email');

    if (isQuarantine) {
      return Promise.reject(error); 
    }

    // 3. Tratamento de Limites / Premium (402 ou 403 de Limite)
    // Aplicamos a trava de tempo para evitar múltiplos pop-ups simultâneos
    if (status === 402 || (status === 403 && message.toLowerCase().includes('limite'))) {
      
      if (now - lastPremiumAlertTime > ALERT_COOLDOWN) {
        lastPremiumAlertTime = now;
        toast.error(message);
        navigate('Premium');
      }

      return Promise.reject(error);
    }

    // 4. Verificação de Email
    if (status === 403 && message.toLowerCase().includes('verifique o seu email')) {
      toast.info('Verifique seu email para continuar.');
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);