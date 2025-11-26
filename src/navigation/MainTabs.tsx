import React, { useEffect } from 'react'; // Importar useEffect
import { Platform } from 'react-native'; // Importar Platform
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as NavigationBar from 'expo-navigation-bar'; // Importar a ferramenta

import { TabBar } from '../components/layout/TabBar'; 
import { DiscoveryScreen } from '../screens/DiscoveryScreen';
import { PostsScreen } from '../screens/PostsScreen';
import { ChatListScreen } from '../screens/ChatListScreen'; 
import { ProfileScreen } from '../screens/ProfileScreen';
import { PostCreationScreen } from '../screens/PostCreationScreen'; 

const Tab = createBottomTabNavigator();

export const MainTabs = () => {

  // --- CONFIGURAÇÃO GLOBAL DE IMERSÃO (SEM PISCAR) ---
  useEffect(() => {
    const setImmersiveMode = async () => {
      if (Platform.OS === 'android') {
        try {
          // Configura uma vez para todas as abas
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('overlay-swipe');
          await NavigationBar.setBackgroundColorAsync('#00000000');
        } catch (e) {
          console.log('Erro ao configurar barra Android', e);
        }
      }
    };
    setImmersiveMode();
  }, []); // Roda apenas uma vez ao carregar as abas

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
    </Tab.Navigator>
  );
};