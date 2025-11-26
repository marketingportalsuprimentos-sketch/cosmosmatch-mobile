import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, 
  KeyboardAvoidingView, Platform, ScrollView, Alert
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next'; // <--- I18N

import { api } from '../services/api';
import { forgotPasswordSchema, ForgotPasswordDto } from '../types/auth.types';

export const ForgotPasswordScreen = () => {
  const navigation = useNavigation<any>();
  const { t } = useTranslation(); // <--- HOOK
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordDto>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSend = async (data: ForgotPasswordDto) => {
    try {
      await api.post('/auth/forgot-password', data);
      setIsSuccess(true);
    } catch (error: any) {
      const msg = error.response?.data?.message || t('email_sent_error');
      Alert.alert(t('error'), msg);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.contentContainer}>
            
            <View style={styles.header}>
              <Text style={styles.title}>{t('forgot_password_title')}</Text>
              <Text style={styles.subtitle}>
                {isSuccess ? t('forgot_success_subtitle') : t('forgot_password_subtitle')}
              </Text>
            </View>

            {isSuccess ? (
              <View style={styles.card}>
                <View style={styles.iconContainer}>
                    <Ionicons name="mail-unread-outline" size={48} color="#818CF8" />
                </View>
                <Text style={styles.successText}>{t('forgot_success_msg')}</Text>

                <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.buttonText}>{t('back_to_login')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.card}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('email_label')}</Text>
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
                    <Text style={styles.buttonText}>{t('send_recovery_link')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {!isSuccess && (
              <View style={styles.footer}>
                <Text style={styles.footerText}>{t('remembered_password')} </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.linkText}>{t('login_action')}</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  contentContainer: { width: '100%', maxWidth: 450, alignSelf: 'center', gap: 24 },
  header: { alignItems: 'center' },
  title: { fontSize: 30, fontWeight: 'bold', color: '#818CF8', marginBottom: 8, textAlign: 'center' },
  subtitle: { color: '#9CA3AF', textAlign: 'center', fontSize: 14 },
  card: { backgroundColor: '#1F2937', borderRadius: 8, padding: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 8 },
  iconContainer: { alignItems: 'center', marginBottom: 16 },
  successText: { color: '#FFF', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#D1D5DB', marginBottom: 8 },
  input: { backgroundColor: '#374151', borderRadius: 6, borderWidth: 0, color: '#FFF', paddingVertical: 10, paddingHorizontal: 12, fontSize: 14 },
  errorText: { marginTop: 4, fontSize: 12, color: '#F87171' },
  button: { backgroundColor: '#4F46E5', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  footerText: { color: '#9CA3AF', fontSize: 14 },
  linkText: { color: '#818CF8', fontWeight: '500', marginLeft: 4 },
});