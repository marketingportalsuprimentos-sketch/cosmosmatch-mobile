// src/screens/NumerologyConnectionScreen.tsx

import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { getNumerologyReport } from '../features/compatibility/services/compatibilityApi';

export const NumerologyConnectionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { targetUserId } = route.params as { targetUserId: string };

  const { data, isLoading, error } = useQuery({
    queryKey: ['numerologyConnection', targetUserId],
    queryFn: () => getNumerologyReport(targetUserId),
  });

  if (isLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#818CF8" /></View>;
  if (error || !data) return <View style={styles.center}><Text style={styles.errorText}>Erro ao carregar numerologia.</Text></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conexão Numerológica</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.subtitle}>
            Compatibilidade entre <Text style={{color:'#818CF8'}}>{data.nameA}</Text> e <Text style={{color:'#818CF8'}}>{data.nameB}</Text>
        </Text>

        {data.reportItems.map((item, index) => (
            <View key={index} style={styles.card}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={[styles.badge, 
                        item.quality === 'Harmônico' ? {backgroundColor: 'rgba(74, 222, 128, 0.2)'} :
                        item.quality === 'Desafiador' ? {backgroundColor: 'rgba(248, 113, 113, 0.2)'} :
                        {backgroundColor: 'rgba(156, 163, 175, 0.2)'}
                    ]}>
                        <Text style={[styles.badgeText,
                             item.quality === 'Harmônico' ? {color: '#4ADE80'} :
                             item.quality === 'Desafiador' ? {color: '#F87171'} :
                             {color: '#D1D5DB'}
                        ]}>{item.quality}</Text>
                    </View>
                </View>

                <View style={styles.numbersRow}>
                    <View style={styles.numberBox}><Text style={styles.number}>{item.numberA}</Text></View>
                    <Text style={styles.versus}>x</Text>
                    <View style={styles.numberBox}><Text style={styles.number}>{item.numberB}</Text></View>
                </View>

                <Text style={styles.summary}>{item.summary}</Text>
            </View>
        ))}
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
  subtitle: { color: '#D1D5DB', textAlign: 'center', marginBottom: 24, fontSize: 16 },
  errorText: { color: '#EF4444' },
  
  card: { backgroundColor: '#1F2937', padding: 20, borderRadius: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },
  
  numbersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 16 },
  numberBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' },
  number: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  versus: { color: '#6B7280', fontSize: 18 },
  
  summary: { color: '#D1D5DB', lineHeight: 22, fontSize: 15 }
});