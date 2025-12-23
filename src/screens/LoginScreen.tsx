// mobile/src/screens/LoginScreen.tsx

import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, KeyboardAvoidingView, Platform, Image, Dimensions, Alert, Modal, TouchableWithoutFeedback, Keyboard 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, RotateCcw, X } from 'lucide-react-native'; // Certifique-se de ter esses ícones ou troque por outros

const { width } = Dimensions.get('window');

export function LoginScreen() {
  const navigation = useNavigation<any>();
  const { signIn, reactivateAccount, isLoading } = useAuth(); // Agora puxamos reactivateAccount
  const { t } = useTranslation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estado para armazenar credenciais se a conta estiver em quarentena
  const [quarantineCredentials, setQuarantineCredentials] = useState<{email: string, password: string} | null>(null);
  const [isReactivating, setIsReactivating] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Atenção', 'Preencha email e senha');
      return;
    }

    try {
      await signIn(email, password);
    } catch (error: any) {
      console.log("Erro no Login:", error);
      
      // --- DETECÇÃO DE QUARENTENA ---
      const errorMsg = error.response?.data?.message;
      if (errorMsg === 'ACCOUNT_IN_QUARANTINE') {
        // Se for quarentena, não mostra erro. Abre o modal.
        setQuarantineCredentials({ email, password });
        return;
      }

      // Erro normal
      const msg = errorMsg || error.message || 'Erro desconhecido';
      Alert.alert('Erro no Login', String(msg));
    }
  };

  const handleReactivate = async () => {
    if (!quarantineCredentials) return;

    try {
      setIsReactivating(true);
      await reactivateAccount(quarantineCredentials);
      // Se der certo, o AuthContext atualiza o user e o app navega automaticamente
      setQuarantineCredentials(null);
    } catch (error) {
      console.error(error);
      Alert.alert('Erro', 'Falha ao restaurar conta. Tente novamente.');
      setIsReactivating(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <Image 
        source={require('../../assets/splash-icon.png')} 
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', opacity: 0.2 }]} 
        resizeMode="cover"
      />
      
      <LinearGradient
        colors={['transparent', '#111827']}
        style={StyleSheet.absoluteFill}
      />

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
            <TextInput
              style={styles.input}
              placeholder={t('email_placeholder')}
              placeholderTextColor="#6B7280"
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              keyboardType="email-address"
              textContentType="emailAddress"
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

      {/* --- MODAL DE REATIVAÇÃO (QUARENTENA) --- */}
      <Modal 
        visible={!!quarantineCredentials}
        transparent
        animationType="fade"
        onRequestClose={() => setQuarantineCredentials(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.warningIconContainer}>
              <AlertTriangle size={40} color="#F59E0B" /> 
            </View>

            <Text style={styles.modalTitle}>Conta em Quarentena</Text>
            
            <Text style={styles.modalText}>
              Esta conta está agendada para exclusão. Se não fizer nada, ela será apagada permanentemente em breve.
            </Text>
            
            <Text style={[styles.modalText, { fontWeight: 'bold', color: '#F59E0B', marginTop: 10 }]}>
              Deseja restaurar sua conta agora?
            </Text>

            <TouchableOpacity 
              style={styles.restoreButton}
              onPress={handleReactivate}
              disabled={isReactivating}
            >
              {isReactivating ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <RotateCcw size={20} color="#FFF" style={{marginRight: 8}} />
                  <Text style={styles.restoreButtonText}>Sim, Restaurar Conta</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setQuarantineCredentials(null)}
              disabled={isReactivating}
            >
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

  // Estilos do Modal de Quarentena
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B', // Borda amarela para indicar atenção
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  warningIconContainer: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 16,
    borderRadius: 50,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'center'
  },
  modalText: {
    color: '#D1D5DB',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22
  },
  restoreButton: {
    flexDirection: 'row',
    backgroundColor: '#D97706', // Amarelo escuro/Laranja
    width: '100%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 12
  },
  restoreButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16
  },
  cancelButton: {
    padding: 12,
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 14
  }
});