import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabBar } from './TabBar'; // Importando seu componente customizado
// Importando as telas reais
import { DiscoveryScreen } from '../screens/DiscoveryScreen';
import { PostsScreen } from '../screens/PostsScreen'; // <--- MUDANÇA: Usando a tela correta
import { ChatListScreen } from '../screens/ChatListScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PostCreationScreen } from '../screens/PostCreationScreen'; 

const Tab = createBottomTabNavigator();

export const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="DiscoveryTab" 
        component={DiscoveryScreen} 
        options={{ title: 'Descoberta' }}
      />
      
      {/* CORREÇÃO: Agora 'FeedTab' carrega o 'PostsScreen' (sua lista TikTok) */}
      <Tab.Screen 
        name="FeedTab" 
        component={PostsScreen} 
        options={{ title: 'Feed' }}
      />

      <Tab.Screen 
        name="PostCreation" 
        component={PostCreationScreen} 
        options={{ 
          title: 'Novo',
          tabBarStyle: { display: 'none' } 
        }}
      />

      <Tab.Screen 
        name="ChatTab" 
        component={ChatListScreen} 
        options={{ title: 'Chat' }}
      />

      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileScreen} 
        options={{ title: 'Perfil' }}
      />
    </Tab.Navigator>
  );
};