// mobile/src/screens/PleaseVerifyScreen.tsx

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  SafeAreaView, 
  Alert, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons'; 
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext'; 
import { api } from '../services/api';

export function PleaseVerifyScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigation = useNavigation<any>();

  // Estados
  const [isEditing, setIsEditing] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // === 1. LÓGICA DO PRAZO DE GRAÇA (Igual à Web) ===
  let isWithinGracePeriod = false;
  if (user?.createdAt) {
    const createdDate = new Date(user.createdAt);
    const now = new Date();
    // Diferença em horas
    const diffHours = Math.abs(now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);
    
    // Se for menor que 72h, permite continuar
    if (diffHours <= 72) {
      isWithinGracePeriod = true;
    }
  }

  // === HANDLERS ===

  const handleResendClick = async () => {
    setIsResending(true);
    try {
      await api.post('/auth/resend-verification-email');
      Alert.alert(t('success', 'Sucesso'), t('verify_alert_success', 'Link reenviado! Verifique sua caixa de entrada.'));
    } catch (error) {
      Alert.alert(t('error', 'Erro'), t('error_generic', 'Não foi possível reenviar. Tente novamente.'));
    } finally {
      setIsResending(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !password) {
      Alert.alert(t('attention', 'Atenção'), 'Preencha o novo email e sua senha atual.');
      return;
    }

    setIsLoading(true);
    try {
      // Chama a rota de atualização (ajustada para o padrão do backend)
      await api.patch('/auth/update-unverified-email', { newEmail, password });
      
      Alert.alert(t('success', 'Sucesso'), 'Email atualizado! Enviamos um novo link.');
      setIsEditing(false);
      setPassword('');
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Erro ao atualizar email.';
      Alert.alert(t('error', 'Erro'), msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    // Se o usuário clicar em continuar, vai para a edição de perfil (Onboarding)
    navigation.navigate('EditProfileScreen'); 
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          
          <View style={styles.iconBubble}>
            <Feather name="mail" size={48} color="#A78BFA" />
          </View>

          <Text style={styles.title}>{t('verify_title', 'Verifique seu Email')}</Text>

          {/* === MODO DE VISUALIZAÇÃO (PADRÃO) === */}
          {!isEditing ? (
            <View style={styles.mainCard}>
              <View style={styles.emailInfoContainer}>
                <Text style={styles.description}>{t('verify_sent_to', 'Enviamos um link para:')}</Text>
                <Text style={styles.emailHighlight}>{user?.email}</Text>
                
                <TouchableOpacity 
                  style={styles.wrongEmailBtn}
                  onPress={() => { setNewEmail(user?.email || ''); setIsEditing(true); }}
                >
                  <Feather name="edit-2" size={14} color="#A78BFA" />
                  <Text style={styles.wrongEmailText}>O e-mail está errado?</Text>
                </TouchableOpacity>
              </View>

              {/* Botão Principal: Reenviar */}
              <TouchableOpacity 
                style={[styles.button, styles.buttonPrimary]} 
                onPress={handleResendClick}
                disabled={isResending}
              >
                {isResending ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.buttonTextPrimary}>Reenviar Link</Text>
                )}
              </TouchableOpacity>

              {/* --- BLOCO DE GRAÇA OU BLOQUEIO --- */}
              <View style={styles.gracePeriodSection}>
                <View style={styles.divider} />
                
                {isWithinGracePeriod ? (
                  <>
                    <Text style={styles.graceText}>
                      Você pode confirmar o email depois.
                    </Text>
                    <TouchableOpacity 
                      style={[styles.button, styles.buttonOutline]} 
                      onPress={handleContinue}
                    >
                      <Text style={styles.buttonTextOutline}>Continuar para o Perfil</Text>
                      <Feather name="arrow-right" size={18} color="#D1D5DB" style={{marginLeft: 8}} />
                    </TouchableOpacity>
                  </>
                ) : (
                  <View style={styles.blockedContainer}>
                    <Ionicons name="ban" size={20} color="#F87171" />
                    <Text style={styles.blockedText}>
                      Seu período de teste acabou. Verifique o email para continuar.
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                <Feather name="log-out" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                <Text style={styles.logoutText}>{t('verify_logout', 'Sair / Trocar Conta')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* === MODO DE EDIÇÃO (CORRIGIR EMAIL) === */
            <View style={styles.editCard}>
              <Text style={styles.editTitle}>Corrigir Endereço:</Text>
              
              <View style={styles.inputGroup}>
                <TextInput
                  style={styles.input}
                  value={newEmail}
                  onChangeText={setNewEmail}
                  placeholder="Novo e-mail correto"
                  placeholderTextColor="#6b7280"
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, {marginBottom: 0}]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Confirme sua senha atual"
                    placeholderTextColor="#6b7280"
                    secureTextEntry
                  />
                  <Feather name="lock" size={16} color="#6B7280" style={styles.lockIcon} />
                </View>
              </View>

              <View style={styles.editButtonsRow}>
                <TouchableOpacity 
                  style={[styles.button, styles.buttonSecondary]} 
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.buttonTextSecondary}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.button, styles.buttonPurple, { flex: 1 }]} 
                  onPress={handleUpdateEmail}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Feather name="save" size={18} color="#FFF" style={{marginRight: 6}} />
                      <Text style={styles.buttonTextPrimary}>Salvar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  content: { flexGrow: 1, padding: 24, justifyContent: 'center', alignItems: 'center' },
  
  // Ícone Topo
  iconBubble: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: 20,
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)'
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 24, textAlign: 'center' },

  // Cards
  mainCard: { width: '100%' },
  emailInfoContainer: { 
    backgroundColor: '#1F2937', 
    padding: 20, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#374151',
    alignItems: 'center',
    marginBottom: 20
  },
  description: { color: '#9CA3AF', fontSize: 14, marginBottom: 4 },
  emailHighlight: { color: '#FFF', fontWeight: 'bold', fontSize: 18, marginBottom: 12, textAlign: 'center' },
  wrongEmailBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  wrongEmailText: { color: '#A78BFA', fontSize: 14 },

  // Botões
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonPrimary: { backgroundColor: '#6366F1', marginBottom: 20 },
  buttonPurple: { backgroundColor: '#7C3AED' },
  buttonSecondary: { backgroundColor: '#374151', marginRight: 10, flex: 1 },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#4B5563' },
  
  buttonTextPrimary: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  buttonTextSecondary: { color: '#D1D5DB', fontWeight: '600', fontSize: 14 },
  buttonTextOutline: { color: '#D1D5DB', fontWeight: '600', fontSize: 15 },

  // Seção Grace Period
  gracePeriodSection: { width: '100%' },
  divider: { height: 1, backgroundColor: '#374151', marginBottom: 20 },
  graceText: { color: '#6B7280', fontSize: 13, textAlign: 'center', marginBottom: 10 },
  
  // Bloqueio
  blockedContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center'
  },
  blockedText: { color: '#F87171', fontSize: 14, fontWeight: '600', flex: 1 },

  // Edit Mode Styles
  editCard: {
    width: '100%',
    backgroundColor: '#1F2937',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151'
  },
  editTitle: { color: '#FFF', fontWeight: 'bold', marginBottom: 16 },
  inputGroup: { gap: 12, marginBottom: 20 },
  input: {
    backgroundColor: '#111827',
    color: '#FFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  passwordContainer: { position: 'relative', justifyContent: 'center' },
  lockIcon: { position: 'absolute', right: 12 },
  editButtonsRow: { flexDirection: 'row' },

  // Logout
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 30 },
  logoutText: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
});