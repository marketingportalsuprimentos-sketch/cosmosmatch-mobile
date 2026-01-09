import React, { useState, memo, useEffect } from 'react';
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
  Platform,
  Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons'; 
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext'; 
import { api } from '../services/api';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const EditEmailForm = memo(({ initialEmail, onSave, onCancel, isLoading }: any) => {
  const [localEmail, setLocalEmail] = useState(initialEmail);
  const [localPassword, setLocalPassword] = useState('');

  return (
    <View style={styles.editCard}>
      <Text style={styles.editTitle}>Novo Endereço:</Text>
      
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          value={localEmail}
          onChangeText={setLocalEmail}
          placeholder="Novo e-mail"
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TextInput
          style={styles.input}
          value={localPassword}
          onChangeText={setLocalPassword}
          placeholder="Sua senha atual"
          placeholderTextColor="#6b7280"
          secureTextEntry
        />
      </View>

      <View style={styles.editButtonsRow}>
        <TouchableOpacity 
          style={[styles.button, styles.buttonSecondary, { flex: 1, marginRight: 8 }]} 
          onPress={onCancel} 
          disabled={isLoading}
        >
          <Text style={styles.buttonTextSecondary}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.button, { backgroundColor: '#8B5CF6', flex: 1 }]} 
          onPress={() => onSave(localEmail, localPassword)} 
          disabled={isLoading}
        >
          {isLoading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonTextPrimary}>Salvar</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
});

export function PleaseVerifyScreen() {
  const { user, signOut, setUser } = useAuth() as any; 
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Parâmetros para identificar o estado da tela
  const isNewUser = route.params?.isNewUser === true;
  const fromDiscovery = route.params?.fromDiscovery === true;
  const showBlockedMessage = !isNewUser && !fromDiscovery;

  const handleUpdateEmail = async (emailToUpdate: string, passwordToUpdate: string) => {
    if (!emailToUpdate || !passwordToUpdate) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }
    setIsLoading(true);
    try {
      await api.patch(`/auth/unverified-email/${user?.id}`, { 
        newEmail: emailToUpdate.trim(), 
        password: passwordToUpdate 
      });
      
      if (setUser) setUser({ ...user, email: emailToUpdate.trim() }); 
      Alert.alert('Sucesso', 'E-mail atualizado!');
      setIsEditing(false);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Senha incorreta ou erro ao atualizar.';
      Alert.alert('Ops!', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      await api.post('/auth/resend-verification');
      Alert.alert('Sucesso', 'Link enviado para o seu e-mail.');
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível reenviar o e-mail agora.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.innerContent}>
            <View style={styles.iconBubble}>
              <Feather name="mail" size={48} color="#8B5CF6" />
            </View>

            <Text style={styles.title}>Verificação de E-mail</Text>

            {!isEditing ? (
              <View style={styles.mainCard}>
                <View style={styles.infoBox}>
                  <Text style={styles.description}>Enviámos um link para:</Text>
                  <Text style={styles.emailHighlight}>{user?.email}</Text>
                  
                  {showBlockedMessage && (
                    <View style={styles.blockedNotice}>
                       <Text style={styles.blockedNoticeText}>Para ter acesso à sua conta, você precisa validar o link que enviamos para seu e-mail.</Text>
                    </View>
                  )}

                  <TouchableOpacity style={styles.editLink} onPress={() => setIsEditing(true)}>
                    <Feather name="edit-3" size={14} color="#8B5CF6" />
                    <Text style={styles.editLinkText}>O e-mail está errado?</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={[styles.button, styles.buttonPrimary]} onPress={handleResendEmail} disabled={isResending}>
                   {isResending ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonTextPrimary}>Reenviar Link</Text>}
                </TouchableOpacity>

                {isNewUser && (
                  <TouchableOpacity 
                    style={[styles.button, styles.buttonSuccess, { marginTop: 10 }]} 
                    onPress={() => navigation.navigate('EditProfileScreen')}
                  >
                    <Text style={styles.buttonTextPrimary}>Continuar para Perfil</Text>
                  </TouchableOpacity>
                )}

                {fromDiscovery && (
                  <TouchableOpacity style={[styles.button, styles.buttonOutline, { marginTop: 10 }]} onPress={() => navigation.goBack()}>
                    <Text style={styles.buttonTextOutline}>Voltar</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <EditEmailForm 
                initialEmail={user?.email || ''} 
                onSave={handleUpdateEmail}
                onCancel={() => setIsEditing(false)}
                isLoading={isLoading}
              />
            )}

            <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
               <Text style={styles.logoutText}>Sair da Conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  scrollContent: { flexGrow: 1 },
  innerContent: { padding: 24, alignItems: 'center', paddingTop: SCREEN_HEIGHT * 0.1 },
  iconBubble: { backgroundColor: 'rgba(139, 92, 246, 0.1)', padding: 20, borderRadius: 40, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 24 },
  mainCard: { width: '100%' },
  infoBox: { backgroundColor: '#1F2937', padding: 20, borderRadius: 12, alignItems: 'center', marginBottom: 20 },
  description: { color: '#9CA3AF', fontSize: 14, marginBottom: 4 },
  emailHighlight: { color: '#FFF', fontWeight: 'bold', fontSize: 18, marginBottom: 12 },
  blockedNotice: { backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: 12, borderRadius: 8, marginVertical: 12, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  blockedNoticeText: { color: '#F87171', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  editLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  editLinkText: { color: '#8B5CF6', fontSize: 14, textDecorationLine: 'underline' },
  button: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', width: '100%' },
  buttonPrimary: { backgroundColor: '#6366F1', marginBottom: 16 },
  buttonSuccess: { backgroundColor: '#10B981' },
  buttonSecondary: { backgroundColor: '#374151' },
  buttonOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#4B5563' },
  buttonTextPrimary: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  buttonTextSecondary: { color: '#D1D5DB', fontWeight: '600' },
  buttonTextOutline: { color: '#D1D5DB' },
  editCard: { width: '100%', backgroundColor: '#1F2937', padding: 20, borderRadius: 12 },
  editTitle: { color: '#FFF', fontWeight: 'bold', marginBottom: 16 },
  inputGroup: { gap: 12, marginBottom: 20 },
  input: { backgroundColor: '#111827', color: '#FFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#4B5563' },
  editButtonsRow: { flexDirection: 'row', width: '100%' },
  logoutButton: { marginTop: 40 },
  logoutText: { color: '#6B7280', fontWeight: '600' },
});