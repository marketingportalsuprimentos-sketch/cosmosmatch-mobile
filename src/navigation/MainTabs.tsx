import React, { useEffect } from 'react'; 
import { Platform } from 'react-native'; 
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as NavigationBar from 'expo-navigation-bar'; 

import { TabBar } from '../components/layout/TabBar'; 
import { DiscoveryScreen } from '../screens/DiscoveryScreen';
import { PostsScreen } from '../screens/PostsScreen';
import { ChatListScreen } from '../screens/ChatListScreen'; 
import ProfileScreen from '../screens/ProfileScreen'; // Ajustado para import default
import { PostCreationScreen } from '../screens/PostCreationScreen'; 
import BlockedProfilesScreen from '../screens/BlockedProfilesScreen'; // Novo Import

const Tab = createBottomTabNavigator();

export const MainTabs = () => {

  // --- CONFIGURAÇÃO GLOBAL DE IMERSÃO (SEM PISCAR) ---
  useEffect(() => {
    const setImmersiveMode = async () => {
      if (Platform.OS === 'android') {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('overlay-swipe');
          await NavigationBar.setBackgroundColorAsync('#00000000');
        } catch (e) {
          console.log('Erro ao configurar barra Android', e);
        }
      }
    };
    setImmersiveMode();
  }, []); 

  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="DiscoveryTab" component={DiscoveryScreen} options={{ title: 'Descoberta' }} />
      <Tab.Screen name="FeedTab" component={PostsScreen} options={{ title: 'Feed' }} />
      
      <Tab.Screen 
        name="PostCreation" 
        component={PostCreationScreen} 
        options={{ title: 'Novo', tabBarStyle: { display: 'none' } }}
      />

      <Tab.Screen name="ChatTab" component={ChatListScreen} options={{ title: 'Chat' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Perfil' }} />

      {/* Rota para Gerenciar Bloqueados - Registrada aqui para ser acessível via navegação */}
      <Tab.Screen 
        name="BlockedProfiles" 
        component={BlockedProfilesScreen} 
        options={{ 
          tabBarButton: () => null, // Não mostra o ícone na barra
          tabBarStyle: { display: 'none' } // Esconde a barra nesta tela
        }} 
      />
    </Tab.Navigator>
  );
};