import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeedPost } from '../services/feedApi';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
// Mantendo o padrão V26 dos seus ficheiros enviados
import { useVideoPlayer, VideoView } from 'expo-video';

const { width } = Dimensions.get('window');

// --- FUNÇÃO DE OTIMIZAÇÃO (Padrão V26 identificado nos seus ficheiros) ---
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
  authorId: string; // Necessário para a navegação
  onLike: () => void;
  onComment: () => void;
  onDelete?: () => void; 
  isOwner: boolean;
}

export function FeedPostCard({ 
  post, 
  authorName, 
  authorAvatar, 
  authorId, 
  onLike, 
  onComment, 
  onDelete, 
  isOwner 
}: FeedPostCardProps) {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  
  const date = new Date(post.createdAt).toLocaleDateString(i18n.language, { 
    day: '2-digit', 
    month: 'short' 
  });

  // --- DETECÇÃO INTELIGENTE V26 (Baseada no seu FeedUserDeck.tsx) ---
  const isVideo = 
    post.mediaType === 'VIDEO' || 
    post.mediaType === 'video' || 
    (post.imageUrl && (post.imageUrl.toLowerCase().includes('.mov') || post.imageUrl.toLowerCase().includes('.mp4')));

  // Prepara player (mudo e em loop conforme sua estrutura funcional)
  const videoSource = isVideo ? getOptimizedVideoUrl(post.imageUrl) : null;
  const player = useVideoPlayer(videoSource, player => {
    player.loop = true;
    player.muted = true; 
  });

  // Função para navegar ao perfil (como solicitado: clicar no nome direciona)
  const goToProfile = () => {
    if (authorId) {
      // Usando 'Profile' que é o padrão de navegação de decks
      navigation.navigate('Profile', { userId: authorId });
    }
  };

  const handleReport = () => {
    Alert.alert(t('report', 'Denúncia'), t('report_confirm', 'Deseja denunciar esta publicação?'), [
      { text: t('cancel', 'Cancelar'), style: "cancel" },
      { text: t('report', 'Denunciar'), onPress: () => console.log("Denunciado"), style: "destructive" }
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* Clique no cabeçalho direciona para o perfil */}
        <TouchableOpacity style={styles.authorInfo} onPress={goToProfile} activeOpacity={0.7}>
          {authorAvatar ? (
            <Image source={{ uri: authorAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
                <Ionicons name="person" size={16} color="#9CA3AF" />
            </View>
          )}
          <View>
             <Text style={styles.authorName}>@{authorName}</Text>
             <Text style={styles.dateText}>{date}</Text>
          </View>
        </TouchableOpacity>

        {/* Lógica de botões: Lixeira para dono, Três pontos para outros */}
        {isOwner ? (
          <TouchableOpacity onPress={onDelete} hitSlop={10}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleReport} hitSlop={10}>
            <Ionicons name="ellipsis-horizontal" size={22} color="white" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.mediaContainer}>
         {isVideo ? (
            <View style={styles.videoContainer}>
                <VideoView
                    player={player}
                    style={styles.image}
                    contentFit="cover"
                    nativeControls={false}
                />
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
            <Ionicons 
                name={post.isLikedByMe ? "heart" : "heart-outline"} 
                size={26} 
                color={post.isLikedByMe ? "#EF4444" : "white"} 
            />
            <Text style={styles.actionText}>{post.likesCount}</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <Ionicons name="chatbubble-outline" size={24} color="white" />
            <Text style={styles.actionText}>{post.commentsCount}</Text>
         </TouchableOpacity>
      </View>

      {post.content && (
        <View style={styles.contentContainer}>
            <Text style={styles.content} numberOfLines={3}>
               <Text style={{fontWeight: 'bold'}} onPress={goToProfile}>{authorName} </Text>
               {post.content}
            </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20, backgroundColor: '#1F2937', paddingBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 },
  authorInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10, backgroundColor: '#374151' },
  placeholderAvatar: { justifyContent: 'center', alignItems: 'center' },
  authorName: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  dateText: { color: '#9CA3AF', fontSize: 12 },
  mediaContainer: { width: '100%', height: width, backgroundColor: 'black' }, 
  image: { width: '100%', height: '100%' },
  videoContainer: { width: '100%', height: '100%' },
  playIconOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  actionsRow: { flexDirection: 'row', padding: 10, gap: 20 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  contentContainer: { paddingHorizontal: 10 },
  content: { color: '#D1D5DB', fontSize: 14, lineHeight: 20 }
});