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
  ViewToken,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons'; 
import { useNavigation, useIsFocused } from '@react-navigation/native';

import { storage } from '../lib/storage';
import { ENV } from '../config/env';
import { useAuth } from '../contexts/AuthContext';
import { FeedCommentSheet } from '../features/feed/components/FeedCommentSheet';

const { width, height } = Dimensions.get('window');
const API_BASE = ENV?.API_URL || 'https://cosmosmatch-backend.onrender.com/api';

// --- TYPES ---
type FeedPost = {
  id: string;
  imageUrl: string;
  content?: string;
  mediaType: 'PHOTO' | 'VIDEO';
  videoDuration?: number;
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
};

type FeedDeck = {
  author: {
    id: string;
    name: string;
    profile?: { imageUrl: string };
  };
  posts: FeedPost[];
};

// --- COMPONENTES MEMOIZADOS ---

// 1. Post Individual (Versão Anti-Tela Preta)
const PostItem = memo(({ 
  item: post, 
  deck, 
  isActive, 
  insets, 
  onGoToProfile, 
  onDelete, 
  onLike, 
  onComment,
  isOwner 
}: { 
  item: FeedPost, 
  deck: FeedDeck, 
  isActive: boolean, 
  insets: any,
  onGoToProfile: (id: string) => void,
  onDelete: (pid: string, uid: string) => void,
  onLike: (post: FeedPost) => void,
  onComment: (pid: string, aid: string) => void,
  isOwner: boolean
}) => {
  const isVideo = post.mediaType === 'VIDEO';

  return (
    // GARANTIA DE LAYOUT: flex: 1 aqui ajuda a preencher o DeckItem
    <View style={{ width: width, height: height, backgroundColor: '#000' }}>
      <View style={styles.mediaContainer}>
        
        {/* CAMADA 1: A FOTO (Backup visual para evitar fundo preto) */}
        <Image 
          source={{ uri: post.imageUrl }} 
          style={[styles.fullScreenMedia, { position: 'absolute', zIndex: 1 }]} 
          resizeMode="cover" 
        />

        {/* CAMADA 2: O VÍDEO (Só renderiza se for a vez dele) */}
        {isVideo && isActive && (
          <Video
            source={{ uri: post.imageUrl }}
            style={[styles.fullScreenMedia, { zIndex: 2 }]} 
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay={true}
            isMuted={false}
            useNativeControls={false}
          />
        )}
      </View>

      {/* Overlay do Topo (Autor) */}
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

      {/* Botões de Ação (Like/Comment) */}
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

      {/* Legenda do Post */}
      <View style={[styles.bottomOverlay, { bottom: insets.bottom + 20 }]}>
         {post.content && <Text style={styles.postContent} numberOfLines={3}>{post.content}</Text>}
      </View>
    </View>
  );
}, (prev, next) => {
  return prev.isActive === next.isActive && 
         prev.item.likesCount === next.item.likesCount && 
         prev.item.commentsCount === next.item.commentsCount;
});

// 2. Deck (Lista Horizontal de Vídeos do Usuário)
const DeckItem = memo(({ 
  item: deck, 
  isDeckActive, 
  insets, 
  user,
  handlers 
}: { 
  item: FeedDeck, 
  isDeckActive: boolean, 
  insets: any,
  user: any,
  handlers: any
}) => {
  const [activePostIndex, setActivePostIndex] = useState(0);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActivePostIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80 
  }).current;

  if (!deck.posts || deck.posts.length === 0) return null;

  return (
    <FlatList
      data={deck.posts}
      renderItem={({ item, index }) => (
        <PostItem 
          item={item} 
          deck={deck} 
          isActive={isDeckActive && index === activePostIndex} 
          insets={insets}
          isOwner={user?.id === deck.author.id}
          onGoToProfile={handlers.handleGoToProfile}
          onDelete={handlers.handleDeletePost}
          onLike={handlers.handleLikePlaceholder} 
          onComment={handlers.handleOpenComments}
        />
      )}
      keyExtractor={(post) => post.id}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      removeClippedSubviews={true} 
      initialNumToRender={1}
      maxToRenderPerBatch={1}
      windowSize={2}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      // CORREÇÃO: Garante que a lista ocupe o espaço no Android
      contentContainerStyle={{ flexGrow: 1 }}
    />
  );
}, (prev, next) => prev.isDeckActive === next.isDeckActive);

