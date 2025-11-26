import React, { useState, useMemo } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next'; // <--- I18N

import { NatalChartDisplay } from '../features/astrology/components/NatalChartDisplay';
import { PowerAspectCard } from '../features/astrology/components/PowerAspectCard';
import { PowerAspectDetailModal } from '../features/astrology/components/PowerAspectDetailModal';
import { getMyNatalChart } from '../features/profile/services/profileApi';
import { PowerAspect } from '../types/profile.types';

// Removi a constante fixa daqui e movi para dentro do componente para usar t()

const ManualCarousel = ({ 
    cards, 
    onCardClick,
    emptyText
}: { 
    cards: PowerAspect[], 
    onCardClick: (c: PowerAspect) => void,
    emptyText: string
}) => {
    const [activeIndex, setActiveIndex] = useState(0);

    if (!cards || cards.length === 0) {
        return <Text style={styles.emptyText}>{emptyText}</Text>;
    }

    const goToPrev = () => setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    const goToNext = () => setActiveIndex(prev => (prev < cards.length - 1 ? prev + 1 : prev));

    const currentCard = cards[activeIndex];

    return (
        <View style={styles.carouselContainer}>
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
  const { t } = useTranslation(); // <--- HOOK
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

    const definitions: Record<string, { title: string; description: string; icon: string }> = {
      lifePathNumber: { title: t('num_life_path_title'), description: t('num_life_path_desc'), icon: 'sparkles' },
      expressionNumber: { title: t('num_expression_title'), description: t('num_expression_desc'), icon: 'briefcase' },
      soulNumber: { title: t('num_soul_title'), description: t('num_soul_desc'), icon: 'heart' },
      personalityNumber: { title: t('num_personality_title'), description: t('num_personality_desc'), icon: 'user' },
      birthdayNumber: { title: t('num_birthday_title'), description: t('num_birthday_desc'), icon: 'star' },
    };

    const keys = Object.keys(definitions);
    for (const key of keys) {
      const value = numerologyMap[key as keyof typeof numerologyMap];
      const definition = definitions[key];
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
  }, [numerologyMap, t]);

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#818CF8" /></View>;
  
  if (isError || !chartData || !natalChart) {
      return (
          <SafeAreaView style={styles.container}>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft color="#FFF" size={24}/></TouchableOpacity>
              </View>
              <View style={styles.center}>
                  <Text style={styles.errorText}>{t('error_loading_map')}</Text>
                  <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
                      <RefreshCw color="#FFF" size={20} />
                      <Text style={styles.retryText}>{t('retry')}</Text>
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
            <Text style={styles.headerTitle}>{t('my_astral_plan_header')}</Text>
            <View style={{width: 24}} /> 
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('astrology_section')}</Text>
            <NatalChartDisplay chart={natalChart} />
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('aspects_gallery')}</Text>
            <ManualCarousel cards={powerAspects} onCardClick={setSelectedCard} emptyText={t('no_aspects')} />
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('numerology_gallery')}</Text>
            <ManualCarousel cards={numerologyCards} onCardClick={setSelectedCard} emptyText={t('no_aspects')} />
        </View>

        <View style={styles.footerSection}>
            <TouchableOpacity 
                style={styles.backToProfileBtn}
                onPress={() => navigation.goBack()}
            >
                <Text style={styles.backToProfileText}>{t('back_to_profile')}</Text>
            </TouchableOpacity>
        </View>

      </ScrollView>

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
  carouselContainer: { alignItems: 'center' },
  carouselRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  cardWrapper: { width: 260, alignItems: 'center' }, 
  arrowBtn: { padding: 10, backgroundColor: '#374151', borderRadius: 50 },
  arrowDisabled: { opacity: 0.3 },
  paginationRow: { flexDirection: 'row', marginTop: 16, gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: '#818CF8' },
  dotInactive: { backgroundColor: '#4B5563' },
  footerSection: { marginTop: 48, marginBottom: 24, alignItems: 'center' },
  backToProfileBtn: { backgroundColor: '#4B5563', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, minWidth: 200, alignItems: 'center' },
  backToProfileText: { color: '#FFF', fontWeight: '600', fontSize: 16 },
  errorText: { color: '#EF4444', textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  emptyText: { color: '#6B7280', fontStyle: 'italic', textAlign: 'center' },
  retryBtn: { flexDirection: 'row', backgroundColor: '#4F46E5', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, alignItems: 'center', gap: 8 },
  retryText: { color: '#FFF', fontWeight: 'bold' }
});