import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  Dispatch,
  SetStateAction,
  ReactNode,
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
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
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

  // 1. Inicialização e Validação
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      try {
        const token = await storage.getToken(); //
        if (token) {
          // Atualiza o header da API caso já exista token salvo
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const { data } = await api.get('/auth/me');
          if (isMounted) setUserState(data);
        }
      } catch (error) {
        await storage.removeToken(); //
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    initAuth();
    return () => { isMounted = false; };
  }, []);

  // 2. Gestão do Socket
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const connectSocket = async () => {
      const token = await storage.getToken(); //
      if (!token) return;

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

  // 3. Função signIn CORRIGIDA para o erro de Seguir
  const signIn = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;

      if (!token) throw new Error('Token não recebido');

      const tokenString = typeof token === 'string' ? token : JSON.stringify(token);
      
      // PASSO CRÍTICO: Salvar o token e ATUALIZAR os cabeçalhos da API imediatamente
      await storage.setToken(tokenString); //
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenString}`;
      
      setUserState(userData);
      
      // Limpar cache para forçar o app a ler os dados frescos com o novo token
      queryClient.clear();
      
    } catch (error: any) {
      console.error("Erro no Login:", error);
      throw error; 
    }
  }, [queryClient]);

  const reactivateAccount = useCallback(async (credentials) => {
    try {
      const response = await api.post('/auth/reactivate', credentials);
      const { token, user: userData } = response.data;
      const tokenString = typeof token === 'string' ? token : JSON.stringify(token);
      
      await storage.setToken(tokenString); //
      api.defaults.headers.common['Authorization'] = `Bearer ${tokenString}`;
      
      setUserState(userData);
      queryClient.clear();
    } catch (error) {
      throw error;
    }
  }, [queryClient]);

  const logout = useCallback(async () => {
    if (socket) socket.disconnect();
    await storage.removeToken(); //
    delete api.defaults.headers.common['Authorization']; // Limpa o header
    setSocket(null);
    setUserState(null);
    queryClient.clear();
  }, [socket, queryClient]);

  const incrementFreeContactsUsed = useCallback(() => {
    setUserState((curr) => {
      if (!curr?.subscription || curr.subscription.status !== 'FREE') return curr;
      return {
        ...curr,
        subscription: {
          ...curr.subscription,
          freeContactsUsed: (curr.subscription.freeContactsUsed || 0) + 1,
        },
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
      user, setUser: setUserState, isLoading, signIn, reactivateAccount, 
      logout, signOut: logout, incrementFreeContactsUsed, socket 
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