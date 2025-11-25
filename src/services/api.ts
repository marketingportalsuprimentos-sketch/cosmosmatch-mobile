import axios, { AxiosError } from 'axios';
import { ENV } from '../config/env';
import { storage } from '../lib/storage';
import { toast } from '../lib/toast';
import { navigate } from '../navigation/navigationRef'; // <--- Importa o controle de navegação

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
    
    // 1. Token Expirado (401)
    if (error.response?.status === 401) {
      await storage.removeToken();
      navigate('Login'); // Redireciona para Login
    }

    // 2. Paywall / Premium (402)
    if (error.response?.status === 402) {
      // Removemos o toast daqui para não duplicar com a tela que vai abrir
      // ou mantemos se quiser avisar antes de abrir
      navigate('Premium'); // Abre a tela Premium imediatamente
    }
    
    // 3. Bloqueio / Verificação (403)
    else if (error.response?.status === 403) {
      const errorData = error.response.data as { message: string };
      const verificationMessage = 'Por favor, verifique o seu email para continuar a usar a aplicação.';
      
      if (errorData?.message === verificationMessage) {
         toast.info('Verifique seu email para continuar.');
         // Se tiver uma tela de verificação, use: navigate('VerifyEmail');
      }
    }
    
    return Promise.reject(error);
  },
);