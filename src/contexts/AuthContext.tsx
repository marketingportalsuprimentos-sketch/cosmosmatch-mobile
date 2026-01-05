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

  // 1. Validação Inicial do Token
  useEffect(() => {
    let isMounted = true;
    const validateToken = async () => {
      try {
        const token = await storage.getToken();
        
        if (token) {
          try {
            const response = await api.get<AuthUser>('/auth/me'); 
            if (isMounted) setUserState(response.data);
          } catch (error: any) {
            if ([401, 403, 404].includes(error.response?.status)) {
                await storage.removeToken();
                if (isMounted) setUserState(null);
            }
          }
        }
      } catch (err) {
        console.error('Erro na validação:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    validateToken();
    return () => { isMounted = false; };
  }, []);

  // 2. Gestão do Socket com Reconexão
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

      const newSocket = io(ENV.SOCKET_URL || ENV.API_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 3000,
      });

      newSocket.on('connect', () => console.log('Socket Conectado!'));
      newSocket.on('disconnect', () => setSocket(null));

      setSocket(newSocket);
    };

    connectSocket();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [user]);

  // 3. Funções de Autenticação (Nomes de funções do storage corrigidos)
  const signIn = useCallback(async (email, password) => {
    queryClient.clear();
    const response = await api.post('/auth/login', { email, password });
    const { token, user: userData } = response.data; // userData para evitar conflito de nome

    await storage.setToken(token); // CORRIGIDO: de saveToken para setToken
    setUserState(userData);
  }, [queryClient]);

  const reactivateAccount = useCallback(async (credentials: { email: string; password: string }) => {
    queryClient.clear();
    const response = await api.post('/auth/reactivate', credentials);
    const { token, user: userData } = response.data;

    await storage.setToken(token); // CORRIGIDO: de saveToken para setToken
    setUserState(userData);
  }, [queryClient]);

  const logout = useCallback(async () => {
    await storage.removeToken();
    if (socket) socket.disconnect();
    setSocket(null);
    queryClient.clear();
    setUserState(null);
  }, [queryClient, socket]);

  const setUser = useCallback(
    (action: SetStateAction<AuthUser | null>) => {
        if (typeof action === 'function') {
            setUserState(action);
        } else {
            setUserState(action);
            if (!action) queryClient.clear();
        }
    },
    [queryClient],
  );

  const incrementFreeContactsUsed = useCallback(() => {
    setUserState((currentUser) => {
      if (!currentUser?.subscription || currentUser.subscription.status !== 'FREE') return currentUser;
      return {
        ...currentUser,
        subscription: {
          ...currentUser.subscription,
          freeContactsUsed: (currentUser.subscription.freeContactsUsed || 0) + 1,
        },
      };
    });
  }, []);

  const value = {
    user, setUser, isLoading, signIn, reactivateAccount,
    logout, signOut: logout, incrementFreeContactsUsed, socket,
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' }}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};