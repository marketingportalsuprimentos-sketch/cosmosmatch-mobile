import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';

// Lógica
import { api } from '../services/api';
import { forgotPasswordSchema, ForgotPasswordDto } from '../types/auth.types';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const [isSuccess, setIsSuccess] = useState(false); // Estado local para controlar a UI
  
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordDto>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSend = async (data: ForgotPasswordDto) => {
    try {
      // Chamada direta à API, igual ao hook useForgotPassword da web
      await api.post('/auth/forgot-password', data);
      
      // Se der certo, mudamos o estado para mostrar o card de sucesso
      setIsSuccess(true);
      
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Falha ao enviar email. Tente novamente.';
      Alert.alert('Erro', msg);
    }
  };

  return (
    // bg-gray-900 (#111827) - Igual à Web
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.contentContainer}>
            
            {/* --- CABEÇALHO --- */}
            <View style={styles.header}>
              {/* text-indigo-400 (#818CF8) */}
              <Text style={styles.title}>Recuperar Senha</Text>
              <Text style={styles.subtitle}>
                {isSuccess
                  ? 'Verifique a sua caixa de entrada.'
                  : 'Digite seu email para receber o link de recuperação.'}
              </Text>
            </View>

            {isSuccess ? (
              // --- CARD DE SUCESSO (bg-gray-800) ---
              <View style={styles.card}>
                <View style={styles.iconContainer}>
                    <Ionicons name="mail-unread-outline" size={48} color="#818CF8" />
                </View>
                <Text style={styles.successText}>
                  Se este email estiver registrado, enviaremos um link com as
                  instruções para redefinir sua senha.
                </Text>

                <TouchableOpacity 
                  style={styles.button}
                  onPress={() => navigation.navigate('Login')}
                >
                  <Text style={styles.buttonText}>Voltar para o Login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // --- CARD DO FORMULÁRIO (bg-gray-800) ---
              <View style={styles.card}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email</Text>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextInput
                        // bg-gray-700 na Web, aqui usamos um tom mais claro que o card 800
                        style={styles.input}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        placeholderTextColor="rgba(156, 163, 175, 0.5)"
                      />
                    )}
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                </View>

                <TouchableOpacity 
                  style={[styles.button, isSubmitting && styles.buttonDisabled]}
                  onPress={handleSubmit(onSend)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonText}>Enviar Link de Recuperação</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* --- RODAPÉ --- */}
            {!isSuccess && (
              <View style={styles.footer}>
                <Text style={styles.footerText}>Lembrou-se da senha? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.linkText}>Fazer login</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// --- ESTILOS (Baseados no Tailwind da Web) ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // bg-gray-900
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 450, // max-w-md
    alignSelf: 'center',
    gap: 24, // space-y-6
  },
  
  // Header
  header: {
    alignItems: 'center',
  },
  title: {
    fontSize: 30, // text-3xl
    fontWeight: 'bold',
    color: '#818CF8', // text-indigo-400
    marginBottom: 8,
  },
  subtitle: {
    color: '#9CA3AF', // text-gray-400
    textAlign: 'center',
    fontSize: 14,
  },

  // Card (bg-gray-800)
  card: {
    backgroundColor: '#1F2937', // bg-gray-800
    borderRadius: 8, // rounded-lg
    padding: 24, // p-6
    shadowColor: "#000", // shadow-lg
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  
  // Sucesso
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  successText: {
    color: '#FFF', // text-white
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },

  // Inputs
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#D1D5DB', // text-gray-300
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151', // bg-gray-700 (Mais claro que o card)
    borderRadius: 6,
    borderWidth: 0, // border-0
    color: '#FFF',
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    // Focus ring simulado (opcional, no mobile o nativo lida com foco)
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#F87171', // text-red-400
  },

  // Botão
  button: {
    backgroundColor: '#4F46E5', // bg-indigo-600
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  footerText: {
    color: '#9CA3AF', // text-gray-400
    fontSize: 14,
  },
  linkText: {
    color: '#818CF8', // text-indigo-400
    fontWeight: '500',
    marginLeft: 4,
  },
});