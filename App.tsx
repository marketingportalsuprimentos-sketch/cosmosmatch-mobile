import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; 
import * as NavigationBar from 'expo-navigation-bar'; 

import { AuthProvider, useAuth } from './src/contexts/AuthContext'; 

// Screens Auth
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { ForgotPasswordScreen } from './src/screens/ForgotPasswordScreen';

// Screens App
import DiscoveryScreen from './src/screens/DiscoveryScreen'; 
import { PostsScreen } from './src/screens/PostsScreen'; 
import ProfileScreen from './src/screens/ProfileScreen'; 
import { ChatListScreen } from './src/screens/ChatListScreen'; 
import { ChatConversationScreen } from './src/screens/ChatConversationScreen';
import { EditProfileScreen } from './src/screens/EditProfileScreen';
import { NatalChartScreen } from './src/screens/NatalChartScreen';
import { SynastryReportScreen } from './src/screens/SynastryReportScreen';
import { NumerologyConnectionScreen } from './src/screens/NumerologyConnectionScreen';
import { SearchUsersScreen } from './src/screens/SearchUsersScreen';
import PostCreationScreen from './src/screens/PostCreationScreen';
import BlockedProfilesScreen from './src/screens/BlockedProfilesScreen';

// Tela de Verificação
import { PleaseVerifyScreen } from './src/screens/PleaseVerifyScreen';

// Tela Premium
import { PremiumScreen } from './src/screens/PremiumScreen';

import { TabBar } from './src/components/layout/TabBar';
import { navigationRef } from './src/navigation/navigationRef'; 

import './src/i18n'; 

// === CONFIGURAÇÃO DE REGRAS ===
const GRACE_PERIOD_HOURS = 36; // Bloqueia após 36 horas
const NEW_REGISTRATION_MINUTES = 5; // Considera "Novo Cadastro" nos primeiros 5 min

const queryClient = new QueryClient();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AppTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="DiscoveryTab" component={DiscoveryScreen} />
      <Tab.Screen name="FeedTab" component={PostsScreen} />
      <Tab.Screen name="PostCreation" component={PostCreationScreen} />
      <Tab.Screen name="ChatTab" component={ChatListScreen} /> 
      <Tab.Screen name="ProfileTab" component={ProfileScreen} /> 
    </Tab.Navigator>
  );
}

const AppNavigator = () => {
  const { user, isLoading } = useAuth(); 

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7C3AED" />
      </View>
    );
  }

  // === LÓGICA DE NAVEGAÇÃO INTELIGENTE ===
  let isBlocked = false;
  let isJustRegistered = false;

  if (user) {
    const isVerified = (user as any).emailVerified === true;

    if (!isVerified) {
      // Calcula tempos
      const createdAt = (user as any).createdAt ? new Date((user as any).createdAt) : new Date();
      const now = new Date();
      const diffInMs = now.getTime() - createdAt.getTime();
      const diffInHours = diffInMs / (1000 * 60 * 60);
      const diffInMinutes = diffInMs / (1000 * 60);

      // REGRA 3 (Cadastro): Se acabou de criar (menos de 5 min), força o fluxo de verificação
      if (diffInMinutes < NEW_REGISTRATION_MINUTES) {
        isJustRegistered = true;
      }
      
      // REGRA 2 (Bloqueio): Se passou de 36h, bloqueia
      if (diffInHours > GRACE_PERIOD_HOURS) {
        isBlocked = true;
      }
    }
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        // === USUÁRIO LOGADO ===
        isBlocked ? (
          // CENÁRIO: BLOQUEADO (> 36h)
          // Só vê a tela de verificação
          <>
            <Stack.Screen name="PleaseVerify" component={PleaseVerifyScreen} />
            {/* Deixamos EditProfile acessível caso precise corrigir o email */}
            <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={{ animation: 'slide_from_bottom' }} /> 
          </>
        ) : (
          // CENÁRIO: LIBERADO (Verificado ou < 36h)
          <>
            {/* LÓGICA DE PRIORIDADE DA TELA INICIAL */}
            
            {isJustRegistered ? (
               // Se acabou de cadastrar: 1º Tela é Verificação -> Continuar -> EditProfile
               <Stack.Screen name="PleaseVerify" component={PleaseVerifyScreen} />
            ) : (
               // Se é login normal: 1º Tela é Descoberta
               <Stack.Screen name="MainTabs" component={AppTabs} />
            )}

            {/* Definimos as rotas restantes para a navegação funcionar */}
            
            {isJustRegistered ? (
               <Stack.Screen name="MainTabs" component={AppTabs} />
            ) : (
               <Stack.Screen name="PleaseVerify" component={PleaseVerifyScreen} />
            )}
            
            <Stack.Screen name="ChatConversation" component={ChatConversationScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={{ animation: 'slide_from_bottom' }} /> 
            <Stack.Screen name="NatalChartScreen" component={NatalChartScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="PublicProfile" component={ProfileScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="SynastryReport" component={SynastryReportScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="NumerologyConnection" component={NumerologyConnectionScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="SearchUsers" component={SearchUsersScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="BlockedProfiles" component={BlockedProfilesScreen} options={{ animation: 'slide_from_right' }} />
            
            <Stack.Screen 
              name="Premium" 
              component={PremiumScreen} 
              options={{ 
                presentation: 'modal', 
                animation: 'slide_from_bottom'
              }} 
            />
          </>
        )
      ) : (
        // === NÃO LOGADO ===
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  
  useEffect(() => {
    const configureImmersiveMode = async () => {
      if (Platform.OS === 'android') {
        try {
          await NavigationBar.setVisibilityAsync('hidden');
          await NavigationBar.setBehaviorAsync('overlay-swipe');
          await NavigationBar.setBackgroundColorAsync('#00000000');
        } catch (e) {
          console.log("Erro ao configurar barra imersiva:", e);
        }
      }
    };
    configureImmersiveMode();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SafeAreaProvider>
            <NavigationContainer ref={navigationRef}>
              <StatusBar style="light" translucent backgroundColor="transparent" />
              <AppNavigator />
            </NavigationContainer>
          </SafeAreaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
});