// src/features/profile/components/BehavioralQuizModal.tsx

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { ZODIAC_QUESTIONS } from '@/constants/zodiacQuestions';
// CORREÇÃO: Importando o hook específico que existe no seu arquivo
import { useUpdateProfile } from '@/features/profile/hooks/useProfile';

interface BehavioralQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  sunSign: string;
  existingAnswers?: number[];
}

const getSignKey = (sign: string): string => {
  const map: Record<string, string> = {
    'Áries': 'Aries', 'Aries': 'Aries',
    'Touro': 'Taurus', 'Taurus': 'Taurus',
    'Gêmeos': 'Gemini', 'Gemini': 'Gemini',
    'Câncer': 'Cancer', 'Cancer': 'Cancer',
    'Leão': 'Leo', 'Leo': 'Leo',
    'Virgem': 'Virgo', 'Virgo': 'Virgo',
    'Libra': 'Libra',
    'Escorpião': 'Scorpio', 'Scorpio': 'Scorpio',
    'Sagitário': 'Sagittarius', 'Sagittarius': 'Sagittarius',
    'Capricórnio': 'Capricorn', 'Capricorn': 'Capricorn',
    'Aquário': 'Aquarius', 'Aquarius': 'Aquarius',
    'Peixes': 'Pisces', 'Pisces': 'Pisces',
  };
  return map[sign] || 'Capricorn';
};

export const BehavioralQuizModal = ({ isOpen, onClose, sunSign, existingAnswers }: BehavioralQuizModalProps) => {
  // CORREÇÃO: Usando o hook correto de mutação
  const { mutateAsync: updateProfileFn, isPending, isLoading } = useUpdateProfile() as any; 
  // (O cast 'as any' é uma segurança temporária caso as versões do TanStack variem entre v4/v5, garantindo acesso a isPending ou isLoading)
  
  const isUpdating = isPending || isLoading;

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(20).fill(5));
  
  const signKey = getSignKey(sunSign);
  const questions = ZODIAC_QUESTIONS[signKey] || ZODIAC_QUESTIONS['Capricorn'];
  const currentQuestion = questions[currentStep];
  const currentVal = answers[currentStep];

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
      // Envia os dados para a API
      await updateProfileFn({
        behavioralAnswers: answers
      });
      onClose();
    } catch (error) {
      console.error("Erro ao salvar quiz:", error);
    }
  };

  // Cores convertidas para Hex (Slider nativo precisa disso)
  const getSliderColorHex = (val: number) => {
    if (val <= 3) return '#6b7280'; // gray-500
    if (val <= 7) return '#6366f1'; // indigo-500
    return '#22c55e'; // green-500
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Sintonia Cósmica</Text>
              <Text style={styles.headerCategory}>
                {currentQuestion?.category || 'Personalidade'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Barra de Progresso */}
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBarFill, 
                { width: `${((currentStep + 1) / 20) * 100}%` }
              ]} 
            />
          </View>

          {/* Conteúdo */}
          <View style={styles.content}>
            <Text style={styles.stepText}>
              Pergunta {currentQuestion?.id || currentStep + 1} de 20
            </Text>
            
            <Text style={styles.questionText}>
              {currentQuestion?.text || 'Carregando pergunta...'}
            </Text>

            {/* Slider Area */}
            <View style={styles.sliderContainer}>
              <View style={styles.labelsContainer}>
                <Text style={styles.labelSmall}>Não sou assim (0)</Text>
                <Text style={styles.currentValue}>{currentVal}</Text>
                <Text style={styles.labelSmall}>Totalmente eu (10)</Text>
              </View>

              <Slider
                style={{width: '100%', height: 40}}
                minimumValue={0}
                maximumValue={10}
                step={1}
                value={currentVal}
                onValueChange={handleSliderChange}
                minimumTrackTintColor={getSliderColorHex(currentVal)}
                maximumTrackTintColor="#374151"
                thumbTintColor={getSliderColorHex(currentVal)}
              />
              
              <View style={styles.ticksContainer}>
                {[...Array(11)].map((_, i) => (
                  <View key={i} style={styles.tick} />
                ))}
              </View>
            </View>
          </View>

          {/* Footer (Botões) */}
          <View style={styles.footer}>
            <TouchableOpacity 
              onPress={handlePrev}
              disabled={currentStep === 0}
              style={[
                styles.navButton, 
                currentStep === 0 && styles.navButtonDisabled
              ]}
            >
              <Feather name="chevron-left" size={20} color={currentStep === 0 ? "#4b5563" : "#d1d5db"} />
              <Text style={[styles.navText, currentStep === 0 && {color: '#4b5563'}]}>Anterior</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleNext}
              disabled={isUpdating}
              style={[styles.navButton, styles.primaryButton]}
            >
              <Text style={styles.primaryButtonText}>
                {isUpdating ? 'Salvando...' : currentStep === 19 ? 'Finalizar' : 'Próxima'}
              </Text>
              {!isUpdating && (
                <Feather 
                  name={currentStep === 19 ? "check" : "chevron-right"} 
                  size={20} 
                  color="#FFF" 
                  style={{marginLeft: 4}}
                />
              )}
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#111827', 
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#374151', 
    overflow: 'hidden',
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerCategory: {
    fontSize: 12,
    color: '#818cf8', 
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
  },
  closeButton: {
    padding: 4,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#1f2937',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1', 
  },
  content: {
    padding: 24,
    justifyContent: 'center',
  },
  stepText: {
    fontSize: 14,
    color: '#6b7280', 
    marginBottom: 8,
  },
  questionText: {
    fontSize: 20,
    color: '#FFF',
    fontWeight: '500',
    lineHeight: 28,
    marginBottom: 32,
  },
  sliderContainer: {
    marginBottom: 16,
  },
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  labelSmall: {
    fontSize: 12,
    color: '#9ca3af', 
    fontWeight: '600',
  },
  currentValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#a5b4fc', 
  },
  ticksContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12, 
    marginTop: -10, 
    zIndex: -1,
  },
  tick: {
    width: 1,
    height: 4,
    backgroundColor: '#4b5563',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'rgba(31, 41, 55, 0.5)', 
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    gap: 16,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navText: {
    color: '#d1d5db', 
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  primaryButton: {
    backgroundColor: '#4f46e5', 
    shadowColor: '#4338ca',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});