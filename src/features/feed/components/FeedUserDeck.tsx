import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, Text, Image, StyleSheet, Dimensions, FlatList, Animated, Easing, TouchableOpacity, Platform, Alert, ActivityIndicator 
} from 'react-native';
import { BlurView } from 'expo-blur'; 
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useNavigation } from '@react-navigation/native';

// Hooks e Contextos
import { useAuth } from '../../../contexts/AuthContext'; 
import { useLikePost, useUnlikePost, useDeletePost } from '../hooks/useFeed';
import { useGetFollowing, useFollowUser } from '../../profile/hooks/useProfile'; 
import { FeedCommentSheet } from './FeedCommentSheet';
import { ReportPostModal } from './ReportPostModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export function FeedUserDeck({ userPosts = [], isActiveDeck, onDeckComplete }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isReportingOpen, setIsReportingOpen] = useState(false);
  
  const { user: loggedInUser } = useAuth();
  const navigation = useNavigation<any>();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const { mutate: likePost } = useLikePost();
  const { mutate: unlikePost } = useUnlikePost();
  const { mutate: deletePost } = useDeletePost();
  const { mutate: followUser } = useFollowUser();
  const { data: followingList } = useGetFollowing(loggedInUser?.id);

  // Extração segura do post
  const currentPost = useMemo(() => {
    if (!userPosts || userPosts.length === 0) return null;
    return userPosts[currentIndex] || userPosts[0];
  }, [userPosts, currentIndex]);

  const author = currentPost?.author;
  const isOwner = loggedInUser?.id === author?.id;

  const isAlreadyFollowing = useMemo(() => {
    if (!followingList || !author?.id) return false;
    return followingList.some((u: any) => u.id === author.id);
  }, [followingList, author?.id]);

  // LÓGICA DE MODERAÇÃO: Blur ativado por reports ou flag manual
  const shouldBlur = useMemo(() => {
    if (!currentPost) return false;
    const reportsCount = currentPost.reportsCount || 0;
    return reportsCount >= 3 || currentPost.isSensitive === true;
  }, [currentPost]);

  // Sincronização de índice
  useEffect(() => {
    if (userPosts.length > 0 && currentIndex >= userPosts.length) {
      setCurrentIndex(userPosts.length - 1);
    } else if (userPosts.length === 0 && isActiveDeck) {
      if (onDeckComplete) onDeckComplete();
    }
  }, [userPosts.length, currentIndex, isActiveDeck]);

  // Temporizador de Progresso
  useEffect(() => {
    if (isActiveDeck && currentPost && !isCommentsOpen && !isReportingOpen && !shouldBlur) {
      let duration = 5000;
      if (currentPost.mediaType === 'VIDEO' && currentPost.videoDuration) {
        duration = currentPost.videoDuration * 1000;
      }

      progressAnim.setValue(0);
      const animation = Animated.timing(progressAnim, {
        toValue: 1,
        duration: duration,
        easing: Easing.linear,
        useNativeDriver: false,
      });

      animation.start(({ finished }) => {
        if (finished) {
          if (currentIndex < userPosts.length - 1) {
            const next = currentIndex + 1;
            flatListRef.current?.scrollToIndex({ index: next, animated: true });
            setCurrentIndex(next);
          } else {
            if (onDeckComplete) onDeckComplete();
          }
        }
      });
      return () => animation.stop();
    }
  }, [currentIndex, isActiveDeck, currentPost, isCommentsOpen, isReportingOpen, shouldBlur]);

  if (!currentPost) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator color="#8B5CF6" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={userPosts}
        horizontal
        pagingEnabled
        scrollEnabled={true} 
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          if (index !== currentIndex) setCurrentIndex(index);
        }}
        renderItem={({ item, index }) => (
          <View style={styles.slideItem}>
            {item.mediaType === 'VIDEO' ? (
              <VideoItem 
                url={item.imageUrl} 
                active={isActiveDeck && index === currentIndex && !isCommentsOpen && !shouldBlur} 
              />
            ) : (
              <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            )}

            {/* CAMADA DE BLUR */}
            {shouldBlur && (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: '#000' }]}>
                <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
                <View style={styles.blurOverlay}>
                  <Ionicons name="eye-off" size={80} color="white" />
                  <Text style={styles.blurTitle}>Conteúdo Sensível</Text>
                  <Text style={styles.blurSubtitle}>
                    Este post está oculto por decisão da moderação da comunidade.
                  </Text>
                  
                  {loggedInUser?.role === 'ADMIN' && (
                    <TouchableOpacity 
                      style={styles.adminActionBtn} 
                      onPress={() => Alert.alert("Painel Admin", "Escolha uma ação:", [
                        { text: "Cancelar" },
                        { text: "Remover Post", style: 'destructive', onPress: () => deletePost(item.id) }
                      ])}
                    >
                      <Text style={styles.adminText}>Ações de Administrador</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}
          </View>
        )}
      />

      {/* Interface de Overlay Superior */}
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <LinearGradient colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.8)']} style={styles.overlay} pointerEvents="box-none">
          
          {/* Barra de Tempo (Sempre visível) */}
          <View style={styles.progressRow}>
            {userPosts.map((_: any, i: number) => (
              <View key={i} style={styles.track}>
                <Animated.View style={[styles.fill, { width: i < currentIndex ? '100%' : i === currentIndex ? progressAnim.interpolate({inputRange:[0,1], outputRange:['0%','100%']}) : '0%' }]} />
              </View>
            ))}
          </View>

          {/* Identidade do Usuário (Sempre visível) */}
          <View style={styles.headerRow}>
            <TouchableOpacity 
              style={styles.userInfo}
              onPress={() => navigation.navigate(isOwner ? 'ProfileTab' : 'PublicProfile', { userId: author?.id })}
            >
              <Image source={{ uri: author?.profile?.imageUrl || 'https://ui-avatars.com/api/?name=U' }} style={styles.avatar} />
              <Text style={styles.name}>@{author?.name}</Text>
            </TouchableOpacity>
          </View>

          {/* Botões Laterais - Ocultar Sociais e Opções se tiver Blur */}
          <View style={styles.sideButtons}>
            {/* Ocultar botão Seguir se houver Blur ou se já segue */}
            {!shouldBlur && !isOwner && !isAlreadyFollowing && (
              <TouchableOpacity style={[styles.actionBtn, styles.followBtn]} onPress={() => author?.id && followUser(author.id)}>
                <Ionicons name="add" size={24} color="white" />
              </TouchableOpacity>
            )}

            {/* Ocultar Coração e Comentários se houver Blur */}
            {!shouldBlur && (
              <>
                <TouchableOpacity style={styles.actionBtn} onPress={() => currentPost.isLikedByMe ? unlikePost(currentPost.id) : likePost(currentPost.id)}>
                  <Ionicons 
                    name={currentPost.isLikedByMe ? "heart" : "heart-outline"} 
                    size={38} 
                    color={currentPost.isLikedByMe ? "#EF4444" : "white"} 
                  />
                  <Text style={styles.actionText}>{currentPost.likesCount || 0}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => setIsCommentsOpen(true)}>
                  <Ionicons name="chatbubble-outline" size={32} color="white" />
                  <Text style={styles.actionText}>{currentPost.commentsCount || 0}</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Lógica de Opções Ajustada: Lixeira para dono, Três pontos apenas se não houver Blur */}
            {isOwner ? (
              <TouchableOpacity style={styles.actionBtn} onPress={() => deletePost(currentPost.id)}>
                <Ionicons name="trash-outline" size={30} color="#FF4444" />
              </TouchableOpacity>
            ) : (
              !shouldBlur && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => setIsReportingOpen(true)}>
                  <Ionicons name="ellipsis-horizontal" size={30} color="white" />
                </TouchableOpacity>
              )
            )}
          </View>

          {/* Legenda (Oculta se houver Blur para limpar a interface) */}
          {!shouldBlur && (
            <View style={styles.footer} pointerEvents="none">
              <Text style={styles.caption}>{currentPost.content}</Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {isCommentsOpen && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setIsCommentsOpen(false)} />
          <FeedCommentSheet postId={currentPost.id} authorId={author?.id} onClose={() => setIsCommentsOpen(false)} />
        </View>
      )}

      <ReportPostModal isOpen={isReportingOpen} onClose={() => setIsReportingOpen(false)} postId={currentPost.id} />
    </View>
  );
}

