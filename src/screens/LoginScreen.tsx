import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Lógica e Tipos
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { loginSchema, LoginDto, AuthResponse } from '../types/auth.types';
import { storage } from '../lib/storage';

export const LoginScreen = () => {
  const navigation = useNavigation<any>();
  const { setUser } = useAuth();
  
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginDto>({
    resolver: zodResolver(loginSchema),
  });

  const onLogin = async (data: LoginDto) => {
    try {
      const response = await api.post<AuthResponse>('/auth/login', data);
      const { accessToken, user } = response.data;
      
      await storage.setToken(accessToken);
      setUser(user);
      
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Ocorreu um erro inesperado. Tente novamente.';
      Alert.alert('Erro', msg);
    }
  };

  return (
    // bg-gray-900 (#111827)
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* --- CABEÇALHO --- */}
          <View style={styles.headerContainer}>
            {/* Logo comentado na web, mantive a estrutura invisível se precisar */}
            {/* Título: text-indigo-500 text-3xl font-bold */}
            <Text style={styles.title}>CosmosMatch</Text>
          </View>

          {/* --- FORMULÁRIO --- */}
          <View style={styles.formContainer}>
            
            {/* CAMPO EMAIL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Endereço de email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    placeholderTextColor="rgba(255,255,255,0.3)" // Fallback sutil
                  />
                )}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </View>

            {/* CAMPO SENHA (Com Layout Especial: Label + Link na mesma linha) */}
            <View style={styles.inputGroup}>
              <View style={styles.passwordHeader}>
                <Text style={styles.label}>Senha</Text>
                <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                  {/* text-indigo-400 hover:text-indigo-300 font-semibold */}
                  <Text style={styles.forgotLink}>Esqueceu a senha?</Text>
                </TouchableOpacity>
              </View>
              
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    secureTextEntry
                    autoCapitalize="none"
                  />
                )}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}
            </View>

            {/* BOTÃO ENTRAR */}
            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit(onLogin)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Entrar</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* --- RODAPÉ --- */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Não é membro? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              {/* text-indigo-400 font-semibold */}
              <Text style={styles.createAccountLink}>Crie sua conta</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- ESTILOS (Tradução Tailwind -> StyleSheet) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // bg-gray-900
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24, // px-6 (mobile) / lg:px-8
    paddingVertical: 48,   // py-12
  },
  
  // Header
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40, // mt-10 da div do form
  },
  title: {
    marginTop: 24, // mt-6
    textAlign: 'center',
    fontSize: 30, // text-3xl
    fontWeight: 'bold', // font-bold
    color: '#6366F1', // text-indigo-500
    letterSpacing: -0.5, // tracking-tight
  },

  // Form
  formContainer: {
    width: '100%',
    // sm:max-w-sm (No mobile ocupa 100% do padding)
  },
  inputGroup: {
    marginBottom: 24, // space-y-6 (Aprox 24px entre elementos)
  },
  
  // Labels & Links
  label: {
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
    color: '#D1D5DB', // text-gray-300
    marginBottom: 8, // mt-2 do input
    lineHeight: 20, // leading-6
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Label na esquerda, Link na direita
    alignItems: 'center',
  },
  forgotLink: {
    fontSize: 14, // text-sm
    fontWeight: '600', // font-semibold
    color: '#818CF8', // text-indigo-400
  },

  // Inputs
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // bg-white/5
    borderRadius: 6, // rounded-md
    borderWidth: 1, // ring-1
    borderColor: 'rgba(255, 255, 255, 0.1)', // ring-white/10
    paddingVertical: 10, // py-1.5 (ajustado para toque mobile)
    paddingHorizontal: 12,
    color: '#FFF', // text-white
    fontSize: 14, // sm:text-sm
    shadowColor: "#000", // shadow-sm
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  errorText: {
    marginTop: 8, // mt-2
    fontSize: 14, // text-sm
    color: '#F87171', // text-red-400
  },

  // Botão
  submitButton: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6, // rounded-md
    backgroundColor: '#6366F1', // bg-indigo-500
    paddingVertical: 10, // py-1.5 (ajustado para toque)
    shadowColor: "#000", // shadow-sm
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  buttonDisabled: {
    opacity: 0.5, // disabled:opacity-50
  },
  submitButtonText: {
    fontSize: 14, // text-sm
    fontWeight: '600', // font-semibold
    color: '#FFF', // text-white
  },

  // Footer
  footer: {
    marginTop: 40, // mt-10
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14, // text-sm
    color: '#9CA3AF', // text-gray-400
  },
  createAccountLink: {
    fontSize: 14, 
    fontWeight: '600', // font-semibold
    color: '#818CF8', // text-indigo-400
    marginLeft: 4,
  }
});