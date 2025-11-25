import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons'; 
import { DiscoveryProfile } from '../services/discoveryApi';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.92;
const CARD_HEIGHT = SCREEN_WIDTH * 1.45;

interface SwipeableProfileCardProps {
  profile: DiscoveryProfile;
  onSwipeRight: () => void;
  onSwipeLeft: () => void;
  onTap: () => void;
}

export function SwipeableProfileCard({ profile, onSwipeRight, onSwipeLeft, onTap }: SwipeableProfileCardProps) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
  }, [profile.userId]);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 120) {
        const direction = event.translationX > 0 ? 'right' : 'left';
        const targetX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
        
        translateX.value = withTiming(targetX, { duration: 200 }, () => {
          if (direction === 'right') runOnJS(onSwipeRight)();
          else runOnJS(onSwipeLeft)();
        });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_WIDTH/2, SCREEN_WIDTH/2], [-10, 10]);
    return { transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotate}deg` }] };
  });

  const imageUrl = profile.profile?.imageUrl;
  const name = profile.name || 'Sem Nome';
  const city = profile.profile?.currentCity || 'Localização desconhecida';
  const score = profile.compatibility?.score ?? 0;

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, animatedStyle]}>
        
        {/* IMAGEM DE FUNDO */}
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, {backgroundColor: '#374151', alignItems:'center', justifyContent:'center'}]}>
             <Ionicons name="person" size={80} color="#6B7280" />
          </View>
        )}

        {/* GRADIENTE (Para leitura do texto) */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.95)']}
          style={styles.gradient}
        />

        {/* TOPO: BADGE AFINIDADE (ESQ) + LUPA (DIR) */}
        <View style={styles.topContainer}>
           {/* Badge Afinidade Roxo */}
           <View style={styles.affinityBadge}>
              <Ionicons name="sparkles" size={14} color="#E9D5FF" />
              <Text style={styles.affinityLabel}>Afinidade</Text>
              <Text style={styles.affinityScore}>{Math.round(score)}%</Text>
           </View>

           {/* Botão Lupa (Círculo Transparente) */}
           <TouchableOpacity style={styles.searchIconBtn}>
              <Ionicons name="search" size={20} color="white" />
           </TouchableOpacity>
        </View>

        {/* RODAPÉ DO CARD: NOME, LOCAL, BOTÃO CONECTAR */}
        <View style={styles.bottomContainer}>
           {/* Nome Grande */}
           <Text style={styles.nameText}>{name}</Text>
           
           {/* Localização com Ícone */}
           <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={16} color="#E5E7EB" />
              <Text style={styles.locationText}>{city}</Text>
           </View>

           {/* Botão CONECTAR (Igual ao Print) */}
           <TouchableOpacity 
              style={styles.connectButton} 
              onPress={onSwipeRight} // Conectar = Swipe Right (Like)
              activeOpacity={0.8}
           >
              <Ionicons name="person-add" size={18} color="white" style={{marginRight: 8}} />
              <Text style={styles.connectButtonText}>Conectar</Text>
           </TouchableOpacity>
        </View>

      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 24, // Bordas bem arredondadas igual ao print
    backgroundColor: '#1F2937',
    overflow: 'hidden',
    position: 'absolute',
    elevation: 5,
  },
  image: { width: '100%', height: '100%' },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' },
  
  // Topo
  topContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, width: '100%', position: 'absolute', top: 0 },
  affinityBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(50, 40, 70, 0.85)', // Fundo roxo escuro translúcido
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)'
  },
  affinityLabel: { color: '#E9D5FF', fontSize: 12, marginLeft: 4, marginRight: 4, fontWeight: '500' },
  affinityScore: { color: '#C084FC', fontSize: 14, fontWeight: 'bold' },
  
  searchIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center'
  },

  // Rodapé Interno
  bottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  nameText: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 4 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  locationText: { color: '#E5E7EB', fontSize: 14, marginLeft: 6 },
  
  // Botão Conectar
  connectButton: {
    backgroundColor: '#6366F1', // Indigo/Roxo vibrante (Igual print)
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: 14, borderRadius: 12,
    width: '100%',
    shadowColor: "#6366F1", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4.65,
  },
  connectButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});