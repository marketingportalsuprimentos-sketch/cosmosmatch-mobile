// mobile/src/screens/FeedScreen.tsx

import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Alert,
  RefreshControl,
  ViewToken
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video'; 
import { Ionicons } from '@expo/vector-icons'; 
import { useNavigation, useIsFocused } from '@react-navigation/native';

import { storage } from '../lib/storage';
import { ENV } from '../config/env';
import { useAuth } from '../contexts/AuthContext';
import { FeedCommentSheet } from '../features/feed/components/FeedCommentSheet';

const { width, height } = Dimensions.get('window');
const API_BASE = ENV?.API_URL || 'https://cosmosmatch-backend.onrender.com/api';

// --- FUNÇÃO DE OTIMIZAÇÃO (Mantemos a V4 que é perfeita) ---
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

type FeedPost = {
  id: string;
  imageUrl: string;
  content?: string;
  mediaType: 'PHOTO' | 'VIDEO' | 'video' | 'photo'; // Aceita minúsculo agora
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
};

type FeedDeck = {
  author: { id: string; name: string; profile?: { imageUrl: string } };
  posts: FeedPost[];
};

// --- VIDEO COMPONENT ---
const VideoComponent = ({ uri, isActive }: { uri: string; isActive: boolean }) => {
  const optimizedUri = getOptimizedVideoUrl(uri);

  const player = useVideoPlayer(optimizedUri, (player) => {
    player.loop = true;
    player.muted = false;
    if (!isActive) player.pause();
  });

  useEffect(() => {
    if (isActive) player.play();
    else player.pause();
  }, [isActive, player]);

  return (
    <View style={styles.fullScreenMedia}>
      <VideoView
        player={player}
        style={styles.fullScreenMedia}
        contentFit="cover"
        nativeControls={false}
      />
      {/* DIAGNÓSTICO V26 - AGORA VAI APARECER! */}
      <View style={{ position: 'absolute', top: 120, alignSelf: 'center', backgroundColor: 'red', padding: 8, borderRadius: 8, zIndex: 9999 }}>
        <Text style={{ color: 'white', fontWeight: 'bold' }}>
          {optimizedUri.includes('vc_h264') ? '✅ V26 DETECTOU VÍDEO' : '❌ V26 ERRO URL'}
        </Text>
      </View>
    </View>
  );
};

const PostItem = memo(({ item: post, deck, isActive, onGoToProfile, onDelete, onLike, onComment, isOwner, insets }: any) => {
  
  // --- A CORREÇÃO MÁGICA ESTÁ AQUI ---
  // Verifica se é VIDEO (maiúsculo ou minúsculo) OU se a URL termina com video (.mov/.mp4)
  const isVideo = 
    post.mediaType === 'VIDEO' || 
    post.mediaType === 'video' || 
    (post.imageUrl && (post.imageUrl.includes('.mov') || post.imageUrl.includes('.mp4')));

  return (
    <View style={{ width: width, height: height, backgroundColor: '#000' }}>
      <View style={styles.mediaContainer}>
        {!isVideo ? (
          // SE FOR FOTO
          <Image source={{ uri: post.imageUrl }} style={[styles.fullScreenMedia, { position: 'absolute' }]} resizeMode="cover" />
        ) : (
          // SE FOR VÍDEO
          <View style={[styles.fullScreenMedia, { zIndex: 999 }]}>
             <VideoComponent uri={post.imageUrl} isActive={isActive} />
          </View>
        )}
      </View>

      <View style={[styles.headerOverlay, { top: insets.top + 10 }]}>
        <TouchableOpacity style={styles.authorRow} onPress={() => onGoToProfile(deck.author.id)}>
          <Image source={{ uri: deck.author.profile?.imageUrl || 'https://via.placeholder.com/50' }} style={styles.avatar} />
          <Text style={styles.authorName}>{deck.author.name}</Text>
        </TouchableOpacity>
        {isOwner && (
           <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(post.id, deck.author.id)}>
             <Ionicons name="trash-outline" size={24} color="#EF4444" />
           </TouchableOpacity>
        )}
      </View>

      <View style={[styles.actionsContainer, { bottom: insets.bottom + 100 }]}>
        <TouchableOpacity style={styles.actionButton} onPress={() => onLike(post)}>
          <Ionicons name={post.isLikedByMe ? "heart" : "heart-outline"} size={32} color={post.isLikedByMe ? "#EF4444" : "#FFF"} />
          <Text style={styles.actionText}>{post.likesCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => onComment(post.id, deck.author.id)}>
          <Ionicons name="chatbubble-outline" size={32} color="#FFF" />
          <Text style={styles.actionText}>{post.commentsCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}, (prev, next) => prev.isActive === next.isActive && prev.item.likesCount === next.item.likesCount && prev.item.commentsCount === next.item.commentsCount);

const DeckItem = memo(({ item: deck, isDeckActive, insets, user, handlers }: any) => {
  const [activePostIndex, setActivePostIndex] = useState(0);
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) setActivePostIndex(viewableItems[0].index);
  }, []);
  
  return (
    <FlatList
      data={deck.posts}
      renderItem={({ item, index }) => (
        <PostItem item={item} deck={deck} isActive={isDeckActive && index === activePostIndex} insets={insets} isOwner={user?.id === deck.author.id} {...handlers} />
      )}
      keyExtractor={(post) => post.id}
      horizontal pagingEnabled showsHorizontalScrollIndicator={false} removeClippedSubviews={false} 
      initialNumToRender={1} maxToRenderPerBatch={1} windowSize={2}
      onViewableItemsChanged={onViewableItemsChanged} viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
      contentContainerStyle={{ flexGrow: 1 }}
    />
  );
}, (prev, next) => prev.isDeckActive === next.isDeckActive);

