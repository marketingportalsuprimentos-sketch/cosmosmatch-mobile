// mobile/src/navigation/DiscoveryScreen.tsx
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// 1. Importa o ProfileCard que criamos na etapa anterior
import { ProfileCard } from '../features/discovery/components/ProfileCard';
import { useNavigation } from '@react-navigation/native';

// --- TIPOS MOCK (Para o Gráfico de Radar) ---
interface DiscoveryProfile {
  userId: string;
  name: string;
  compatibility?: { score: number };
  profile?: {
    currentCity?: string;
    imageUrl?: string;
    sunSign?: string;
  };
}

// --- HOOKS MOCK (Substitua pelos seus hooks reais useDiscoveryQueue) ---
const mockProfiles: DiscoveryProfile[] = [
  { userId: 'userA', name: 'Luna Oliveira', compatibility: { score: 85 }, profile: { currentCity: 'Lisboa, PT', sunSign: 'Aquarius', imageUrl: 'https://i.pravatar.cc/300?img=49' } },
  { userId: 'userB', name: 'Marte Silva', compatibility: { score: 72 }, profile: { currentCity: 'Porto, PT', sunSign: 'Gemini', imageUrl: 'https://i.pravatar.cc/300?img=65' } },
  { userId: 'userC', name: 'Vênus Costa', compatibility: { score: 91 }, profile: { currentCity: 'Faro, PT', sunSign: 'Libra', imageUrl: 'https://i.pravatar.cc/300?img=33' } },
];

const useDiscoveryQueue = () => {
  const [queue, setQueue] = useState<DiscoveryProfile[]>(mockProfiles);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  
  const refetch = () => {
    if (queue.length === 0) {
       setIsLoading(true);
       setTimeout(() => {
          setQueue(mockProfiles);
          setIsLoading(false);
       }, 1000);
    }
  };

  return { 
    queue, 
    isLoading, 
    isError, 
    next: () => setQueue(prev => prev.slice(1)), 
    refetch,
    hasNextPage: queue.length > 0
  };
};

const useDiscoveryMutations = () => {
  const [isLiking, setIsLiking] = useState(false);
  
  const likeProfile = useCallback((userId: string, onSuccess: () => void) => {
    setIsLiking(true);
    setTimeout(() => {
      Alert.alert('Sucesso', `Você deu Like em ${userId}!`);
      setIsLiking(false);
      onSuccess();
    }, 500);
  }, []);

  const skipProfile = useCallback((userId: string, onSuccess: () => void) => {
    onSuccess();
  }, []);

  const sendIcebreaker = useCallback((userId: string, onSuccess: () => void) => {
     Alert.alert('Icebreaker', `Icebreaker enviado para ${userId}!`);
     onSuccess();
  }, []);

  return { likeProfile, skipProfile, sendIcebreaker, isLiking, isSendingIcebreaker: false };
};
// --- FIM HOOKS MOCK ---

// Componente de Ações (DiscoveryActions - PORTADO)
interface DiscoveryActionsProps {
  onSkip: (userId: string) => void;
  onLike: (userId: string) => void;
  onSendMessage: (userId: string) => void;
  currentProfileId: string | null;
  isLiking: boolean;
  isSendingIcebreaker: boolean;
}

