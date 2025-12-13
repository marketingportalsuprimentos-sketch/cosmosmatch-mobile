import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeedPost, MediaType } from '../services/feedApi';
import { useTranslation } from 'react-i18next';
// MUDANÇA V26: Importando o player novo
import { useVideoPlayer, VideoView } from 'expo-video';

const { width } = Dimensions.get('window');

// --- FUNÇÃO DE OTIMIZAÇÃO (Padrão V26) ---
const getOptimizedVideoUrl = (url: string) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  if (url.includes('vc_h264')) return url;

  let optimized = url.replace(
    /\/upload\//,
    '/upload/f_mp4,vc_h264,q_auto:eco,br_1m/'
  );

  if (optimized.endsWith('.mov')) {
    optimized = optimized.replace('.mov', '.mp4');
  }
  return optimized;
};

interface FeedPostCardProps {
  post: FeedPost;
  authorName: string;
  authorAvatar: string | null;
  onLike: () => void;
  onComment: () => void;
  onDelete?: () => void; 
  isOwner: boolean;
}

export function FeedPostCard({ post, authorName, authorAvatar, onLike, onComment, onDelete, isOwner }: FeedPostCardProps) {
  const { t, i18n } = useTranslation();
  
  const date = new Date(post.createdAt).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' });

  // --- DETECÇÃO INTELIGENTE V26 ---
  const isVideo = 
    post.mediaType === MediaType.VIDEO || 
    post.mediaType === 'video' || 
    (post.imageUrl && (post.imageUrl.includes('.mov') || post.imageUrl.includes('.mp4')));

  // Prepara player (mudo e em loop para preview)
  const videoSource = isVideo ? getOptimizedVideoUrl(post.imageUrl) : null;
  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.muted = true; // Mudo por padrão em cards de lista
    // player.play(); // Descomente se quiser autoplay na lista
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          {authorAvatar ? (
            <Image source={{ uri: authorAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}><Ionicons name="person" size={16} color="#9CA3AF" /></View>
          )}
          <View>
             <Text style={styles.authorName}>{authorName}</Text>
             <Text style={styles.dateText}>{date}</Text>
          </View>
        </View>
        {isOwner && (
          <TouchableOpacity onPress={onDelete}><Ionicons name="trash-outline" size={20} color="#EF4444" /></TouchableOpacity>
        )}
      </View>

      <View style={styles.mediaContainer}>
         {isVideo ? (
            // AGORA MOSTRA O VÍDEO REAL (V26)
            <View style={styles.videoContainer}>
                <VideoView
                    player={player}
                    style={styles.image} // Usa mesmo estilo da imagem para preencher
                    contentFit="cover"
                    nativeControls={false}
                />
                {/* Ícone de Play sobreposto para indicar que é vídeo */}
                <View style={styles.playIconOverlay}>
                    <Ionicons name="play-circle" size={40} color="rgba(255,255,255,0.7)" />
                </View>
            </View>
         ) : (
            <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" />
         )}
      </View>

      <View style={styles.actionsRow}>
         <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Ionicons name={post.isLikedByMe ? "heart" : "heart-outline"} size={26} color={post.isLikedByMe ? "#EF4444" : "white"} />
            <Text style={styles.actionText}>{post.likesCount}</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <Ionicons name="chatbubble-outline" size={24} color="white" />
            <Text style={styles.actionText}>{post.commentsCount}</Text>
         </TouchableOpacity>
      </View>

      {post.content && (
        <Text style={styles.content} numberOfLines={3}>
           <Text style={{fontWeight: 'bold'}}>{authorName} </Text>{post.content}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20, backgroundColor: '#1F2937', paddingBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 },
  authorInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  placeholderAvatar: { backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' },
  authorName: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  dateText: { color: '#9CA3AF', fontSize: 12 },
  mediaContainer: { width: '100%', height: width }, 
  image: { width: '100%', height: '100%' },
  videoContainer: { width: '100%', height: '100%', backgroundColor: 'black' },
  playIconOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  actionsRow: { flexDirection: 'row', padding: 10, gap: 20 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  content: { color: '#D1D5DB', paddingHorizontal: 10, fontSize: 14, lineHeight: 20 }
});