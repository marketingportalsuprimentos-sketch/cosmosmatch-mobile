// mobile/src/features/discovery/components/ProfileCard.tsx
import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../hooks/useAuth'; // Ajuste de importação para hooks reais se necessário

// Mock simples se não tiver os hooks reais importados
const useGetFollowing = () => ({ data: [], isLoading: false });
const useFollowUser = () => ({ mutate: () => Alert.alert("Conexão", "Usuário seguido!"), isPending: false });
const useUnfollowUser = () => ({ mutate: () => Alert.alert("Conexão", "Usuário deixado de seguir!"), isPending: false });

interface DiscoveryProfile {
  userId: string;
  name: string;
  compatibility?: { score: number };
  profile?: {
    currentCity?: string;
    imageUrl?: string;
    sunSign?: string;
  };
}

interface ProfileCardProps {
  profile: DiscoveryProfile;
  onSwipe: (profileId: string) => void;
  onTap: (profileId: string) => void; 
}

const SWIPE_THRESHOLD = 100;
const screenWidth = Dimensions.get('window').width;

export function ProfileCard({ profile, onSwipe, onTap }: ProfileCardProps) {
  const navigation = useNavigation();

  // --- GESTOS ---
  const translateX = useSharedValue(0);
  const rotation = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const onSwipeAction = useCallback((id: string) => { onSwipe(id); }, [onSwipe]);
  const onTapAction = useCallback((id: string) => { onTap(id); }, [onTap]);

  const onGestureEvent = useAnimatedGestureHandler<PanGestureHandlerGestureEvent, { startX: number }>({
    onStart: (event, ctx) => {
      ctx.startX = translateX.value;
      isDragging.value = true;
    },
    onActive: (event, ctx) => {
      translateX.value = event.translationX + ctx.startX;
      rotation.value = translateX.value * 0.1;
    },
    onEnd: (event) => {
      isDragging.value = false;
      const offset = translateX.value;
      if (Math.abs(offset) > SWIPE_THRESHOLD) {
        const direction = offset > 0 ? screenWidth : -screenWidth;
        translateX.value = withSpring(direction * 1.5, { velocity: event.velocityX * 0.5 }, () => {
          runOnJS(onSwipeAction)(profile.userId);
        });
      } else {
        translateX.value = withSpring(0);
        rotation.value = withSpring(0);
        if (Math.abs(event.translationX) < 5) {
             runOnJS(onTapAction)(profile.userId);
        }
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { rotate: `${rotation.value}deg` }],
  }));

  // --- Lógica ---
  const { user: loggedInUser } = useAuth();
  const targetUserId = profile.userId;
  const { data: followingList, isLoading: isLoadingFollowing } = useGetFollowing();
  const { mutate: followUser, isPending: isFollowing } = useFollowUser(); // Usando mock ou hook real
  const { mutate: unfollowUser, isPending: isUnfollowing } = useUnfollowUser();

  const isAlreadyFollowing = followingList?.some((user: any) => user.id === targetUserId);
  const isConnectLoading = isFollowing || isUnfollowing || isLoadingFollowing;

  const handleConnectClick = () => {
    if (isConnectLoading || !targetUserId) return;
    if (isAlreadyFollowing) unfollowUser(targetUserId);
    else followUser(targetUserId);
  };

  // Dados
  const compatibilityScore = profile.compatibility?.score ?? 0;
  const name = profile.name ?? 'Usuário';
  const displayCity = profile.profile?.currentCity ?? 'N/A';
  const sunSign = profile.profile?.sunSign ?? 'N/A';
  const imageUrl = profile.profile?.imageUrl ?? null;
  const cardHeight = screenWidth * 0.95 * 1.5;

  return (
    <PanGestureHandler onGestureEvent={onGestureEvent}>
      <Animated.View style={[styles.cardWrapper, animatedStyle, { height: cardHeight }]}>
        <View style={styles.cardContent}>
          
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.backgroundImage} resizeMode="cover" />
          ) : (
            <View style={styles.noImageBackground}><Text style={styles.noImageText}>Sem imagem</Text></View>
          )}

          {/* Afinidade (Esquerda) */}
          <View style={styles.affinityContainer}>
            <View style={styles.affinityBox}>
              <Ionicons name="sparkles" size={20} color="#C4B5FD" />
              <Text style={styles.affinityScore}>{compatibilityScore}%</Text>
            </View>
          </View>

          {/* LUPA (Direita Superior - Confirmado) */}
          <TouchableOpacity
            style={styles.searchButtonContainer}
            onPress={() => navigation.navigate('UserSearchScreen' as never)} 
            activeOpacity={0.8}
          >
            <Ionicons name="search" size={20} color="white" />
          </TouchableOpacity>

          <View style={styles.gradientOverlay} />

          <View style={styles.infoContainer}>
            <Text style={styles.nameText} numberOfLines={1}>{name}</Text>
            <View style={styles.detailsContainer}>
              {sunSign !== 'N/A' && (
                <View style={styles.detailItem}>
                  <Ionicons name="sunny" size={20} color="#D1D5DB" />
                  <Text style={styles.detailText}>{sunSign}</Text>
                </View>
              )}
              {displayCity !== 'N/A' && (
                <View style={styles.detailItem}>
                  <Ionicons name="location" size={20} color="#D1D5DB" />
                  <Text style={styles.detailText}>{displayCity}</Text>
                </View>
              )}
            </View>
            
            <TouchableOpacity
              onPress={handleConnectClick}
              disabled={isConnectLoading}
              style={[styles.connectButton, isAlreadyFollowing ? styles.buttonFollowing : styles.buttonConnect]}
            >
              {isConnectLoading ? <ActivityIndicator color="#FFF" size="small" /> : (
                <>
                  <Ionicons name={isAlreadyFollowing ? "person-remove" : "person-add"} size={20} color="white" />
                  <Text style={styles.buttonText}>{isAlreadyFollowing ? 'Seguindo' : 'Conectar'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: screenWidth * 0.95, borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, elevation: 8,
    backgroundColor: '#1F2937',
  },
  cardContent: { flex: 1 },
  backgroundImage: { position: 'absolute', width: '100%', height: '100%' },
  noImageBackground: { flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: '#4B5563' },
  noImageText: { color: '#D1D5DB', fontSize: 14 },
  gradientOverlay: { position: 'absolute', bottom: 0, width: '100%', height: '50%', backgroundColor: 'transparent', opacity: 0.8 },
  
  affinityContainer: { position: 'absolute', left: 16, top: 16, zIndex: 10 },
  affinityBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 50,
    backgroundColor: 'rgba(28, 25, 38, 0.7)', paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(192, 132, 252, 0.3)',
  },
  affinityScore: { fontSize: 18, fontWeight: 'bold', color: '#E9D5FF' },
  
  searchButtonContainer: {
    position: 'absolute', right: 16, top: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(28, 25, 38, 0.7)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  
  infoContainer: { position: 'absolute', bottom: 0, padding: 24, width: '100%', zIndex: 10 },
  nameText: { fontSize: 32, fontWeight: 'bold', color: 'white', marginBottom: 8 },
  detailsContainer: { gap: 5, marginBottom: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 16, color: '#D1D5DB', fontWeight: '500' },
  connectButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 8, gap: 8, width: '100%' },
  buttonConnect: { backgroundColor: '#6366F1' },
  buttonFollowing: { backgroundColor: '#4B5563' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});