const DiscoveryActions = ({ 
  onSkip, 
  onLike, 
  onSendMessage, 
  currentProfileId, 
  isLiking,
  isSendingIcebreaker,
}: DiscoveryActionsProps) => {
    if (!currentProfileId) return null;
    
    return (
      <View style={actionsStyles.container}>
        {/* Botão SKIP */}
        <TouchableOpacity
          style={actionsStyles.actionButton}
          onPress={() => onSkip(currentProfileId)}
          disabled={isLiking}
        >
          <Ionicons name="close" size={32} color="#F87171" /> 
        </TouchableOpacity>

        {/* Botão ICEBREAKER/Mensagem */}
        <TouchableOpacity
          style={[actionsStyles.actionButton, actionsStyles.icebreakerButton]}
          onPress={() => onSendMessage(currentProfileId)}
          disabled={isLiking || isSendingIcebreaker}
        >
          <Ionicons name="sparkles" size={24} color="#FFF" /> 
        </TouchableOpacity>

        {/* Botão LIKE */}
        <TouchableOpacity
          style={[actionsStyles.actionButton, actionsStyles.likeButton]}
          onPress={() => onLike(currentProfileId)}
          disabled={isLiking}
        >
          {isLiking ? (
             <ActivityIndicator size="small" color="#FFF" />
          ) : (
             <Ionicons name="heart" size={32} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    );
};

// Componente de Fallback (Vazio)
const EmptyStateFallback = () => (
  <View style={mainStyles.fallbackContainer}>
    <Text style={mainStyles.fallbackText}>✨ Sem perfis novos por perto.</Text>
    <Text style={mainStyles.fallbackSubtext}>Tente novamente mais tarde ou mude o filtro.</Text>
  </View>
);

// ----------------------------------------------------
// COMPONENTE PRINCIPAL (DiscoveryScreen)
// ----------------------------------------------------
export function DiscoveryScreen() {
  const navigation = useNavigation();
  
  // Lógica da Fila e Mutações
  const { queue, isLoading, isError, next, refetch } = useDiscoveryQueue();
  const { likeProfile, skipProfile, sendIcebreaker, isLiking, isSendingIcebreaker } = useDiscoveryMutations();
  
  const currentProfile = useMemo(() => queue[0], [queue]);

  // Navega para o perfil ao clicar (se não for um swipe)
  const handleTap = useCallback((userId: string) => {
    if (isLiking || isSendingIcebreaker) return;
    // Navega para a rota 'Profile' no Stack, passando o ID
    navigation.navigate('Profile' as never, { userId }); 
  }, [navigation, isLiking, isSendingIcebreaker]);
  
  // Ação de Like
  const handleLike = useCallback((userId: string) => {
    likeProfile(userId, () => {
      next(); 
    });
  }, [likeProfile, next]);

  // Ação de Pular/Skip
  const handleSkip = useCallback((userId: string) => {
    skipProfile(userId, () => {
      next(); 
      refetch(); 
    });
  }, [skipProfile, next, refetch]);
  
  // Ação de Icebreaker
  const handleSendMessage = useCallback((userId: string) => {
    sendIcebreaker(userId, () => {
      // O perfil permanece na tela para esperar a resposta
    });
  }, [sendIcebreaker]);

  if (isLoading) {
    return (
      <View style={mainStyles.centerContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={mainStyles.loadingText}>A carregar novos perfis...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={mainStyles.centerContainer}>
        <Text style={mainStyles.errorText}>Erro ao carregar a fila de descoberta.</Text>
        <TouchableOpacity onPress={refetch} style={mainStyles.retryButton}>
           <Text style={mainStyles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  return (
    <View style={mainStyles.container}>
      
      {/* 1. Área dos Cards */}
      <View style={mainStyles.cardArea}>
        {currentProfile ? (
          <ProfileCard
            key={currentProfile.userId} 
            profile={currentProfile}
            onSwipe={handleSkip} 
            onTap={handleTap} 
          />
        ) : (
          <EmptyStateFallback />
        )}
      </View>
      
      {/* 2. Área das Ações */}
      <DiscoveryActions
        onSkip={handleSkip}
        onLike={handleLike}
        onSendMessage={handleSendMessage}
        currentProfileId={currentProfile?.userId ?? null}
        isLiking={isLiking}
        isSendingIcebreaker={isSendingIcebreaker}
      />
      
    </View>
  );
}

// ----------------------------------------------------
// Estilos
// ----------------------------------------------------
const screenHeight = Dimensions.get('window').height;

const mainStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', 
    paddingHorizontal: 16,
    paddingTop: 40, 
    justifyContent: 'space-between',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 10,
  },
  errorText: {
    color: '#F87171',
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContainer: {
    height: screenHeight * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fallbackText: {
    color: '#D1D5DB',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  fallbackSubtext: {
    color: '#9CA3AF',
    fontSize: 14,
  }
});

const actionsStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 15,
    backgroundColor: 'rgba(17, 24, 39, 0.9)', 
    borderTopWidth: 1,
    borderTopColor: '#374151', 
    marginHorizontal: -16, 
    paddingHorizontal: 16,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1F2937', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icebreakerButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#A855F7', 
  },
  likeButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#6366F1', 
  }
});