import { NavigatorScreenParams } from '@react-navigation/native';

// Rotas das Abas (Barra de baixo)
export type MainTabParamList = {
  Discovery: undefined;
  Chat: undefined;
  Profile: undefined;
};

// Rotas da Pilha Principal (Telas cheias)
export type RootStackParamList = {
  Login: undefined;
  Register: undefined; // <--- Nova rota adicionada
  MainTabs: NavigatorScreenParams<MainTabParamList>; 
  ChatConversation: { conversationId: string; userName: string }; 
  ProfileScreen: { userId?: string }; 
  EditProfile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}