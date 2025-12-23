// mobile/src/navigation/navigation.types.ts
import { NavigatorScreenParams } from '@react-navigation/native';

// Rotas das Abas (Barra de baixo)
export type MainTabParamList = {
  DiscoveryTab: undefined;
  FeedTab: undefined;
  PostCreation: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

// Rotas da Pilha Principal (Telas cheias)
export type RootStackParamList = {
  // Auth
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  
  // App
  MainTabs: NavigatorScreenParams<MainTabParamList>; 
  
  // Telas Específicas
  ChatConversation: { conversationId: string; userName: string; avatarUrl?: string }; 
  PublicProfile: { userId: string }; 
  EditProfileScreen: undefined;
  NatalChartScreen: undefined;
  SynastryReport: { targetUserId: string };
  NumerologyConnection: { targetUserId: string };
  SearchUsers: undefined;
  BlockedProfiles: undefined;
  
  // Telas Especiais
  PleaseVerifyScreen: undefined; // <--- ROTA CORRIGIDA AQUI
  Premium: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}