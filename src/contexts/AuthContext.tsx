import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
        // Silencioso no init
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    initAuth();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (!user) {
      if (socket) { socket.disconnect(); setSocket(null); }
      return;
    }
    let activeSocket: Socket | null = null;
    const connectSocket = async () => {
      const token = await storage.getToken();
      if (!token) return;
      activeSocket = io(ENV.API_URL, {
        auth: { token },
        transports: ['websocket'],
      });
      activeSocket.on('connect', () => setSocket(activeSocket));
    };
    connectSocket();
    return () => { if (activeSocket) activeSocket.disconnect(); };
  }, [user]);

  const signIn = useCallback(async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const token = response.data?.token || response.data?.accessToken || response.data?.data?.token;
      const userData = response.data?.user || response.data?.data?.user;

      if (!token) throw new Error('Token inválido.');

      const tokenString = typeof token === 'string' ? token : JSON.stringify(token);
      await storage.setToken(tokenString);
      setUserState(userData);
      queryClient.clear();
    } catch (error: any) {
      // REMOVIDO console.error para não sujar o Metro em erros 403 esperados [cite: 2025-11-14]
      throw error;
    }
  }, [queryClient]);

  const reactivateAccount = useCallback(async (credentials) => {
    try {
      const response = await api.post('/auth/reactivate', {
        email: credentials.email.trim(),
        password: credentials.password
      });

      const token = response.data?.token || response.data?.accessToken || response.data?.data?.token;
      const userData = response.data?.user || response.data?.data?.user;

      if (token) {
        const tokenString = typeof token === 'string' ? token : JSON.stringify(token);
        await storage.setToken(tokenString);
        setUserState(userData);
        queryClient.clear();
      }
    } catch (error) {
      throw error; 
    }
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
      return { ...curr, subscription: { ...curr.subscription, freeContactsUsed: (curr.subscription.freeContactsUsed || 0) + 1 } };
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
    <AuthContext.Provider value={{ user, setUser: setUserState, isLoading, signIn, reactivateAccount, logout, signOut: logout, incrementFreeContactsUsed, socket }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return context;
};