// --- TELA PRINCIPAL (Lista Vertical de Usuários) ---
export const FeedScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth(); 
  const navigation = useNavigation<any>(); 
  const isScreenFocused = useIsFocused();
  
  const [decks, setDecks] = useState<FeedDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [activeDeckIndex, setActiveDeckIndex] = useState(0);

  const [isCommentVisible, setIsCommentVisible] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedAuthorId, setSelectedAuthorId] = useState<string | null>(null);

  const fetchFeed = useCallback(async (pageNum: number, shouldRefresh = false) => {
    try {
      const token = await storage.getToken();
      if (!token) {
        setLoading(false);
        setRefreshing(false);
        return;
      }
      
      const response = await fetch(`${API_BASE}/post/feed?page=${pageNum}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Falha ao buscar feed');
      const data = await response.json();

      if (!data || !data.author) {
        setHasMore(false);
      } else {
        setDecks(prev => {
          if (shouldRefresh) return [data];
          // Evita duplicatas se a API mandar o mesmo deck
          const exists = prev.some(d => d.author.id === data.author.id);
          if (exists) return prev;
          return [...prev, data];
        });
      }
    } catch (error) {
      console.error('Erro ao buscar feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setDecks([]); setPage(1); setHasMore(true); setLoading(true);
    const timer = setTimeout(() => { fetchFeed(1, true); }, 100);
    return () => clearTimeout(timer);
  }, [user?.id, fetchFeed]);

  const onRefresh = useCallback(() => {
    setRefreshing(true); setPage(1); setHasMore(true); setDecks([]); fetchFeed(1, true);
  }, [fetchFeed]);

  const handleLoadMore = () => {
    if (hasMore && !loading && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage);
    }
  };

  const handlers = {
    handleGoToProfile: (userId: string) => { navigation.navigate('PublicProfile', { userId }); },
    handleOpenComments: (postId: string, authorId: string) => {
        setSelectedPostId(postId);
        setSelectedAuthorId(authorId);
        setIsCommentVisible(true);
    },
    handleDeletePost: (postId: string, authorId: string) => {
      Alert.alert("Apagar Post", "Tem certeza?", [
          { text: "Cancelar", style: "cancel" },
          { text: "Apagar", style: "destructive", onPress: async () => {
              try {
                const token = await storage.getToken();
                await fetch(`${API_BASE}/post/${postId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
                onRefresh(); 
              } catch (e) {}
            }
          }
      ]);
    },
    handleLikePlaceholder: (post: FeedPost) => {
        console.log("Like pressed on", post.id);
    }
  };

  const onViewableDecksChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveDeckIndex(viewableItems[0].index);
    }
  }, []);

  const viewabilityConfigVertical = useRef({
    itemVisiblePercentThreshold: 70
  }).current;

  // CORREÇÃO: Loading centralizado para evitar tela preta inicial
  if (loading && decks.length === 0) {
      return (
          <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#A78BFA" />
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <FlatList
        data={decks}
        renderItem={({ item, index }) => (
          <DeckItem 
            item={item} 
            isDeckActive={index === activeDeckIndex && isScreenFocused} 
            insets={insets} 
            user={user}
            handlers={handlers}
          />
        )}
        keyExtractor={(deck, index) => `${deck.author.id}-${index}`}
        pagingEnabled
        vertical
        showsVerticalScrollIndicator={false}
        getItemLayout={(data, index) => ({
          length: height,
          offset: height * index,
          index,
        })}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        onViewableItemsChanged={onViewableDecksChanged}
        viewabilityConfig={viewabilityConfigVertical}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A78BFA" />}
        
        // CORREÇÃO MASTER PARA ANDROID NOVO:
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