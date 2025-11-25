// mobile/src/navigation/ProfileScreen.tsx
import React, { useState, useMemo, Fragment } from 'react';
import { 
  ScrollView, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ActivityIndicator,
  Dimensions 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
// IMPORTAÇÕES CRUCIAIS PARA O RADAR E QUIZ
import { BehavioralQuizModal } from '../features/profile/components/BehavioralQuizModal';
import { BehavioralRadarChart } from '../features/profile/components/BehavioralRadarChart';

// --- IMPORTAÇÕES DE MOCK/HOURS REAIS (Assumindo que existem) ---
// Note: As interfaces Profile e User precisam estar disponíveis
import type { Profile, UserProfile } from '../types/profile.types'; 
import { ConfirmationModal } from '../components/common/ConfirmationModal'; 
// Substituímos os useGet* e useFollow* pelos seus equivalentes Mobile
// import { useGetMyProfile, useGetPublicProfile } from '../features/profile/hooks/useProfile';
// O componente precisa de um Mock para funcionar sem os hooks
const useGetMyProfile = () => ({
  data: {
    user: { id: 'user123', name: 'João Batista', subscription: { status: 'PREMIUM' } },
    bio: 'Desenvolvedor e entusiasta de astrologia.',
    imageUrl: 'https://i.pravatar.cc/300?img=6', // Mock Avatar
    currentCity: 'Guaíba, BR',
    // MOCK: Dados do Quiz (1-5, 20 itens) para que o Gráfico apareça
    behavioralAnswers: Array.from({ length: 20 }, (_, i) => ((i % 5) + 1)), 
    natalChart: { planets: [{ name: 'Sol', sign: 'Aquarius' }, { name: 'Lua', sign: 'Pisces' }] },
    numerologyMap: { lifePathNumber: 7 }
  } as Profile,
  isLoading: false,
  isError: false,
});
const useGetGalleryPhotos = (id: string) => ({ data: [], isLoading: false }); 
// --- FIM IMPORTAÇÕES DE MOCK ---


const screenWidth = Dimensions.get('window').width;

// --- COMPONENTES INTERNOS PORTADOS ---

// 1. HEADER (Simplificado, focado no Quiz e Logout)
const ProfileHeader = ({ profile, isOwner, sunSign }: { profile: Profile; isOwner: boolean; sunSign: string; }) => {
  const navigation = useNavigation();
  const { logout } = useAuth();
  const avatarUrl = profile.imageUrl ?? null;
  
  const [isQuizModalOpen, setQuizModalOpen] = useState(false);
  const [isMessageModalOpen, setMessageModalOpen] = useState(false);
  
  const handleLogout = () => {
    Alert.alert(
      'Sair da Conta', 
      'Tem a certeza que quer sair?', 
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: logout },
      ]
    );
  };
  
  return (
    <View style={headerStyles.card}>
      {/* Botão de Opções/Logout (Topo Direito) */}
      {isOwner && (
        <TouchableOpacity style={headerStyles.optionsButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      )}

      {/* Avatar e Botão Editar */}
      <View style={headerStyles.avatarContainer}>
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={headerStyles.avatarImage}
          />
        ) : (
          <Ionicons name="person-circle" size={120} color="#4B5563" />
        )}
        {isOwner && (
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfilePage' as never)} // Assumindo a rota de edição
            style={headerStyles.editButton}
            aria-label="Editar foto do perfil"
          >
            <Ionicons name="pencil" size={18} color="white" />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={headerStyles.nameText}>
        {profile.user?.name || 'Usuário'}
      </Text>
      
      {profile.currentCity && (
        <View style={headerStyles.locationContainer}>
          <Ionicons name="location" size={14} color="#9CA3AF" />
          <Text style={headerStyles.locationText}>{profile.currentCity}</Text>
        </View>
      )}

      <View style={headerStyles.buttonRow}>
        {isOwner ? (
          // --- DONO DO PERFIL (Botões) ---
          <>
            <TouchableOpacity
              onPress={() => navigation.navigate('EditProfilePage' as never)}
              style={[headerStyles.actionButton, headerStyles.editProfileButton]}
            >
              <Ionicons name="settings" size={20} color="white" />
              <Text style={headerStyles.buttonText}>Editar</Text>
            </TouchableOpacity>
            
            {/* BOTÃO MINHA SINTONIA */}
            <TouchableOpacity
              onPress={() => setQuizModalOpen(true)}
              style={[headerStyles.actionButton, headerStyles.sintoniaButton]}
            >
              <Ionicons name="options" size={20} color="white" />
              <Text style={headerStyles.buttonText}>Sintonia</Text>
            </TouchableOpacity>
          </>
        ) : (
          // --- VISITANTE (Botões - SIMPLIFICADO) ---
          <>
             {/* Implementar Connect e Message logic aqui (useFollowUser, SendMessageModal) */}
            <TouchableOpacity style={headerStyles.actionButton}>
              <Ionicons name="person-add" size={20} color="white" />
              <Text style={headerStyles.buttonText}>Conectar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMessageModalOpen(true)} style={headerStyles.actionButton}>
              <Ionicons name="chatbubbles" size={20} color="white" />
              <Text style={headerStyles.buttonText}>Mensagem</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
      
      {/* Modal do Quiz (Integrado) */}
      {isQuizModalOpen && (
        <BehavioralQuizModal
          isVisible={isQuizModalOpen}
          onClose={() => setQuizModalOpen(false)}
          // Passar os dados existentes para o modal, se houver
        />
      )}
      
      {/* Modal de Mensagem (Simplificado) */}
       {isMessageModalOpen && <Text style={{color: 'white'}}>Abrir modal de Mensagem...</Text>}
    </View>
  );
};


// 2. COSMIC DETAILS (Simplificado, focado nos dados principais e botões de relatório)
const ProfileCosmicDetails = ({ profile, natalChart, numerologyMap }: { profile: Profile; natalChart: Profile['natalChart']; numerologyMap: Profile['numerologyMap']; }) => {
  const sun = natalChart?.planets?.find((p) => p.name === 'Sol');
  const moon = natalChart?.planets?.find((p) => p.name === 'Lua');
  const ascendant = natalChart?.houses?.find((h) => h.name === 'Casa 1 (ASC)');
  
  const hasNatalChart = !!natalChart;

  return (
    <View style={cosmicStyles.card}>
      <Text style={cosmicStyles.title}>Detalhes Cósmicos</Text>
      
      {/* Detalhes Astro */}
      <View style={cosmicStyles.astroRow}>
        <View style={cosmicStyles.astroItem}>
          <Text style={cosmicStyles.detailLabel}>Sol ☀️</Text>
          <Text style={cosmicStyles.detailValue}>{sun?.sign || '...'}</Text>
        </View>
        <View style={cosmicStyles.astroItem}>
          <Text style={cosmicStyles.detailLabel}>Lua 🌙</Text>
          <Text style={cosmicStyles.detailValue}>{moon?.sign || '...'}</Text>
        </View>
        <View style={cosmicStyles.astroItem}>
          <Text style={cosmicStyles.detailLabel}>Ascendente ✨</Text>
          <Text style={cosmicStyles.detailValue}>{ascendant?.sign || '...'}</Text>
        </View>
      </View>
      
      {/* Caminho de Vida */}
      {numerologyMap?.lifePathNumber && (
        <View style={cosmicStyles.numerologyContainer}>
          <Text style={cosmicStyles.detailLabel}>Caminho de Vida 🔢</Text>
          <Text style={cosmicStyles.detailValue}>
            {numerologyMap.lifePathNumber}
          </Text>
        </View>
      )}

      {/* Botões de Relatório (Simplificado) */}
      <View style={cosmicStyles.reportButtonContainer}>
         <TouchableOpacity 
            style={[cosmicStyles.reportButton, !hasNatalChart && cosmicStyles.reportButtonDisabled]}
            disabled={!hasNatalChart}
            onPress={() => Alert.alert('Sinastria', 'Navegar para Relatório de Sinastria')}
         >
           <Ionicons name="sparkles" size={20} color="#FFF" />
           <Text style={cosmicStyles.reportButtonText}>Ver Sinastria</Text>
         </TouchableOpacity>
      </View>
    </View>
  );
};

// ----------------------------------------------------
// COMPONENTE PRINCIPAL (ProfileScreen)
// ----------------------------------------------------
export function ProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Lógica de determinação do usuário e fetch de dados (MOCK)
  const { user: loggedInUser, isLoading: isAuthLoading } = useAuth();
  const { userId } = route.params || {}; // Pega userId se vier da rota
  
  const isOwner = !userId || userId === loggedInUser?.id;
  const targetUserId = isOwner ? loggedInUser?.id : userId;

  // Use os hooks reais do seu sistema, substituídos aqui por Mocks:
  const { data: profileData, isLoading: isLoadingProfile } = useGetMyProfile(); 
  const { data: photosData, isLoading: isLoadingPhotos } = useGetGalleryPhotos(targetUserId);

  const isLoading = isAuthLoading || isLoadingProfile || isLoadingPhotos;

  if (isLoading) {
    return (
      <View style={mainStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
        <Text style={mainStyles.loadingText}>A carregar perfil...</Text>
      </View>
    );
  }

  if (!profileData || !targetUserId) {
    return (
      <View style={mainStyles.loadingContainer}>
        <Text style={mainStyles.errorText}>Erro ao carregar o perfil.</Text>
      </View>
    );
  }
  
  // Dados Comportamentais para o Gráfico
  const sunSign = profileData.natalChart?.planets?.find((p) => p.name === 'Sol')?.sign || 'Capricorn';
  const behavioralAnswers = profileData.behavioralAnswers || []; // Array de 20 respostas (score 1-5)

  return (
    <ScrollView style={mainStyles.scrollView} contentContainerStyle={mainStyles.contentContainer}>
      
      {/* 1. HEADER (Botões de Ação e Info Básica) */}
      <ProfileHeader 
        profile={profileData as Profile} 
        isOwner={isOwner} 
        sunSign={sunSign}
      />

      {/* 2. GRÁFICO DE RADAR (Condicional: só se houver 20 respostas) */}
      {behavioralAnswers.length >= 20 && (
        <View style={mainStyles.chartWrapper}>
           <BehavioralRadarChart 
              answers={behavioralAnswers} 
              sign={sunSign} 
              userId={targetUserId} 
              isOwner={isOwner}
           />
        </View>
      )}

      {/* 3. SOBRE MIM */}
      {profileData.bio && (
         <View style={mainStyles.aboutCard}>
            <Text style={mainStyles.aboutTitle}>Sobre mim</Text>
            <Text style={mainStyles.aboutText}>{profileData.bio}</Text>
         </View>
      )}

      {/* 4. DETALHES CÓSMICOS */}
       <ProfileCosmicDetails
          profile={profileData as Profile}
          natalChart={profileData.natalChart}
          numerologyMap={profileData.numerologyMap}
       />
      
      {/* 5. GALLERY (Simplificado) */}
       <View style={mainStyles.galleryCard}>
          <Text style={mainStyles.galleryTitle}>Galeria de Fotos ({photosData?.length || 0})</Text>
          {/* TO DO: Substituir com ProfileGalleryGrid Mobile */}
       </View>

       {/* 6. CONEXÕES (Simplificado) */}
       <View style={mainStyles.connectionsCard}>
          <Text style={mainStyles.connectionsTitle}>Conexão em Órbita</Text>
          {/* TO DO: Substituir com ProfileConnections Mobile */}
       </View>

    </ScrollView>
  );
}

// ----------------------------------------------------
// ESTILOS GLOBAIS
// ----------------------------------------------------
const mainStyles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#111827', // Gray 900
  },
  contentContainer: {
    paddingBottom: 40,
    paddingHorizontal: 16,
    gap: 16, // Espaçamento entre os cards
    paddingTop: 16,
  },
  loadingContainer: {
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
    marginTop: 10,
  },
  chartWrapper: {
    paddingHorizontal: 0,
  },
  aboutCard: {
     backgroundColor: '#1F2937', 
     padding: 16,
     borderRadius: 12,
  },
  aboutTitle: {
     color: '#FFF',
     fontSize: 18,
     fontWeight: 'bold',
     marginBottom: 8,
  },
  aboutText: {
     color: '#D1D5DA',
     fontSize: 14,
  },
  galleryCard: {
    backgroundColor: '#1F2937', 
    padding: 16,
    borderRadius: 12,
  },
  galleryTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  connectionsCard: {
    backgroundColor: '#1F2937', 
    padding: 16,
    borderRadius: 12,
  },
  connectionsTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

// ----------------------------------------------------
// ESTILOS HEADER
// ----------------------------------------------------
const headerStyles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
  },
  optionsButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 10,
  },
  avatarContainer: {
    position: 'relative',
    marginTop: 10,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#6366F1', // Indigo 500
    objectFit: 'cover',
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#6366F1',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1F2937',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    marginBottom: 10,
  },
  locationText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  editProfileButton: {
    backgroundColor: '#4F46E5', // Indigo 600
  },
  sintoniaButton: {
    backgroundColor: '#8B5CF6', // Purple 600
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  }
});

// ----------------------------------------------------
// ESTILOS COSMIC DETAILS
// ----------------------------------------------------
const cosmicStyles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  astroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 12,
  },
  astroItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 4,
  },
  numerologyContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  reportButtonContainer: {
    marginTop: 15,
  },
  reportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366F1',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  reportButtonDisabled: {
    backgroundColor: '#4B5563',
    opacity: 0.6,
  },
  reportButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  }
});