export const FeedScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth(); 
  const navigation = useNavigation<any>(); 
  const isScreenFocused = useIsFocused();
  const [decks, setDecks] = useState<FeedDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeDeckIndex, setActiveDeckIndex] = useState(0);
  const [isCommentVisible, setIsCommentVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);

  const fetchFeed = useCallback(async (pageNum: number, shouldRefresh = false) => {
    try {
      const token = await storage.getToken();
      if (!token) { setLoading(false); return; }
      const response = await fetch(`${API_BASE}/post/feed?page=${pageNum}`, {
        method: 'GET', headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (data && data.author) {
        setDecks(prev => shouldRefresh ? [data] : (prev.some(d => d.author.id === data.author.id) ? prev : [...prev, data]));
      }
    } catch (error) { console.error(error); } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchFeed(1, true); }, [user?.id, fetchFeed]);
  const onRefresh = useCallback(() => { setRefreshing(true); setDecks([]); fetchFeed(1, true); }, [fetchFeed]);

  const handlers = {
    handleGoToProfile: (userId: string) => navigation.navigate('PublicProfile', { userId }),
    handleOpenComments: (postId: string, authorId: string) => { setSelectedPostId(postId); setSelectedAuthorId(authorId); setIsCommentVisible(true); },
    handleDeletePost: (postId: string, authorId: string) => { /* Lógica de delete simplificada */ },
    handleLikePlaceholder: () => {},
    onGoToProfile: (id: string) => navigation.navigate('PublicProfile', { userId: id }),
    onDelete: (pid: string, uid: string) => {}, 
    onLike: (post: any) => {},
    onComment: (pid: string, aid: string) => { setSelectedPostId(pid); setSelectedAuthorId(aid); setIsCommentVisible(true); }
  };

  const onViewableDecksChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) setActiveDeckIndex(viewableItems[0].index);
  }, []);

  if (loading && decks.length === 0) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#A78BFA" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <FlatList
        data={decks}
        renderItem={({ item, index }) => (
          <DeckItem item={item} isDeckActive={index === activeDeckIndex && isScreenFocused} insets={insets} user={user} handlers={handlers} />
        )}
        keyExtractor={(deck, index) => `${deck.author.id}-${index}`}
        pagingEnabled vertical showsVerticalScrollIndicator={false} removeClippedSubviews={false}
        onViewableItemsChanged={onViewableDecksChanged} viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A78BFA" />}
        contentContainerStyle={{ flexGrow: 1 }}
      />
      {selectedPostId && selectedAuthorId && (
          <FeedCommentSheet isVisible={isCommentVisible} onClose={() => setIsCommentVisible(false)} postId={selectedPostId} authorId={selectedAuthorId} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  mediaContainer: { width: width, height: height, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  fullScreenMedia: { width: '100%', height: '100%', position: 'absolute' },
  headerOverlay: { position: 'absolute', left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#A78BFA', marginRight: 10 },
  authorName: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  deleteButton: { padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },
  bottomOverlay: { position: 'absolute', left: 15, right: 80, zIndex: 10 },
  postContent: { color: '#FFF', fontSize: 15, lineHeight: 22, fontWeight: '500', textShadowColor: 'rgba(0, 0, 0, 0.9)', textShadowRadius: 10 },
  actionsContainer: { position: 'absolute', right: 8, zIndex: 20, alignItems: 'center' },
  actionButton: { marginBottom: 20, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 25 },
  actionText: { color: '#FFF', marginTop: 4, fontSize: 13, fontWeight: '600' },
});