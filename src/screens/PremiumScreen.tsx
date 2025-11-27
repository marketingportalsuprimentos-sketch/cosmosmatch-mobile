import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert, Linking 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useCreateSubscription } from '../features/payment/hooks/usePaymentMutations';

export function PremiumScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  
  const routes = useNavigationState(state => state.routes);
  
  const { mutate: createSubscription, isPending } = useCreateSubscription();

  // --- LÓGICA DE FECHAMENTO (MANTIDA) ---
  const handleGoToSafePage = () => {
    try {
      if (routes.length > 1) {
        const previousRouteName = routes[routes.length - 2].name;
        const trapScreens = ['SynastryReport', 'NumerologyConnection', 'NatalChartScreen'];

        if (trapScreens.includes(previousRouteName)) {
          if (routes.length >= 3) {
             navigation.pop(2); 
             return;
          } else {
             navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
             return;
          }
        }
      }
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
      }
    } catch (error) {
      console.log("Erro na navegação Premium:", error);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
  };

  // --- LÓGICA DE PAGAMENTO CORRIGIDA (LINK + AVISO CPF) ---
  const handleSubscribeClick = () => {
    if (isPending) return;
    
    createSubscription(undefined, {
        onSuccess: (data: any) => {
            console.log("Resposta Pagamento:", data);
            
            // Tenta pegar o link de pagamento
            const url = data?.checkoutUrl || data?.invoiceUrl || data?.url || data?.paymentLink;

            if (url) {
                // Abre o navegador do celular
                Linking.openURL(url).catch((err) => {
                    console.error("Não foi possível abrir o link:", err);
                    Alert.alert("Erro", "Não foi possível abrir o link de pagamento no navegador.");
                });
            } else {
                Alert.alert("Erro", "Link de pagamento não recebido do servidor.");
            }
        },
        onError: (error: any) => {
            console.log("Erro Asaas:", error);
            
            // Se der erro 500 ou 400, geralmente é falta de dados do cliente (CPF/Endereço)
            if (error?.response?.status === 500 || error?.response?.status === 400) {
                Alert.alert(
                    "Atenção", 
                    "Não foi possível gerar a cobrança. \n\nPor favor, vá em Editar Perfil e verifique se o seu CPF/CNPJ está preenchido corretamente."
                );
            } else {
                Alert.alert("Erro", "Não foi possível iniciar o pagamento. Tente novamente mais tarde.");
            }
        }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.card}>
            
            {/* BOTÃO X */}
            <TouchableOpacity 
              onPress={handleGoToSafePage} 
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#6B7280" /> 
            </TouchableOpacity>

            <LinearGradient
                colors={['#A855F7', '#EC4899']} 
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.iconContainer}
            >
                <Ionicons name="sparkles" size={32} color="white" />
            </LinearGradient>

            <Text style={styles.title}>{t('premium_title')}</Text>
            <Text style={styles.subtitle}>
              {t('premium_subtitle')}
            </Text>

            <View style={styles.featuresContainer}>
                <FeatureItem text={t('premium_feature_1')} />
                <FeatureItem text={t('premium_feature_2')} />
                <FeatureItem text={t('premium_feature_3')} />
            </View>

            <TouchableOpacity 
                onPress={handleSubscribeClick}
                disabled={isPending}
                activeOpacity={0.8}
                style={styles.subscribeButtonWrapper}
            >
                <LinearGradient
                    colors={['#9333EA', '#DB2777']} 
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.gradientButton}
                >
                    {isPending ? (
                        <Text style={styles.subscribeText}>{t('premium_button_loading')}</Text>
                    ) : (
                        <Text style={styles.subscribeText}>{t('premium_button')}</Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={handleGoToSafePage}
                disabled={isPending}
                style={styles.secondaryButton}
            >
                <Text style={styles.secondaryButtonText}>{t('premium_not_now')}</Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
                {t('premium_disclaimer')}
            </Text>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const FeatureItem = ({ text }: { text: string }) => (
    <View style={styles.featureRow}>
        <Ionicons name="sparkles" size={20} color="#C084FC" style={{ marginRight: 12 }} />
        <Text style={styles.featureText}>{text}</Text>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' }, 
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: '#1F2937', 
    borderRadius: 16, 
    padding: 32,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative'
  },
  closeButton: { position: 'absolute', top: 16, right: 16, zIndex: 10 },
  iconContainer: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', textAlign: 'center', marginBottom: 16 },
  subtitle: { fontSize: 18, color: '#D1D5DB', textAlign: 'center', marginBottom: 32 },
  featuresContainer: { width: '100%', marginBottom: 40, gap: 12 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  featureText: { color: '#D1D5DB', fontSize: 14, flex: 1 },
  subscribeButtonWrapper: { width: '100%', borderRadius: 8, overflow: 'hidden', marginBottom: 16 },
  gradientButton: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  subscribeText: { color: 'white', fontWeight: '600', fontSize: 18 },
  secondaryButton: { width: '100%', paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#374151', backgroundColor: '#1F2937', alignItems: 'center', marginBottom: 24 },
  secondaryButtonText: { color: '#D1D5DB', fontSize: 16, fontWeight: '500' },
  disclaimer: { fontSize: 12, color: '#6B7280', textAlign: 'center' }
});