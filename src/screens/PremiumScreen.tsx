import React from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';

// Hook de Pagamento
import { useCreateSubscription } from '../features/payment/hooks/usePaymentMutations';

export function PremiumScreen() {
  const navigation = useNavigation<any>();
  
  const { mutate: createSubscription, isPending } = useCreateSubscription();

  // --- CORREÇÃO AQUI ---
  const handleGoToSafePage = () => {
    // Em vez de tentar navegar para uma rota que pode não existir no contexto atual,
    // apenas "fechamos" o modal voltando para a tela anterior.
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      // Fallback de segurança: Se não der para voltar, vai para a Home
      // Certifique-se que 'MainTabs' é o nome do seu navegador principal no App.tsx
      navigation.navigate('MainTabs', { screen: 'DiscoveryTab' });
    }
  };

  const handleSubscribeClick = () => {
    if (isPending) return;
    createSubscription();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.card}>
            
            {/* Botão "X" (Fechar) */}
            <TouchableOpacity 
              onPress={handleGoToSafePage} 
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#6B7280" /> 
            </TouchableOpacity>

            {/* Ícone Gradiente */}
            <LinearGradient
                colors={['#A855F7', '#EC4899']} 
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.iconContainer}
            >
                <Ionicons name="sparkles" size={32} color="white" />
            </LinearGradient>

            <Text style={styles.title}>CosmosMatch Premium</Text>
            <Text style={styles.subtitle}>
              Desbloqueie todo o potencial do Cosmos.
            </Text>

            {/* Lista de Benefícios */}
            <View style={styles.featuresContainer}>
                <FeatureItem text="Contactos ilimitados (Mensagens, Comentários, Icebreakers)." />
                <FeatureItem text="Veja quem gostou de si primeiro. (Brevemente)" />
                <FeatureItem text='Modo "invisível". (Brevemente)' />
            </View>

            {/* Botão Principal (Assinar) */}
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
                        <Text style={styles.subscribeText}>A aguardar Asaas...</Text>
                    ) : (
                        <Text style={styles.subscribeText}>Tornar-se Premium Agora</Text>
                    )}
                </LinearGradient>
            </TouchableOpacity>

            {/* Botão Secundário (Agora não) */}
            <TouchableOpacity
                onPress={handleGoToSafePage} // Chama a função corrigida
                disabled={isPending}
                style={styles.secondaryButton}
            >
                <Text style={styles.secondaryButtonText}>Agora não</Text>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
                (Plano Mensal - R$ 19,90). Você será redirecionado para o checkout seguro do Asaas.
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

  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10
  },

  iconContainer: {
    width: 64, 
    height: 64, 
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  title: {
    fontSize: 24, 
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16
  },
  subtitle: {
    fontSize: 18, 
    color: '#D1D5DB', 
    textAlign: 'center',
    marginBottom: 32
  },

  featuresContainer: {
    width: '100%',
    marginBottom: 40,
    gap: 12 
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center', 
    marginBottom: 12,
  },
  featureText: {
    color: '#D1D5DB', 
    fontSize: 14,
    flex: 1, 
  },

  subscribeButtonWrapper: {
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16
  },
  gradientButton: {
    paddingVertical: 16, 
    alignItems: 'center',
    justifyContent: 'center',
  },
  subscribeText: {
    color: 'white',
    fontWeight: '600', 
    fontSize: 18, 
  },

  secondaryButton: {
    width: '100%',
    paddingVertical: 12, 
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151', 
    backgroundColor: '#1F2937', 
    alignItems: 'center',
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: '#D1D5DB', 
    fontSize: 16, 
    fontWeight: '500', 
  },

  disclaimer: {
    fontSize: 12, 
    color: '#6B7280', 
    textAlign: 'center'
  }
});