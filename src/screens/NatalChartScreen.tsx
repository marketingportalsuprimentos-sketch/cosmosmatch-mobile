// src/screens/NatalChartScreen.tsx

import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import { NatalChartDisplay } from '../features/astrology/components/NatalChartDisplay';
import { PowerAspectCard } from '../features/astrology/components/PowerAspectCard';
import { PowerAspectDetailModal } from '../features/astrology/components/PowerAspectDetailModal';
import { getMyNatalChart } from '../features/profile/services/profileApi';
import { PowerAspect } from '../types/profile.types';

const NUMEROLOGY_CARD_DEFINITIONS: Record<string, { title: string; description: string; icon: string }> = {
  lifePathNumber: { title: 'Caminho de Vida', description: 'Este é o número da sua jornada de vida. Representa as lições, desafios e a sua "missão" principal.', icon: 'sparkles' },
  expressionNumber: { title: 'Expressão (Destino)', description: 'Revela os seus talentos natos e potencial. Como você se expressa no mundo.', icon: 'briefcase' },
  soulNumber: { title: 'Desejo da Alma', description: 'Seu desejo mais íntimo e motivação interna.', icon: 'heart' },
  personalityNumber: { title: 'Personalidade', description: 'Sua "máscara" social. A primeira impressão que os outros têm de si.', icon: 'user' },
  birthdayNumber: { title: 'Dia de Nascimento', description: 'Um talento ou habilidade especial baseado no dia do seu nascimento.', icon: 'star' },
};

// --- COMPONENTE DE CARROSSEL MANUAL ---
const ManualCarousel = ({ 
    cards, 
    onCardClick 
}: { 
    cards: PowerAspect[], 
    onCardClick: (c: PowerAspect) => void 
}) => {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!cards || cards.length === 0) {
        return <Text style={styles.emptyText}>Nenhum aspecto encontrado.</Text>;
    }

    const goToPrev = () => setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    const goToNext = () => setActiveIndex(prev => (prev < cards.length - 1 ? prev + 1 : prev));

    const currentCard = cards[activeIndex];

    return (
        <View style={styles.carouselContainer}>
            {/* Área Principal */}
            <View style={styles.carouselRow}>
                <TouchableOpacity 
                    onPress={goToPrev} 
                    disabled={activeIndex === 0}
                    style={[styles.arrowBtn, activeIndex === 0 && styles.arrowDisabled]}
                >
                    <ChevronLeft size={24} color="#FFF" />
                </TouchableOpacity>

                <View style={styles.cardWrapper}>
                    <PowerAspectCard card={currentCard} onClick={() => onCardClick(currentCard)} />
                </View>

                <TouchableOpacity 
                    onPress={goToNext} 
                    disabled={activeIndex === cards.length - 1}
                    style={[styles.arrowBtn, activeIndex === cards.length - 1 && styles.arrowDisabled]}
                >
                    <ChevronRight size={24} color="#FFF" />
                </TouchableOpacity>
            </View>

            {/* Paginação */}
            <View style={styles.paginationRow}>
                {cards.map((_, index) => (
                    <View 
                        key={index} 
                        style={[
                            styles.dot, 
                            index === activeIndex ? styles.dotActive : styles.dotInactive
                        ]} 
                    />
                ))}
            </View>
        </View>
    );
};

export const NatalChartScreen = () => {
  const navigation = useNavigation();
  const [selectedCard, setSelectedCard] = useState<PowerAspect | null>(null);

  const { data: chartData, isLoading, refetch, isError } = useQuery({
    queryKey: ['myNatalChart'],
    queryFn: getMyNatalChart,
    retry: 1,
  });

  const natalChart = chartData?.natalChart;
  const powerAspects = chartData?.powerAspects || [];
  const numerologyMap = chartData?.numerologyMap;

  const numerologyCards = useMemo(() => {
    const cards: PowerAspect[] = [];
    if (!numerologyMap) return cards;

    const keys = Object.keys(NUMEROLOGY_CARD_DEFINITIONS);
    for (const key of keys) {
      const value = numerologyMap[key as keyof typeof numerologyMap];
      const definition = NUMEROLOGY_CARD_DEFINITIONS[key];
      if (value && definition) {
        cards.push({
          id: key,
          title: `${definition.title} (Nº ${value})`,
          description: definition.description,
          icon: definition.icon,
        });
      }
    }
    return cards;
  }, [numerologyMap]);

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#818CF8" /></View>;
  
  if (isError || !chartData || !natalChart) {
      return (
          <SafeAreaView style={styles.container}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft color="#FFF" size={24}/></TouchableOpacity>
              </View>
              <View style={styles.center}>
                  <Text style={styles.errorText}>Não foi possível carregar o mapa.</Text>
                  <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
                      <RefreshCw color="#FFF" size={20} />
                      <Text style={styles.retryText}>Tentar Novamente</Text>
                  </TouchableOpacity>
              </View>
          </SafeAreaView>
      );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Meu Plano Astral</Text>
            <View style={{width: 24}} /> 
        </View>

        {/* Mandala */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Astrologia</Text>
            <NatalChartDisplay chart={natalChart} />
        </View>

        {/* Galeria Astrologia */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>💎 Galeria de Cartas (Astrologia)</Text>
            <ManualCarousel cards={powerAspects} onCardClick={setSelectedCard} />
        </View>

        {/* Galeria Numerologia */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔢 Galeria Numerológica</Text>
            <ManualCarousel cards={numerologyCards} onCardClick={setSelectedCard} />
        </View>

        {/* --- BOTÃO VOLTAR AO PERFIL (NOVO) --- */}
        <View style={styles.footerSection}>
            <TouchableOpacity 
                style={styles.backToProfileBtn}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backToProfileText}>Voltar ao Perfil</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Modal de Detalhes */}
      <PowerAspectDetailModal 
        card={selectedCard} 
        onClose={() => setSelectedCard(null)} 
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  scroll: { paddingBottom: 60 },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#374151' },
  backBtn: { padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', color: '#A5B4FC' },
  
  section: { marginTop: 32 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginLeft: 16, marginBottom: 16, textAlign: 'center' },
  
  // Carousel Styles
  carouselContainer: { alignItems: 'center' },
  carouselRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  cardWrapper: { width: 260, alignItems: 'center' }, 
  arrowBtn: { padding: 10, backgroundColor: '#374151', borderRadius: 50 },
  arrowDisabled: { opacity: 0.3 },
  
  paginationRow: { flexDirection: 'row', marginTop: 16, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: '#818CF8' },
  dotInactive: { backgroundColor: '#4B5563' },

  // Footer Button Style
  footerSection: { marginTop: 48, marginBottom: 24, alignItems: 'center' },
  backToProfileBtn: {
      backgroundColor: '#4B5563', // Cinza Web (gray-600)
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      minWidth: 200,
      alignItems: 'center'
  },
  backToProfileText: {
      color: '#FFF',
      fontWeight: '600',
      fontSize: 16
  },

  errorText: { color: '#EF4444', textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  emptyText: { color: '#6B7280', fontStyle: 'italic', textAlign: 'center' },
  retryBtn: { flexDirection: 'row', backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, alignItems: 'center', gap: 8 },
  retryText: { color: '#FFF', fontWeight: 'bold' }
});