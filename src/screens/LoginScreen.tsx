import React, { useState, useMemo, memo } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform, Image, Dimensions, Alert, Modal, ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react-native'; 

const { width, height } = Dimensions.get('window');

const LoginForm = memo(({ onLogin, isLoading, t }: any) => {
  const [localEmail, setLocalEmail] = useState('');
  const [localPassword, setLocalPassword] = useState('');

  return (
    <View style={styles.form}>
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          placeholder={t('email_placeholder')}
          placeholderTextColor="#6B7280"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={localEmail}
          onChangeText={setLocalEmail}
        />
      </View>

      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          placeholder={t('password_placeholder')}
          placeholderTextColor="#6B7280"
          secureTextEntry
          value={localPassword}
          onChangeText={setLocalPassword}
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity 
        style={styles.button} 
        onPress={() => onLogin(localEmail, localPassword)}
        disabled={isLoading}
      >
        {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>{t('login_button')}</Text>}
      </TouchableOpacity>
    </View>
  );
});

export function LoginScreen() {
  const navigation = useNavigation<any>();
  const { signIn, reactivateAccount, isLoading: authLoading } = useAuth();
  const { t } = useTranslation();

  const [quarantineCredentials, setQuarantineCredentials] = useState<{email: string, password: string} | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);

  const Background = useMemo(() => (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image 
        source={require('../../assets/splash-icon.png')} 
        style={{ width, height, opacity: 0.1, position: 'absolute' }} 
        resizeMode="cover" 
      />
      <LinearGradient colors={['transparent', '#111827']} style={StyleSheet.absoluteFill} />
    </View>
  ), []);

  const handleLogin = async (emailValue: string, passwordValue: string) => {
    try {
      await signIn(emailValue, passwordValue);
    } catch (error: any) {
      if (error.response?.status === 403) {
        setQuarantineCredentials({ email: emailValue, password: passwordValue });
        return;
      }
      Alert.alert('Erro', error.response?.data?.message || 'Falha no login');
    }
  };

  const handleReactivate = async () => {
    if (!quarantineCredentials) return;
    try {
      setIsReactivating(true);
      await reactivateAccount(quarantineCredentials);
      setQuarantineCredentials(null);
      
      // PASSO A PASSO: Se a conta é reativada, entra direto no Discovery sem passar pelo PleaseVerifyScreen [cite: 2025-11-14]
      // Se ele ainda estiver dentro das 72h, o app deixará ele usar normalmente.
      navigation.replace('MainTabs'); 
      
    } catch (error) {
      Alert.alert('Erro', 'Falha ao restaurar.');
    } finally {
      setIsReactivating(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {Background}

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" bounces={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('welcome_back')}</Text>
            <Text style={styles.subtitle}>{t('login_subtitle')}</Text>
          </View>

          <LoginForm onLogin={handleLogin} isLoading={authLoading} t={t} />

          <View style={styles.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={styles.link}>{t('forgot_password')}</Text>
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', marginTop: 20 }}>
              <Text style={styles.footerText}>{t('no_account')} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.link}>{t('register_link')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={!!quarantineCredentials} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AlertTriangle size={40} color="#F59E0B" />
            <Text style={styles.modalTitle}>Conta em Quarentena</Text>
            <Text style={styles.modalText}>Deseja restaurar sua conta?</Text>
            
            <TouchableOpacity 
              style={styles.restoreButton} 
              onPress={handleReactivate} 
              disabled={isReactivating}
            >
              {isReactivating ? <ActivityIndicator color="#FFF" /> : <Text style={styles.restoreButtonText}>Sim, Restaurar Conta</Text>}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={() => setQuarantineCredentials(null)}>
              <Text style={styles.cancelButtonText}>Não, manter excluída</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 40, alignItems: 'center' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  subtitle: { fontSize: 16, color: '#9CA3AF', marginTop: 8 },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  input: { backgroundColor: '#1F2937', borderRadius: 12, padding: 16, color: '#FFF', fontSize: 16, borderWidth: 1, borderColor: '#374151' },
  button: { backgroundColor: '#7C3AED', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  footer: { alignItems: 'center', marginTop: 24 },
  footerText: { color: '#9CA3AF' },
  link: { color: '#8B5CF6', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { width: '100%', backgroundColor: '#1F2937', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#F59E0B' },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF', marginTop: 16 },
  modalText: { color: '#D1D5DB', textAlign: 'center', marginTop: 10 },
  restoreButton: { backgroundColor: '#D97706', width: '100%', padding: 16, borderRadius: 12, marginTop: 20, alignItems: 'center' },
  restoreButtonText: { color: '#FFF', fontWeight: 'bold' },
  cancelButton: { marginTop: 15 },
  cancelButtonText: { color: '#9CA3AF' }
});