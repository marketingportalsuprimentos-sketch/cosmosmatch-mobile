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
import { Feather } from '@expo/vector-icons'; 
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext'; 
import { RootStackParamList } from '../navigation/navigation.types';

export function PleaseVerifyScreen() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [showCorrectForm, setShowCorrectForm] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // === HANDLERS ===

  const handleResendClick = async () => {
    setIsResending(true);
    // TODO: Conecte aqui sua API de reenvio real
    setTimeout(() => {
      Alert.alert(t('success'), t('verify_alert_success'));
      setIsResending(false);
    }, 1500);
  };

  const handleCorrectSubmit = async () => {
    if (!newEmail || !password) {
      Alert.alert(t('error'), t('required_fields_msg'));
      return;
    }

    setLoading(true);
    // TODO: Conecte aqui sua API de correção de email
    setTimeout(() => {
      Alert.alert(t('success'), t('verify_alert_updated'));
      setShowCorrectForm(false);
      setLoading(false);
    }, 1500);
  };

  const handleContinue = () => {
    // CORREÇÃO: Leva para a edição de perfil conforme solicitado
    navigation.navigate('EditProfileScreen'); 
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          
          <View style={styles.iconContainer}>
            <Feather name="mail" size={64} color="#818cf8" />
          </View>

          <Text style={styles.title}>{t('verify_title')}</Text>
          
          <Text style={styles.description}>
            {t('verify_sent_to')}
          </Text>
          
          <Text style={styles.emailHighlight}>{user?.email || 'email@exemplo.com'}</Text>

          <Text style={styles.subDescription}>
            {t('verify_hint')}
          </Text>

          {/* === FORMULÁRIO DE CORREÇÃO === */}
          {showCorrectForm ? (
            <View style={styles.formContainer}>
              <Text style={styles.formTitle}>{t('verify_correct_title')}</Text>
              
              <Text style={styles.label}>{t('verify_new_email_label')}</Text>
              <TextInput
                style={styles.input}
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="novo@email.com"
                placeholderTextColor="#6b7280"
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.label}>{t('verify_password_confirm')}</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="******"
                placeholderTextColor="#6b7280"
                secureTextEntry
              />

              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[styles.button, styles.buttonSecondary]} 
                  onPress={() => setShowCorrectForm(false)}
                >
                  <Text style={styles.buttonTextSecondary}>{t('verify_btn_cancel')}</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.button, styles.buttonPrimary, { flex: 1 }]} 
                  onPress={handleCorrectSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.buttonTextPrimary}>{t('verify_btn_save')}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            /* === BOTÕES DE AÇÃO === */
            <View style={styles.actionContainer}>
              {/* 4. CONTINUAR */}
              <TouchableOpacity 
                style={[styles.button, styles.buttonPrimary]} 
                onPress={handleContinue}
              >
                <Text style={styles.buttonTextPrimary}>{t('verify_btn_continue')}</Text>
                <Feather name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 8 }} />
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>{t('verify_or')}</Text>
                <View style={styles.line} />
              </View>

              <View style={styles.secondaryActions}>
                 {/* 3. CORRIGIR */}
                <TouchableOpacity 
                  style={[styles.button, styles.buttonSecondary, { flex: 1, marginRight: 8 }]} 
                  onPress={() => setShowCorrectForm(true)}
                >
                  <Feather name="edit-2" size={18} color="#FFF" style={{ marginRight: 6 }} />
                  <Text style={styles.buttonTextSecondary}>{t('verify_btn_correct')}</Text>
                </TouchableOpacity>

                {/* 2. REENVIAR */}
                <TouchableOpacity 
                  style={[styles.button, styles.buttonSecondary, { flex: 1, marginLeft: 8 }]} 
                  onPress={handleResendClick}
                  disabled={isResending}
                >
                  {isResending ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Feather name="send" size={18} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.buttonTextSecondary}>{t('verify_btn_resend')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              {/* 1. LOGOUT */}
              <TouchableOpacity 
                style={styles.logoutButton} 
                onPress={signOut}
              >
                <Feather name="log-out" size={20} color="#9ca3af" style={{ marginRight: 8 }} />
                <Text style={styles.logoutText}>{t('verify_logout')}</Text>
              </TouchableOpacity>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  content: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 16,
  },
  emailHighlight: {
    color: '#818cf8',
    fontWeight: 'bold',
    fontSize: 18,
    marginVertical: 8,
    textAlign: 'center',
  },
  subDescription: {
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
    fontSize: 14,
    paddingHorizontal: 10,
  },
  formContainer: {
    width: '100%',
    backgroundColor: '#1f2937',
    padding: 20,
    borderRadius: 12,
  },
  formTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  label: {
    color: '#d1d5db',
    fontSize: 14,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#374151',
    color: '#FFF',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  actionContainer: {
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#6366f1',
  },
  buttonTextPrimary: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  buttonSecondary: {
    backgroundColor: '#374151',
  },
  buttonTextSecondary: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#4b5563',
  },
  dividerText: {
    color: '#9ca3af',
    paddingHorizontal: 10,
    fontSize: 14,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    padding: 12,
  },
  logoutText: {
    color: '#9ca3af',
    fontWeight: '600',
  },
});