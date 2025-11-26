import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next'; // <--- I18N

import { getSynastryReport } from '../features/compatibility/services/compatibilityApi';
import { SynastryChartDisplay } from '../features/compatibility/components/SynastryChartDisplay';
import { Aspect } from '../types/compatibility.types';

const AspectItem = ({ aspect, nameA, nameB }: { aspect: Aspect, nameA: string, nameB: string }) => (
  <View style={styles.aspectCard}>
    <Text style={styles.aspectTitle}>
      {aspect.planetAName} ({nameA}) <Text style={{color:'#FFF'}}>x</Text> {aspect.planetBName} ({nameB})
    </Text>
    <Text style={styles.aspectSummary}>{aspect.summary}</Text>
    <Text style={styles.aspectMeta}>
      {aspect.type} • Orbe: {aspect.orb.toFixed(1)}°
    </Text>
  </View>
);

export const SynastryReportScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation(); // <--- HOOK
  const { targetUserId } = route.params as { targetUserId: string };

  const { data, isLoading, error } = useQuery({
    queryKey: ['synastry', targetUserId],
    queryFn: () => getSynastryReport(targetUserId),
  });

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#818CF8" /></View>;
  if (error || !data) return <View style={styles.center}><Text style={styles.errorText}>{t('error_loading_synastry')}</Text></View>;

  const { report, chartA, chartB, nameA, nameB } = data;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('synastry_title')}</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        
        <View style={styles.legendContainer}>
            <Text style={styles.legendText}>{t('outer_ring')}: <Text style={{fontWeight:'bold'}}>{nameA}</Text></Text>
            <Text style={styles.legendText}>{t('inner_ring')}: <Text style={{fontWeight:'bold'}}>{nameB}</Text></Text>
        </View>

        <SynastryChartDisplay chartA={chartA} chartB={chartB} report={report} />

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#4ADE80' }]}>{t('strengths_attraction')}</Text>
            {report.positiveAspects.length > 0 ? (
                report.positiveAspects.map((aspect: any, i: any) => <AspectItem key={i} aspect={aspect} nameA={nameA} nameB={nameB} />)
            ) : <Text style={styles.emptyText}>{t('no_main_aspects')}</Text>}
        </View>

        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: '#F87171' }]}>{t('challenges_conflict')}</Text>
            {report.challengingAspects.length > 0 ? (
                report.challengingAspects.map((aspect: any, i: any) => <AspectItem key={i} aspect={aspect} nameA={nameA} nameB={nameB} />)
            ) : <Text style={styles.emptyText}>{t('no_main_challenges')}</Text>}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#374151' },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  backBtn: { padding: 4 },
  scroll: { padding: 16, paddingBottom: 40 },
  legendContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  legendText: { color: '#9CA3AF', fontSize: 12 },
  section: { marginTop: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  aspectCard: { backgroundColor: '#1F2937', padding: 16, borderRadius: 12, marginBottom: 12 },
  aspectTitle: { color: '#818CF8', fontWeight: 'bold', fontSize: 14, marginBottom: 4 },
  aspectSummary: { color: '#D1D5DB', fontSize: 14, lineHeight: 20, marginBottom: 8 },
  aspectMeta: { color: '#6B7280', fontSize: 12 },
  emptyText: { color: '#6B7280', fontStyle: 'italic' },
  errorText: { color: '#EF4444' }
});