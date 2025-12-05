// mobile/src/screens/RegisterScreen.tsx
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
  TextInput,
  Linking // <--- IMPORTANTE: Adicionado para abrir links
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { registerSchema, RegisterDto, AuthResponse } from '../types/auth.types';
import { storage } from '../lib/storage';

export const RegisterScreen = () => {
  const navigation = useNavigation<any>();
  const { setUser } = useAuth();
  const { t } = useTranslation();
  
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterDto>({
    resolver: zodResolver(registerSchema),
  });

  const onRegister = async (data: RegisterDto) => {
    try {
      const { confirmPassword, ...payload } = data;
      
      const response = await api.post<AuthResponse>('/auth/register', payload);
      const { accessToken, user } = response.data;
      
      await storage.setToken(accessToken);
      setUser(user);
      
    } catch (error: any) {
      const msg = error.response?.data?.message || t('error');
      Alert.alert(t('error'), msg);
    }
  };

  // --- FUNÇÕES PARA ABRIR OS LINKS ---
  const openTerms = () => Linking.openURL('https://cosmosmatch-frontend.vercel.app/terms');
  const openPrivacy = () => Linking.openURL('https://cosmosmatch-frontend.vercel.app/privacy');

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.headerContainer}>
            <Text style={styles.title}>{t('app_name')}</Text>
          </View>

          <View style={styles.formContainer}>
            
            {/* NOME */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('name_placeholder')}</Text>
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

            {/* USERNAME */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('username_label')}</Text>
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
              <Text style={styles.helperText}>{t('username_helper')}</Text>
              {errors.username && <Text style={styles.errorText}>{errors.username.message}</Text>}
            </View>

            {/* EMAIL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('email_placeholder')}</Text>
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
              <Text style={styles.label}>{t('password_placeholder')}</Text>
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
              <Text style={styles.label}>{t('confirm_password_label')}</Text>
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

            {/* --- NOVO: AVISO LEGAL (Acima do botão) --- */}
            <View style={styles.legalContainer}>
              <Text style={styles.legalText}>
                Ao se cadastrar, você concorda com nossos{' '}
                <Text style={styles.legalLink} onPress={openTerms}>
                  Termos de Uso
                </Text>
                {' '}e{' '}
                <Text style={styles.legalLink} onPress={openPrivacy}>
                  Política de Privacidade
                </Text>.
              </Text>
            </View>

            {/* BOTÃO */}
            <TouchableOpacity 
              style={[styles.submitButton, isSubmitting && styles.buttonDisabled]}
              onPress={handleSubmit(onRegister)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.submitButtonText}>{t('register_button')}</Text>
              )}
            </TouchableOpacity>

          </View>

          {/* RODAPÉ */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('already_account')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>{t('login_link')}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', 
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24, 
    paddingVertical: 48,   
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 30,
    fontWeight: 'bold',
    color: '#6366F1', 
    letterSpacing: -0.5,
  },
  formContainer: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: 24, 
  },
  label: {
    fontSize: 14, 
    fontWeight: '500', 
    color: '#D1D5DB', 
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12, 
    color: '#9CA3AF', 
    marginTop: 4,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
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
    color: '#F87171', 
  },
  // ESTILOS DO TEXTO LEGAL
  legalContainer: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  legalText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  legalLink: {
    color: '#818CF8',
    fontWeight: '600',
  },
  submitButton: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 6,
    backgroundColor: '#6366F1', 
    paddingVertical: 10,
    marginTop: 0, // Ajustado pois agora tem o texto acima
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  footer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF', 
  },
  loginLink: {
    fontSize: 14, 
    fontWeight: '600',
    color: '#818CF8', 
    marginLeft: 4,
  }
});