function VideoItem({ url, active }: any) {
  const player = useVideoPlayer(url, p => { p.loop = true; });
  useEffect(() => { active ? player.play() : player.pause(); }, [active]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  loaderContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  slideItem: { width: SCREEN_WIDTH, height: '100%', backgroundColor: '#000' },
  overlay: { flex: 1, padding: 15 },
  progressRow: { flexDirection: 'row', gap: 4, marginTop: Platform.OS === 'ios' ? 50 : 35 },
  track: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: 'white' },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 1.5, borderColor: 'white' },
  name: { color: 'white', fontWeight: 'bold', fontSize: 16, textShadowColor: 'black', textShadowRadius: 2 },
  sideButtons: { position: 'absolute', right: 12, bottom: 120, alignItems: 'center', gap: 18 },
  actionBtn: { alignItems: 'center', justifyContent: 'center' },
  followBtn: { backgroundColor: '#8B5CF6', width: 34, height: 34, borderRadius: 17, marginBottom: 5, borderWidth: 2, borderColor: 'black' },
  actionText: { color: 'white', fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  footer: { position: 'absolute', bottom: 40, left: 15, right: 90 },
  caption: { color: 'white', fontSize: 15, textShadowColor: 'black', textShadowRadius: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  blurOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', padding: 30, zIndex: 10 },
  blurTitle: { color: 'white', fontSize: 26, fontWeight: 'bold', marginTop: 20 },
  blurSubtitle: { color: '#ccc', textAlign: 'center', marginTop: 15, fontSize: 16, lineHeight: 24 },
  adminActionBtn: { marginTop: 40, backgroundColor: '#EF4444', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 30 },
  adminText: { color: 'white', fontWeight: 'bold' }
});