import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform, Image, Dimensions, Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

export function LoginScreen() {
  const navigation = useNavigation<any>();
  const { signIn, isLoading } = useAuth();
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    // Validação básica para evitar chamadas vazias
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha email e senha');
      return;
    }

    try {
      await signIn(email, password);
    } catch (error: any) {
      console.log("Erro no Login:", error);
      const msg = error.response?.data?.message || error.message || 'Erro desconhecido';
      Alert.alert('Erro no Login', String(msg));
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Imagem de Fundo Suave */}
      <Image 
        source={require('../../assets/splash-icon.png')} 
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.2 }]} 
        resizeMode="cover"
      />
      
      <LinearGradient
        colors={['transparent', '#111827']}
        style={StyleSheet.absoluteFill}
      />

      {/* Behavior padding no iOS evita que o teclado cubra o input, mas sem pular a tela */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{t('welcome_back')}</Text>
          <Text style={styles.subtitle}>{t('login_subtitle')}</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            {/* CORREÇÃO DO PULA-PULA NO IOS AQUI: */}
            <TextInput
              style={styles.input}
              placeholder={t('email_placeholder')}
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              
              // Essas 3 linhas desligam o corretor que faz a tela tremer
              autoCorrect={false}
              spellCheck={false}
              keyboardType="email-address"
              textContentType="emailAddress" // Ajuda o iOS a saber que é email
              
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <TextInput
              style={styles.input}
              placeholder={t('password_placeholder')}
              placeholderTextColor="#6B7280"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity 
            style={styles.forgotPassword}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>{t('forgot_password')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.button}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>{t('login_button')}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('no_account')} </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.link}>{t('register_link')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  content: { flex: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#9CA3AF', textAlign: 'center' },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  input: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
  },
  forgotPassword: { alignSelf: 'flex-end' },
  forgotText: { color: '#8B5CF6', fontSize: 14 },
  button: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#9CA3AF' },
  link: { color: '#8B5CF6', fontWeight: 'bold' },
});