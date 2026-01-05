import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback, 
  ReactNode 
} from 'react';
import { api } from '../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { AuthUser } from '../types/auth.types';
import { storage } from '../lib/storage';
import { ENV } from '../config/env';
import { View, ActivityIndicator } from 'react-native';

export interface AuthContextType {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  reactivateAccount: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  signOut: () => Promise<void>; 
  incrementFreeContactsUsed: () => void;
  socket: Socket | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const queryClient = useQueryClient();

  // 1. INTERCEPTOR REFORÇADO: Resolve o problema do Feed
  // Garante que toda requisição ao servidor leve o token atualizado
  useEffect(() => {
    const interceptor = api.interceptors.request.use(async (config) => {
      const token = await storage.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }, (error) => {
      return Promise.reject(error);
    });

    return () => api.interceptors.request.eject(interceptor);
  }, []);

  // 2. Inicialização da Sessão
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const token = await storage.getToken();
        if (token) {
          const { data } = await api.get('/auth/me');
          if (isMounted) setUserState(data);
        }
      } catch (error) {
        console.log("Sessão expirada ou erro de conexão");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    initAuth();
    return () => { isMounted = false; };
  }, []);

  // 3. Gestão do Socket (WebSocket estável)
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const connectSocket = async () => {
      const token = await storage.getToken();
      if (!token || socket) return;

      const newSocket = io(ENV.API_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
      });

      newSocket.on('connect', () => setSocket(newSocket));
      newSocket.on('disconnect', () => setSocket(null));
    };

    connectSocket();
    return () => { if (socket) socket.disconnect(); };
  }, [user]);

  // 4. Funções de Autenticação
  const signIn = useCallback(async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;

    if (!token) throw new Error('Servidor não retornou um token válido.');

    const tokenString = typeof token === 'string' ? token : JSON.stringify(token);
    await storage.setToken(tokenString); //
    
    setUserState(userData);
    queryClient.clear();
  }, [queryClient]);

  const reactivateAccount = useCallback(async (credentials) => {
    const response = await api.post('/auth/reactivate', credentials);
    const { token, user: userData } = response.data;

    const tokenString = typeof token === 'string' ? token : JSON.stringify(token);
    await storage.setToken(tokenString);
    
    setUserState(userData);
    queryClient.clear();
  }, [queryClient]);

  const logout = useCallback(async () => {
    if (socket) socket.disconnect();
    await storage.removeToken();
    setUserState(null);
    setSocket(null);
    queryClient.clear();
  }, [socket, queryClient]);

  const incrementFreeContactsUsed = useCallback(() => {
    setUserState((curr) => {
      if (!curr?.subscription || curr.subscription.status !== 'FREE') return curr;
      return {
        ...curr,
        subscription: {
          ...curr.subscription,
          freeContactsUsed: (curr.subscription.freeContactsUsed || 0) + 1
        }
      };
    });
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' }}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      setUser: setUserState, 
      isLoading, 
      signIn, 
      reactivateAccount, 
      logout, 
      signOut: logout, 
      incrementFreeContactsUsed, 
      socket 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};