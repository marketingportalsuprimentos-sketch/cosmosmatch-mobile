// src/features/feed/components/FeedPostCard.tsx

import React, { useEffect, useRef, useState } from 'react';
import { 
  View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, 
  ActivityIndicator, Platform, Alert 
} from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLikePost, useUnlikePost } from '@/features/feed/hooks/useFeed';
import { restorePost } from '../services/feedApi';
import { FeedPost, MediaType } from '@/types/feed.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FeedPostCardProps {
  post: FeedPost;
  author: { id: string; name: string; profile?: { imageUrl?: string | null } };
  isActive: boolean;
  isFollowedByMe: boolean; // <--- NOVO PROP
  onShare?: () => void;
  onOptions?: () => void;
  onDelete?: () => void;
  onOpenComments?: () => void;
  onFollow?: () => void; // <--- NOVO PROP
}

export const FeedPostCard: React.FC<FeedPostCardProps> = ({ 
  post, 
  author, 
  isActive, 
  isFollowedByMe, // Recebe o status
  onShare,
  onOptions,
  onDelete,
  onOpenComments,
  onFollow // Recebe a função
}) => {
  const { user } = useAuth();
  
  const videoRef = useRef<Video>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const { mutate: likePost } = useLikePost();
  const { mutate: unlikePost } = useUnlikePost();

  const isOwner = user?.id === author.id;
  const isAdmin = user?.role === 'ADMIN';
  const isHidden = post.isHidden;

  // Lógica de Vídeo
  useEffect(() => {
    if (post.mediaType === MediaType.VIDEO && videoRef.current) {
      if (isActive && !isHidden) {
        videoRef.current.playAsync();
      } else {
        videoRef.current.pauseAsync();
        if (!isActive) videoRef.current.setPositionAsync(0);
      }
    }
  }, [isActive, isHidden, post.mediaType]);

  const handleRestore = async () => {
    try {
      setIsRestoring(true);
      await restorePost(post.id);
      Alert.alert('Sucesso', 'Conteúdo restaurado. Atualize o feed.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível restaurar.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleLike = () => {
    if (post.isLikedByMe) unlikePost(post.id);
    else likePost(post.id);
  };

  const shouldRenderVideo = isActive && post.mediaType === MediaType.VIDEO;
  const shouldPlayVideo = isActive && !isHidden; 

  return (
    <View style={styles.container}>
      {/* 1. Mídia */}
      <View style={styles.mediaContainer}>
        {shouldRenderVideo ? (
          <Video
            ref={videoRef}
            source={{ uri: post.imageUrl }}
            style={styles.media}
            resizeMode={ResizeMode.CONTAIN}
            isLooping={true}
            shouldPlay={shouldPlayVideo}
            isMuted={false}
            onLoad={() => setIsVideoLoaded(true)}
            posterSource={{ uri: post.imageUrl }}
            posterStyle={{ resizeMode: 'contain' }}
            usePoster
          />
        ) : (
          <Image source={{ uri: post.imageUrl }} style={styles.media} resizeMode="contain" />
        )}
        
        {shouldRenderVideo && !isVideoLoaded && !isHidden && (
            <ActivityIndicator size="large" color="white" style={StyleSheet.absoluteFill} />
        )}
      </View>

      {/* 2. Blur / Conteúdo Oculto */}
      {isHidden && (
        <View style={[StyleSheet.absoluteFill, styles.blurOverlay]}>
           <Ionicons name="eye-off" size={64} color="#4B5563" style={{ marginBottom: 20 }} />
           <Text style={styles.hiddenTitle}>Conteúdo Oculto</Text>
           <Text style={styles.hiddenDesc}>Este post está sob análise da moderação.</Text>
           {isAdmin && (
             <View style={styles.adminPanel}>
                <Text style={styles.adminLabel}>PAINEL DE ADMIN</Text>
                <TouchableOpacity style={styles.restoreButton} onPress={handleRestore} disabled={isRestoring}>
                  {isRestoring ? <ActivityIndicator color="black" /> : (
                    <><Ionicons name="lock-open" size={18} color="black" /><Text style={styles.restoreText}>Restaurar Conteúdo</Text></>
                  )}
                </TouchableOpacity>
             </View>
           )}
        </View>
      )}

      {/* 3. Interface Normal */}
      {!isHidden && (
        <>
          <View style={styles.sideActions}>
            
            {/* --- BOTÃO DE SEGUIR (Avatar + Badge) --- */}
            {/* Só mostra se NÃO for o dono do post */}
            {!isOwner && (
              <TouchableOpacity onPress={onFollow} style={styles.followButtonContainer}>
                  <Image 
                    source={{ uri: author.profile?.imageUrl || 'https://via.placeholder.com/50' }} 
                    style={styles.followAvatar} 
                  />
                  <View style={[
                      styles.followBadge, 
                      { backgroundColor: isFollowedByMe ? 'white' : '#EC4899' } // Branco se segue (menos), Rosa se não (mais)
                  ]}>
                      <Ionicons 
                        name={isFollowedByMe ? "remove" : "add"} 
                        size={12} 
                        color={isFollowedByMe ? "black" : "white"} 
                      />
                  </View>
              </TouchableOpacity>
            )}

            {/* Coração */}
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Ionicons name={post.isLikedByMe ? "heart" : "heart-outline"} size={35} color={post.isLikedByMe ? "#ef4444" : "white"} />
              <Text style={styles.actionText}>{post.likesCount}</Text>
            </TouchableOpacity>

            {/* Comentários */}
            <TouchableOpacity style={styles.actionButton} onPress={onOpenComments}>
              <Ionicons name="chatbubble-ellipses" size={32} color="white" />
              <Text style={styles.actionText}>{post.commentsCount}</Text>
            </TouchableOpacity>

            {/* Share */}
            <TouchableOpacity style={styles.actionButton} onPress={onShare}>
              <Ionicons name="share-social" size={32} color="white" />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>

            {/* Menu / Lixeira */}
            {isOwner ? (
              <TouchableOpacity style={[styles.actionButton, { marginTop: 10 }]} onPress={onDelete}>
                  <View style={styles.deleteButtonBg}><Ionicons name="trash-bin" size={24} color="white" /></View>
                  <Text style={styles.actionText}>Excluir</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionButton} onPress={onOptions}>
                  <Ionicons name="ellipsis-horizontal" size={28} color="white" />
              </TouchableOpacity>
            )}
          </View>

          {post.content && (
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.bottomOverlay}>
              <Text style={styles.content} numberOfLines={3}>{post.content}</Text>
            </LinearGradient>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: 'black' },
  mediaContainer: { width: '100%', height: '100%', position: 'absolute' },
  media: { width: '100%', height: '100%' },
  
  blurOverlay: { backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: 30 },
  hiddenTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  hiddenDesc: { color: '#6B7280', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 40 },
  adminPanel: { width: '100%', backgroundColor: '#1F2937', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#374151', alignItems: 'center' },
  adminLabel: { color: '#F59E0B', fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 15, textTransform: 'uppercase' },
  restoreButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'white', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, width: '100%', gap: 8 },
  restoreText: { color: 'black', fontWeight: 'bold', fontSize: 16 },
  
  // ESTILOS DO BOTÃO SEGUIR
  followButtonContainer: { marginBottom: 15, alignItems: 'center', position: 'relative' },
  followAvatar: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 1, borderColor: 'white' },
  followBadge: { 
    position: 'absolute', 
    bottom: -8, 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },

  sideActions: { position: 'absolute', right: 10, bottom: 120, alignItems: 'center', zIndex: 30, gap: 20 },
  actionButton: { alignItems: 'center' },
  actionText: { color: 'white', fontSize: 12, fontWeight: '600', marginTop: 4, textShadowColor: 'black', textShadowRadius: 5 },
  deleteButtonBg: { backgroundColor: 'rgba(239, 68, 68, 0.8)', padding: 8, borderRadius: 20 },
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 90, paddingTop: 40, zIndex: 20 },
  content: { color: 'white', fontSize: 15, lineHeight: 22, textShadowColor: 'black', textShadowRadius: 3 },
});