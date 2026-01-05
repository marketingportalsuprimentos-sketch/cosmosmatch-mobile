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

  // 1. Validação de Sessão ao Iniciar
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
        await storage.removeToken();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    initAuth();
    return () => { isMounted = false; };
  }, []);

  // 2. Gestão do Socket (Estabilidade para iOS/TestFlight)
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

  // 3. Função de Login corrigida para evitar o erro do SecureStore
  const signIn = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (!response.data || !response.data.token) {
        throw new Error('Servidor não retornou um token válido.');
      }

      const { token, user: userData } = response.data;

      // PROTEÇÃO: Garante que o token é string para o storage.setToken
      const tokenString = typeof token === 'string' ? token : JSON.stringify(token);
      
      await storage.setToken(tokenString); // Usa o teu método do storage.ts
      
      setUserState(userData);
      queryClient.clear();
    } catch (error) {
      console.error("Erro no AuthContext (signIn):", error);
      throw error; // Repassa o erro para a LoginScreen mostrar o Alerta
    }
  }, [queryClient]);

  const reactivateAccount = useCallback(async (credentials) => {
    try {
      const response = await api.post('/auth/reactivate', credentials);
      const { token, user: userData } = response.data;
      const tokenString = typeof token === 'string' ? token : JSON.stringify(token);
      
      await storage.setToken(tokenString);
      setUserState(userData);
      queryClient.clear();
    } catch (error) {
      throw error;
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