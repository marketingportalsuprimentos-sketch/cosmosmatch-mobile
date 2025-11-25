import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; 

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

// Tela Premium
import { PremiumScreen } from './src/screens/PremiumScreen';

import { TabBar } from './src/components/layout/TabBar';

// --- IMPORTAÇÃO ADICIONADA ---
import { navigationRef } from './src/navigation/navigationRef'; 

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

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <>
          <Stack.Screen name="MainTabs" component={AppTabs} />
          
          <Stack.Screen name="ChatConversation" component={ChatConversationScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={{ animation: 'slide_from_bottom' }} /> 
          <Stack.Screen name="NatalChartScreen" component={NatalChartScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="PublicProfile" component={ProfileScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="SynastryReport" component={SynastryReportScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="NumerologyConnection" component={NumerologyConnectionScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="SearchUsers" component={SearchUsersScreen} options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="BlockedProfiles" component={BlockedProfilesScreen} options={{ animation: 'slide_from_right' }} />
          
          {/* Rota Premium */}
          <Stack.Screen 
            name="Premium" 
            component={PremiumScreen} 
            options={{ 
              presentation: 'modal', 
              animation: 'slide_from_bottom'
            }} 
          />
        </>
      ) : (
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
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SafeAreaProvider>
            {/* --- REFERÊNCIA ADICIONADA AQUI --- */}
            <NavigationContainer ref={navigationRef}>
              <StatusBar style="light" />
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