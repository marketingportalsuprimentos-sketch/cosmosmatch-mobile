import React, { useState, useEffect } from 'react';
import { 
  View, Text, Modal, StyleSheet, TouchableOpacity 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useTranslation } from 'react-i18next'; // <--- IMPORT
import { useUpdateProfile } from '@/features/profile/hooks/useProfile';

interface BehavioralQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  sunSign: string;
  existingAnswers?: number[];
}

const getSignKey = (sign: string): string => {
  const map: Record<string, string> = {
    'Áries': 'aries', 'Aries': 'aries',
    'Touro': 'taurus', 'Taurus': 'taurus',
    'Gêmeos': 'gemini', 'Gemini': 'gemini',
    'Câncer': 'cancer', 'Cancer': 'cancer',
    'Leão': 'leo', 'Leo': 'leo',
    'Virgem': 'virgo', 'Virgo': 'virgo',
    'Libra': 'libra',
    'Escorpião': 'scorpio', 'Scorpio': 'scorpio',
    'Sagitário': 'sagittarius', 'Sagittarius': 'sagittarius',
    'Capricórnio': 'capricorn', 'Capricorn': 'capricorn',
    'Aquário': 'aquarius', 'Aquarius': 'aquarius',
    'Peixes': 'pisces', 'Pisces': 'pisces',
  };
  return map[sign] || 'capricorn';
};

export const BehavioralQuizModal = ({ isOpen, onClose, sunSign, existingAnswers }: BehavioralQuizModalProps) => {
  const { t } = useTranslation(); // <--- HOOK
  const { mutateAsync: updateProfileFn, isPending } = useUpdateProfile() as any;

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(20).fill(5));
  
  const signKey = getSignKey(sunSign);
  const currentVal = answers[currentStep];

  // MONTA A CHAVE DINAMICAMENTE
  const questionKey = `zodiac_${signKey}_${currentStep + 1}`;
  const questionText = t(questionKey); // Busca a tradução

  // Define categoria baseada no índice
  let categoryLabel = t('quiz_cat_personality');
  if (currentStep >= 10 && currentStep <= 14) categoryLabel = t('quiz_cat_lifestyle');
  if (currentStep >= 15) categoryLabel = t('quiz_cat_preferences');

  useEffect(() => {
    if (existingAnswers && existingAnswers.length === 20) {
      setAnswers(existingAnswers);
    }
  }, [existingAnswers]);

  const handleSliderChange = (val: number) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = val;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentStep < 19) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      await updateProfileFn({ behavioralAnswers: answers });
      onClose();
    } catch (error) {
      console.error("Erro ao salvar quiz:", error);
    }
  };

  const getSliderColorHex = (val: number) => {
    if (val <= 3) return '#6b7280'; 
    if (val <= 7) return '#6366f1'; 
    return '#22c55e'; 
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>{t('quiz_title')}</Text>
              <Text style={styles.headerCategory}>{categoryLabel}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { width: `${((currentStep + 1) / 20) * 100}%` }]} />
          </View>

          <View style={styles.content}>
            <Text style={styles.stepText}>
                {t('quiz_step', { step: currentStep + 1 })}
            </Text>
            
            {/* Aqui aparece o texto traduzido! */}
            <Text style={styles.questionText}>{questionText}</Text>

            <View style={styles.sliderContainer}>
              <View style={styles.labelsContainer}>
                <Text style={styles.labelSmall}>{t('quiz_label_0')}</Text>
                <Text style={styles.currentValue}>{currentVal}</Text>
                <Text style={styles.labelSmall}>{t('quiz_label_10')}</Text>
              </View>

              <Slider
                style={{width: '100%', height: 40}}
                minimumValue={0} maximumValue={10} step={1} value={currentVal}
                onValueChange={handleSliderChange}
                minimumTrackTintColor={getSliderColorHex(currentVal)}
                maximumTrackTintColor="#374151"
                thumbTintColor={getSliderColorHex(currentVal)}
              />
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity onPress={handlePrev} disabled={currentStep === 0} style={[styles.navButton, currentStep === 0 && styles.navButtonDisabled]}>
              <Feather name="chevron-left" size={20} color={currentStep === 0 ? "#4b5563" : "#d1d5db"} />
              <Text style={[styles.navText, currentStep === 0 && {color: '#4b5563'}]}>{t('quiz_prev')}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNext} disabled={isPending} style={[styles.navButton, styles.primaryButton]}>
              <Text style={styles.primaryButtonText}>
                {isPending ? t('quiz_saving') : currentStep === 19 ? t('quiz_finish') : t('quiz_next')}
              </Text>
              {!isPending && <Feather name={currentStep === 19 ? "check" : "chevron-right"} size={20} color="#FFF" style={{marginLeft: 4}} />}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  container: { width: '100%', maxWidth: 400, backgroundColor: '#111827', borderRadius: 16, borderWidth: 1, borderColor: '#374151', overflow: 'hidden', maxHeight: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  headerCategory: { fontSize: 12, color: '#818cf8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: 1 },
  closeButton: { padding: 4 },
  progressBarContainer: { width: '100%', height: 4, backgroundColor: '#1f2937' },
  progressBarFill: { height: '100%', backgroundColor: '#6366f1' },
  content: { padding: 24, justifyContent: 'center' },
  stepText: { fontSize: 14, color: '#6b7280', marginBottom: 8 },
  questionText: { fontSize: 20, color: '#FFF', fontWeight: '500', lineHeight: 28, marginBottom: 32 },
  sliderContainer: { marginBottom: 16 },
  labelsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  labelSmall: { fontSize: 12, color: '#9ca3af', fontWeight: '600' },
  currentValue: { fontSize: 20, fontWeight: 'bold', color: '#a5b4fc' },
  ticksContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, marginTop: -10, zIndex: -1 },
  tick: { width: 1, height: 4, backgroundColor: '#4b5563' },
  footer: { flexDirection: 'row', padding: 16, backgroundColor: 'rgba(31, 41, 55, 0.5)', borderTopWidth: 1, borderTopColor: '#1f2937', gap: 16 },
  navButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8 },
  navButtonDisabled: { opacity: 0.5 },
  navText: { color: '#d1d5db', fontSize: 14, fontWeight: '500', marginLeft: 4 },
  primaryButton: { backgroundColor: '#4f46e5', shadowColor: '#4338ca', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 4 },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
});