// mobile/src/contexts/AuthContext.tsx

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

  // 1. Validação do utilizador e sessão
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
        // Só remove se for erro de autenticação real
        const status = (error as any).response?.status;
        if (status === 401 || status === 403) {
          await storage.removeToken();
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    initAuth();
    return () => { isMounted = false; };
  }, []);

  // 2. Gestão do Socket - Ajustado para evitar desconexões no iOS
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    let socketInstance: Socket | null = null;

    const connectSocket = async () => {
      const token = await storage.getToken();
      if (!token) return;

      // Se já houver um socket conectado, não cria outro
      if (socketInstance?.connected) return;

      socketInstance = io(ENV.API_URL, {
        auth: { token },
        transports: ['websocket'], // Essencial para estabilidade no iOS
        reconnection: true,
        reconnectionAttempts: 20,
        reconnectionDelay: 2000,
      });

      socketInstance.on('connect', () => {
        console.log('Socket conectado');
        setSocket(socketInstance);
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('Socket desconectado:', reason);
        if (reason === 'io server disconnect') {
          socketInstance?.connect();
        }
      });
    };

    connectSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
        setSocket(null);
      }
    };
  }, [user]);

  // 3. Funções de Auth mantendo os teus métodos originais (setToken)
  const signIn = useCallback(async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data;

    // Uso rigoroso do teu método setToken para evitar o erro de string no SecureStore
    if (typeof token === 'string') {
      await storage.setToken(token);
      setUserState(userData);
      queryClient.clear();
    } else {
      console.error("Erro: Token recebido não é uma string.");
    }
  }, [queryClient]);

  const reactivateAccount = useCallback(async (credentials) => {
    const response = await api.post('/auth/reactivate', credentials);
    const { token, user: userData } = response.data;

    if (typeof token === 'string') {
      await storage.setToken(token);
      setUserState(userData);
      queryClient.clear();
    }
  }, [queryClient]);

  const logout = useCallback(async () => {
    if (socket) socket.disconnect();
    await storage.removeToken();
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