// src/features/astrology/components/PowerAspectDetailModal.tsx



import React, { useRef, useState } from 'react';

import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { X, Share2, Sparkles, Briefcase, Star, Heart, ShieldCheck, Sun, Moon, User } from 'lucide-react-native';

import { captureRef } from 'react-native-view-shot';

import * as Sharing from 'expo-sharing';

import { PowerAspect } from '../../../types/profile.types';



interface PowerAspectDetailModalProps {

  card: PowerAspect | null;

  onClose: () => void;

}



const getIconComponent = (iconName: string) => {

  const iconMap: Record<string, any> = {

    briefcase: Briefcase,

    star: Star,

    heart: Heart,

    shield: ShieldCheck,

    sun: Sun,

    moon: Moon,

    user: User,

  };

  return iconMap[iconName] || Sparkles;

};



export const PowerAspectDetailModal = ({ card, onClose }: PowerAspectDetailModalProps) => {

  const viewShotRef = useRef<View>(null);

  const [isSharing, setIsSharing] = useState(false);



  if (!card) return null;



  const IconComponent = getIconComponent(card.icon);



  const handleShare = async () => {

    try {

      setIsSharing(true);

      

      if (!(await Sharing.isAvailableAsync())) {

        Alert.alert("Indisponível", "O compartilhamento não está disponível.");

        setIsSharing(false);

        return;

      }



      const uri = await captureRef(viewShotRef, {

        format: 'png',

        quality: 0.8,

        result: 'tmpfile',

      });



      await Sharing.shareAsync(uri, {

        mimeType: 'image/png',

        dialogTitle: `Carta: ${card.title}`,

        UTI: 'public.png',

      });



    } catch (error) {

      console.error("Erro ao compartilhar:", error);

    } finally {

      setIsSharing(false);

    }

  };



  return (

    <Modal 

      visible={!!card} 

      transparent={true} 

      animationType="fade" 

      onRequestClose={onClose}

    >

      <View style={styles.overlay}>

        {/* Container Principal com Altura Mínima Garantida */}

        <View style={styles.modalContainer}>

          

          <LinearGradient

            colors={['#1F2937', '#111827']}

            style={styles.gradientBg}

          >

            {/* Header: Botão Fechar */}

            <View style={styles.headerRow}>

                <View style={{flex: 1}} />

                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>

                    <X size={24} color="#D1D5DB" />

                </TouchableOpacity>

            </View>



            <ScrollView 

              contentContainerStyle={styles.scrollContent}

              showsVerticalScrollIndicator={false}

            >

              {/* --- ÁREA QUE SERÁ FOTOGRAFADA --- */}

              <View 

                ref={viewShotRef} 

                collapsable={false} 

                style={styles.captureContainer}

              >

                  {/* Fundo interno para garantir que a foto não saia transparente */}

                  <View style={styles.cardInner}>

                      <View style={styles.iconCircle}>

                        <IconComponent size={48} color="#818CF8" />

                      </View>



                      <Text style={styles.title}>{card.title}</Text>

                      

                      <View style={styles.divider} />



                      <Text style={styles.description}>{card.description}</Text>



                      <View style={styles.branding}>

                          <Text style={styles.brandingText}>CosmosMatch ✨</Text>

                      </View>

                  </View>

              </View>



              {/* Botão de Ação */}

              <TouchableOpacity 

                onPress={handleShare} 

                style={[styles.shareBtn, isSharing && styles.btnDisabled]}

                disabled={isSharing}

              >

                {isSharing ? (

                    <ActivityIndicator size="small" color="#FFF" />

                ) : (

                    <Share2 size={20} color="#FFF" style={{marginRight: 10}} />

                )}

                <Text style={styles.shareText}>

                    {isSharing ? 'Gerando...' : 'Partilhar Carta'}

                </Text>

              </TouchableOpacity>



            </ScrollView>

          </LinearGradient>

        </View>

      </View>

    </Modal>

  );

};



const { width, height } = Dimensions.get('window');



const styles = StyleSheet.create({

  overlay: {

    flex: 1,

    backgroundColor: 'rgba(0,0,0,0.8)',

    justifyContent: 'center',

    alignItems: 'center',

    padding: 20,

  },

  modalContainer: {

    width: width - 70,

    minHeight: 550, // <--- CORREÇÃO: Força altura mínima para não colapsar

    maxHeight: height * 0.8,

    borderRadius: 24,

    overflow: 'hidden',

    borderWidth: 1,

    borderColor: '#374151',

    backgroundColor: '#1F2937', // Cor de fundo de segurança

  },

  gradientBg: {

    flex: 1,

    width: '100%',

  },

  headerRow: {

    flexDirection: 'row',

    justifyContent: 'flex-end',

    padding: 16,

    zIndex: 10,

  },

  closeBtn: {

    padding: 8,

    backgroundColor: 'rgba(255,255,255,0.1)',

    borderRadius: 20,

  },

  scrollContent: {

    alignItems: 'center',

    paddingHorizontal: 24,

    paddingBottom: 30,

  },

  

  // Container da Foto

  captureContainer: {

    width: '100%',

    backgroundColor: '#111827', // Fundo sólido para a foto

    borderRadius: 16,

    marginBottom: 24,

    overflow: 'hidden', // Garante bordas arredondadas na foto

    borderWidth: 1,

    borderColor: '#374151',

  },

  cardInner: {

    padding: 24,

    alignItems: 'center',

    backgroundColor: '#111827',

  },

  

  iconCircle: {

    width: 80,

    height: 80,

    borderRadius: 40,

    backgroundColor: 'rgba(129, 140, 248, 0.15)',

    justifyContent: 'center',

    alignItems: 'center',

    marginBottom: 16,

    borderWidth: 2,

    borderColor: '#818CF8',

  },

  title: {

    fontSize: 22,

    fontWeight: 'bold',

    color: '#FFF',

    textAlign: 'center',

    marginBottom: 16,

    lineHeight: 30,

  },

  divider: {

    width: 50,

    height: 4,

    backgroundColor: '#374151',

    borderRadius: 2,

    marginBottom: 16,

  },

  description: {

    fontSize: 15,

    color: '#D1D5DB',

    textAlign: 'center',

    lineHeight: 24,

    marginBottom: 20,

  },

  branding: {

    marginTop: 8,

    opacity: 0.5,

  },

  brandingText: {

    color: '#818CF8',

    fontWeight: 'bold',

    fontSize: 12,

    textTransform: 'uppercase',

    letterSpacing: 1,

  },



  // Botão Share

  shareBtn: {

    flexDirection: 'row',

    backgroundColor: '#4F46E5',

    paddingVertical: 14,

    paddingHorizontal: 32,

    borderRadius: 16,

    alignItems: 'center',

    width: '100%',

    justifyContent: 'center',

    shadowColor: '#4F46E5',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.3,

    shadowRadius: 8,

    elevation: 5,

  },

  btnDisabled: {

    opacity: 0.7,

  },

  shareText: {

    color: '#FFF',

    fontWeight: 'bold',

    fontSize: 16,

  }

});