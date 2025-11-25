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
  logout: () => Promise<void>;
  signOut: () => Promise<void>; // ADICIONADO: Alias para compatibilidade
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
        setIsLoading(true);
        const token = await storage.getToken();
        
        let fetchedUser: AuthUser | null = null;
        if (token) {
          try {
            const response = await api.get<AuthUser>('/auth/profile');
            fetchedUser = response.data;
            console.log('Auth: Token validado para', fetchedUser.username);
          } catch (error) {
            console.log('Auth: Token inválido. Limpando...');
            await storage.removeToken();
          }
        }

        if (isMounted) {
          setUserState(fetchedUser);
        }
      } catch (err) {
        console.error('Erro na validação:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    validateToken();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Gestão do Socket.IO
  useEffect(() => {
    if (!user) {
      if (socket) {
        console.log('Auth (Socket): Logout detectado, desconectando...');
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const connectSocket = async () => {
      if (user && !socket) {
        const token = await storage.getToken();
        if (!token) return;

        console.log(`Auth (Socket): Conectando a ${ENV.SOCKET_URL}...`);

        const newSocket = io(ENV.SOCKET_URL, {
          auth: { token },
          transports: ['websocket'],
        });

        newSocket.on('connect', () => {
          console.log(`Auth (Socket): Conectado! ID: ${newSocket.id}`);
        });

        newSocket.on('disconnect', (reason) => {
          console.log(`Auth (Socket): Desconectado (${reason})`);
          setSocket(null);
        });

        setSocket(newSocket);
      }
    };

    connectSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, socket]);

  const logout = useCallback(async () => {
    console.log('Auth: Logout...');
    await storage.removeToken();
    setUserState(null);
    queryClient.clear();
  }, [queryClient]);

  const setUser = useCallback(
    (action: SetStateAction<AuthUser | null>) => {
        if (typeof action === 'function') {
            setUserState(action);
        } else {
            setUserState(action);
            if (action) queryClient.clear();
        }
    },
    [queryClient],
  );

  const incrementFreeContactsUsed = useCallback(() => {
    setUserState((currentUser) => {
      if (!currentUser?.subscription || currentUser.subscription.status !== 'FREE') {
        return currentUser;
      }
      return {
        ...currentUser,
        subscription: {
          ...currentUser.subscription,
          freeContactsUsed: currentUser.subscription.freeContactsUsed + 1,
        },
      };
    });
  }, []);

  const value = {
    user,
    setUser,
    isLoading,
    logout,
    signOut: logout, // AQUI ESTÁ A CORREÇÃO: signOut aponta para logout
    incrementFreeContactsUsed,
    socket,
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
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};