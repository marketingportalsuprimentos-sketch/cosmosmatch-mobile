import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sparkles, X } from 'lucide-react-native'; // Usando Lucide (padrão do seu projeto)
import { useGetPersonalDayVibration } from '../../../features/profile/hooks/useProfile';

// Mesma chave da Web para consistência
const LOCAL_STORAGE_KEY = 'cosmosmatch_dismissed_personal_day';

// Mesmos textos da Web
const PERSONAL_DAY_TEXTS: Record<number, { title: string; text: string }> = {
  1: { title: 'Vibração 1: O Início', text: 'Um dia para novos começos, liderança e focar na sua independência.' },
  2: { title: 'Vibração 2: A Parceria', text: 'Foque na diplomacia, paciência e cooperação com os outros.' },
  3: { title: 'Vibração 3: A Comunicação', text: 'Excelente para socializar, expressar sua criatividade e se divertir.' },
  4: { title: 'Vibração 4: O Construtor', text: 'Dia de trabalho focado, organização e planeamento prático.' },
  5: { title: 'Vibração 5: A Liberdade', text: 'Espere o inesperado. Um dia para mudanças, viagens e aventura.' },
  6: { title: 'Vibração 6: O Lar', text: 'Foco na harmonia, família, e responsabilidades afetivas.' },
  7: { title: 'Vibração 7: O Sábio', text: 'Dia de introspecção, estudo e busca por respostas internas.' },
  8: { title: 'Vibração 8: O Poder', text: 'Foco em finanças, carreira e poder pessoal. Ótimo para negócios.' },
  9: { title: 'Vibração 9: A Finalização', text: 'Bom para concluir ciclos, praticar o desapego e a compaixão.' },
  11: { title: 'Mestre 11: A Intuição', text: 'Sua intuição está no auge. Preste atenção aos sinais e insights.' },
  22: { title: 'Mestre 22: O Mestre Construtor', text: 'Capacidade de manifestar grandes projetos. Foque no longo prazo.' },
  33: { title: 'Mestre 33: A Compaixão', text: 'Um dia de cura, serviço aos outros e responsabilidade elevada.' },
};

const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

export const PersonalDayCard = () => {
  const { data: personalDayData, isLoading, isError } = useGetPersonalDayVibration();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    checkVisibility();
  }, []);

  const checkVisibility = async () => {
    try {
      const dismissedDate = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      const todayDate = getTodayDateString();
      // Se não houver data salva OU a data salva for diferente de hoje
      if (dismissedDate !== todayDate) {
        setIsVisible(true);
      }
    } catch (error) {
      console.error('Erro ao ler AsyncStorage:', error);
    }
  };

  const handleClose = async () => {
    setIsVisible(false);
    try {
      await AsyncStorage.setItem(LOCAL_STORAGE_KEY, getTodayDateString());
    } catch (error) {
      console.error('Erro ao salvar no AsyncStorage:', error);
    }
  };

  if (!isVisible || isLoading || isError || !personalDayData) {
    return null;
  }

  const content = PERSONAL_DAY_TEXTS[personalDayData.dayNumber];
  if (!content) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        onPress={handleClose} 
        style={styles.closeButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={16} color="#9CA3AF" />
      </TouchableOpacity>

      <View style={styles.contentRow}>
        <Sparkles size={24} color="#A78BFA" style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{content.title}</Text>
          <Text style={styles.description}>{content.text}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Black/50
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)', // Purple-400/30
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16, // Espaço para o botão X
  },
  title: {
    color: '#F3F4F6', // Gray-100
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 4,
  },
  description: {
    color: '#D1D5DB', // Gray-300
    fontSize: 12,
    lineHeight: 16,
  },
});