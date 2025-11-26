import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Sparkles, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next'; // <--- I18N
import { useGetPersonalDayVibration } from '../../../features/profile/hooks/useProfile';

const LOCAL_STORAGE_KEY = 'cosmosmatch_dismissed_personal_day';

const getTodayDateString = () => { return new Date().toISOString().split('T')[0]; };

export const PersonalDayCard = () => {
  const { t } = useTranslation(); // <--- HOOK
  const { data: personalDayData, isLoading, isError } = useGetPersonalDayVibration();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => { checkVisibility(); }, []);

  const checkVisibility = async () => {
    try {
      const dismissedDate = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
      const todayDate = getTodayDateString();
      if (dismissedDate !== todayDate) setIsVisible(true);
    } catch (error) { }
  };

  const handleClose = async () => {
    setIsVisible(false);
    try { await AsyncStorage.setItem(LOCAL_STORAGE_KEY, getTodayDateString()); } catch (error) { }
  };

  if (!isVisible || isLoading || isError || !personalDayData) return null;

  const day = personalDayData.dayNumber;
  // Chaves dinâmicas do i18n
  const title = t(`pday_title_${day}`);
  const text = t(`pday_text_${day}`);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleClose} style={styles.closeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <X size={16} color="#9CA3AF" />
      </TouchableOpacity>
      <View style={styles.contentRow}>
        <Sparkles size={24} color="#A78BFA" style={styles.icon} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{text}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginHorizontal: 16, marginTop: 16, padding: 12, backgroundColor: 'rgba(0, 0, 0, 0.5)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(167, 139, 250, 0.3)', position: 'relative' },
  closeButton: { position: 'absolute', top: 8, right: 8, zIndex: 10 },
  contentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  icon: { marginRight: 12, marginTop: 2 },
  textContainer: { flex: 1, paddingRight: 16 },
  title: { color: '#F3F4F6', fontWeight: '600', fontSize: 14, marginBottom: 4 },
  description: { color: '#D1D5DB', fontSize: 12, lineHeight: 16 },
});