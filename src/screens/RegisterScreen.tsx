import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Alert,
  TextInput
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Lógica
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { registerSchema, RegisterDto, AuthResponse } from '../types/auth.types';
import { storage } from '../lib/storage';

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const { setUser } = useAuth();
  
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterDto>({
    resolver: zodResolver(registerSchema),
  });

  const onRegister = async (data: RegisterDto) => {
    try {
      // Remove confirmPassword antes de enviar (igual à Web)
      const { confirmPassword, ...payload } = data;
      
      const response = await api.post<AuthResponse>('/auth/register', payload);
      const { accessToken, user } = response.data;
      
      await storage.setToken(accessToken);
      setUser(user);
      // Redirecionamento automático pelo App.tsx
      
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Erro ao criar conta. Tente novamente.';
      Alert.alert('Erro de Registro', msg);
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
          
          {/* --- CABEÇALHO (Igual ao Login) --- */}
          <View style={styles.headerContainer}>
             {/* Título "CosmosMatch" em Indigo */}
            <Text style={styles.title}>CosmosMatch</Text>
          </View>

          {/* --- FORMULÁRIO --- */}
          <View style={styles.formContainer}>
            
            {/* NOME (Exibição) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome (Exibição)</Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="words"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                )}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
            </View>

            {/* USERNAME (@) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome de Utilizador (o seu @)</Text>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    style={styles.input}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoCapitalize="none"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                  />
                )}
              />
              {/* Helper text igual da Web */}
              <Text style={styles.helperText}>(Apenas letras, números e _. Ex: joao_silva)</Text>
              {errors.username && <Text style={styles.errorText}>{errors.username.message}</Text>}
            </View>

            {/* EMAIL */}
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
                  />
                )}
              />
              {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
            </View>

            {/* SENHA */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
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

            {/* CONFIRMAR SENHA */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Senha</Text>
              <Controller
                control={control}
                name="confirmPassword"
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
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword.message}</Text>}
            </View>

            {/* BOTÃO CRIAR CONTA */}
            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit(onRegister)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>Criar conta</Text>
              )}
            </TouchableOpacity>

          </View>

          {/* --- RODAPÉ --- */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Já é membro? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Entre na sua conta</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- ESTILOS (Idênticos ao LoginScreen para consistência) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // bg-gray-900
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24, // px-6
    paddingVertical: 48,   // py-12
  },
  
  // Header
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 'bold',
    color: '#6366F1', // text-indigo-500
    letterSpacing: -0.5,
  },

  // Form
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24, // space-y-6
  },
  label: {
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
    color: '#D1D5DB', // text-gray-300
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12, // text-xs
    color: '#9CA3AF', // text-gray-400
    marginTop: 4,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', // bg-white/5
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#FFF',
    fontSize: 14,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#F87171', // text-red-400
  },

  // Botão
  submitButton: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#6366F1', // bg-indigo-500
    paddingVertical: 10,
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },

  // Footer
  footer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF', // text-gray-400
  },
  loginLink: {
    fontSize: 14, 
    fontWeight: '600',
    color: '#818CF8', // text-indigo-400
    marginLeft: 4,
  }
});