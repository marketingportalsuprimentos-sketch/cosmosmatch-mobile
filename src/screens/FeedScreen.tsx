import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-deck-swiper'; // Certifique-se que instalou esta lib

const { width, height } = Dimensions.get('window');

// --- DADOS MOCKADOS (Para teste visual) ---
const MOCK_PROFILES = [
  {
    id: '1',
    name: 'Júlia',
    age: 24,
    sign: 'Leão ♌',
    bio: 'Amante de astrologia, café e gatos. Buscando conexões cósmicas!',
    image: 'https://i.pravatar.cc/400?img=5',
    matchPercent: 85
  },
  {
    id: '2',
    name: 'Marcos',
    age: 28,
    sign: 'Escorpião ♏',
    bio: 'Intenso e leal. Vamos falar sobre o universo?',
    image: 'https://i.pravatar.cc/400?img=11',
    matchPercent: 92
  },
  {
    id: '3',
    name: 'Ana',
    age: 26,
    sign: 'Peixes ♓',
    bio: 'Sonhadora e artística. Adoro museus e música indie.',
    image: 'https://i.pravatar.cc/400?img=9',
    matchPercent: 78
  }
];

// --- COMPONENTE DO CARD ---
const Card = ({ card }: any) => (
  <View style={styles.card}>
    <Image source={{ uri: card.image }} style={styles.cardImage} />
    
    <View style={styles.cardOverlay}>
        <View style={styles.cardHeader}>
            <Text style={styles.cardName}>{card.name}, {card.age}</Text>
            <View style={styles.matchBadge}>
                <Text style={styles.matchText}>{card.matchPercent}%</Text>
            </View>
        </View>
        <Text style={styles.cardSign}>{card.sign}</Text>
        <Text style={styles.cardBio} numberOfLines={2}>{card.bio}</Text>
    </View>
  </View>
);

// --- TELA PRINCIPAL DE DESCOBERTA (Exportação Correta) ---
export const FeedScreen = () => { // <--- O App.tsx procura por este nome exato!
  
  const swiperRef = React.useRef<any>(null);

  return (
    <SafeAreaView style={styles.container}>
      
      {/* Barra de Filtros / Topo */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={24} color="#A78BFA" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cosmos Discovery</Text>
        <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="notifications" size={24} color="#A78BFA" />
        </TouchableOpacity>
      </View>

      {/* Área dos Cards */}
      <View style={styles.swiperContainer}>
        <Swiper
            ref={swiperRef}
            cards={MOCK_PROFILES}
            renderCard={(card) => <Card card={card} />}
            onSwiped={(cardIndex) => {console.log(cardIndex)}}
            onSwipedAll={() => {console.log('Acabaram os perfis')}}
            cardIndex={0}
            backgroundColor={'transparent'}
            stackSize={3}
            cardVerticalMargin={0}
            cardHorizontalMargin={0}
            containerStyle={styles.swiper}
            animateCardOpacity
            swipeBackCard
        />
      </View>

      {/* Botões de Ação (X, Like, Star) */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
            style={[styles.actionButton, styles.passButton]}
            onPress={() => swiperRef.current?.swipeLeft()}
        >
            <Ionicons name="close" size={30} color="#EF4444" />
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.actionButton, styles.superLikeButton]}
            onPress={() => swiperRef.current?.swipeTop()}
        >
            <Ionicons name="star" size={24} color="#3B82F6" />
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.actionButton, styles.likeButton]}
            onPress={() => swiperRef.current?.swipeRight()}
        >
            <Ionicons name="heart" size={30} color="#10B981" />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  filterButton: { padding: 10, backgroundColor: '#1F2937', borderRadius: 12 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', fontFamily: 'System' },

  swiperContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20, // Ajuste fino para centralizar
  },
  swiper: {
    flex: 1,
    backgroundColor: 'transparent'
  },
  
  // Estilo do Card
  card: {
    flex: 0.75, // Altura do card em relação à tela
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#374151',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    overflow: 'hidden',
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  cardOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 20,
    paddingBottom: 30,
    backgroundColor: 'rgba(17, 24, 39, 0.85)', // Gradiente escuro no fundo do texto
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardName: { color: '#FFF', fontSize: 28, fontWeight: 'bold' },
  matchBadge: { backgroundColor: '#7C3AED', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  matchText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  cardSign: { color: '#A78BFA', fontSize: 16, fontWeight: '600', marginBottom: 8 },
  cardBio: { color: '#D1D5DB', fontSize: 14, lineHeight: 20 },

  // Botões de Ação
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingBottom: 20,
    paddingHorizontal: 20,
    marginBottom: 10
  },
  actionButton: {
    width: 60, height: 60,
    borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#1F2937',
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5,
  },
  passButton: { borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.3)' },
  likeButton: { borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)', width: 70, height: 70, borderRadius: 35 }, // Botão de like maior
  superLikeButton: { width: 45, height: 45, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' }
});