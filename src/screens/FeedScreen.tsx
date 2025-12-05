import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Share // Importante para compartilhar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { Heart, MessageCircle, Share2, MoreVertical, Trash2 } from 'lucide-react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native'; // Necessário para navegar

// Importações do seu projeto
import { storage } from '../lib/storage';
import { ENV } from '../config/env';
import { useAuth } from '../contexts/AuthContext';

const { width, height } = Dimensions.get('window');

// Fallback seguro para a API
const API_BASE = ENV?.API_URL || 'https://cosmosmatch-backend.onrender.com/api';

// --- TIPAGEM ---
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

export const FeedScreen = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth(); 
  const navigation = useNavigation<any>(); // Hook para navegação
  
  const [decks, setDecks] = useState<FeedDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // --- BUSCAR FEED ---
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

  // --- LIMPEZA AUTOMÁTICA AO TROCAR DE CONTA ---
  useEffect(() => {
    setDecks([]); 
    setPage(1);   
    setHasMore(true);
    setLoading(true);
    fetchFeed(1, true); 
  }, [user?.id, fetchFeed]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setPage(1);
    setHasMore(true);
    fetchFeed(1, true);
  }, [fetchFeed]);

  const handleLoadMore = () => {
    if (hasMore && !loading && !refreshing) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchFeed(nextPage);
    }
  };

  // --- PONTO 2: IR PARA A BIO (PERFIL PÚBLICO) ---
  const handleGoToProfile = (userId: string) => {
    // "PublicProfile" é o nome exato que está no seu App.tsx
    navigation.navigate('PublicProfile', { userId });
  };

  // --- PONTO 1: COMPARTILHAR (LINK .APP) ---
  const handleShare = async (post: FeedPost, authorName: string) => {
    try {
      const mediaUrl = post.imageUrl;
      const appLink = 'https://cosmosmatch.app'; // Link corrigido

      const message = post.content 
        ? `"${post.content}"\n\n- ${authorName} no CosmosMatch ✨\n\nVer mídia: ${mediaUrl}\n\nBaixe o App: ${appLink}`
        : `Veja o post de ${authorName} no CosmosMatch! ✨\n\nVer mídia: ${mediaUrl}\n\nBaixe o App: ${appLink}`;

      await Share.share({
        message: message,
        url: mediaUrl, 
        title: 'CosmosMatch'
      });
    } catch (error) {
      console.error('Erro ao compartilhar', error);
    }
  };

  // --- APAGAR POST ---
  const handleDeletePost = async (postId: string, authorId: string) => {
    Alert.alert(
      "Apagar Post",
      "Tem certeza?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Apagar", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await storage.getToken();
              const response = await fetch(`${API_BASE}/post/${postId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
              });

              if (response.ok) {
                setDecks(prevDecks => {
                   return prevDecks.map(deck => {
                     if (deck.author.id !== authorId) return deck;
                     const updatedPosts = deck.posts.filter(p => p.id !== postId);
                     return { ...deck, posts: updatedPosts };
                   }).filter(deck => deck.posts.length > 0);
                });
                Alert.alert("Sucesso", "Post apagado.");
              } else {
                Alert.alert("Erro", "Não foi possível apagar.");
              }
            } catch (error) {
              Alert.alert("Erro", "Falha na conexão.");
            }
          }
        }
      ]
    );
  };

  // --- COMPONENTE POST ITEM ---
  const PostItem = ({ item: post, index, deck }: { item: FeedPost, index: number, deck: FeedDeck }) => {
    const videoRef = useRef<Video>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const isOwner = user?.id === deck.author.id;

    useFocusEffect(
      useCallback(() => {
        setIsPlaying(true);
        return () => setIsPlaying(false);
      }, [])
    );

    const togglePlay = () => {
      if (post.mediaType === 'VIDEO') setIsPlaying(!isPlaying);
    };

    return (
      <View style={{ width, height: height, backgroundColor: '#000' }}>
        <TouchableOpacity activeOpacity={0.9} onPress={togglePlay} style={styles.mediaContainer}>
          {post.mediaType === 'VIDEO' ? (
            <Video
              ref={videoRef}
              style={styles.fullScreenMedia}
              source={{ uri: post.imageUrl }}
              useNativeControls={false}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay={isPlaying}
            />
          ) : (
            <Image source={{ uri: post.imageUrl }} style={styles.fullScreenMedia} resizeMode="cover" />
          )}
        </TouchableOpacity>

        {/* --- HEADER CLICÁVEL (Nome e Avatar) --- */}
        <View style={[styles.headerOverlay, { top: insets.top + 10 }]}>
          <TouchableOpacity 
            style={styles.authorRow} 
            onPress={() => handleGoToProfile(deck.author.id)} // Redireciona para Bio
            activeOpacity={0.7}
          >
            <Image source={{ uri: deck.author.profile?.imageUrl || 'https://via.placeholder.com/50' }} style={styles.avatar} />
            <Text style={styles.authorName}>{deck.author.name}</Text>
          </TouchableOpacity>
          
          {isOwner ? (
             <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeletePost(post.id, deck.author.id)}>
               <Trash2 size={24} color="#EF4444" />
             </TouchableOpacity>
          ) : (
             <TouchableOpacity style={styles.moreButton}>
               <MoreVertical size={24} color="#FFF" />
             </TouchableOpacity>
          )}
        </View>

        <View style={[styles.actionsContainer, { bottom: insets.bottom + 100 }]}>
          <TouchableOpacity style={styles.actionButton}>
            <Heart size={32} color={post.isLikedByMe ? "#EF4444" : "#FFF"} fill={post.isLikedByMe ? "#EF4444" : "transparent"} />
            <Text style={styles.actionText}>{post.likesCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle size={32} color="#FFF" />
            <Text style={styles.actionText}>{post.commentsCount}</Text>
          </TouchableOpacity>
          
          {/* Botão de Compartilhar */}
          <TouchableOpacity style={styles.actionButton} onPress={() => handleShare(post, deck.author.name)}>
            <Share2 size={30} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={[styles.bottomOverlay, { bottom: insets.bottom + 20 }]}>
           {post.content && <Text style={styles.postContent} numberOfLines={3}>{post.content}</Text>}
        </View>

        {deck.posts.length > 1 && (
          <View style={[styles.progressBarContainer, { top: insets.top + 60 }]}>
             {deck.posts.map((_, i) => (
               <View key={i} style={[styles.progressBar, { backgroundColor: i === index ? '#FFF' : 'rgba(255,255,255,0.3)' }]} />
             ))}
          </View>
        )}
      </View>
    );
  };

  const renderDeckItem = ({ item: deck }: { item: FeedDeck }) => {
    return (
      <FlatList
        data={deck.posts}
        renderItem={(props) => <PostItem {...props} deck={deck} />}
        keyExtractor={(post) => post.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      />
    );
  };

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
        renderItem={renderDeckItem}
        keyExtractor={(deck) => deck.author.id}
        pagingEnabled
        vertical
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#A78BFA"
            colors={["#A78BFA"]}
          />
        }
        ListEmptyComponent={
          !loading && (
            <View style={styles.centerEmpty}>
              <Text style={{color: '#FFF'}}>Nenhum post encontrado.</Text>
            </View>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  centerEmpty: { flex: 1, height: height, justifyContent: 'center', alignItems: 'center' },
  mediaContainer: { width: width, height: height },
  fullScreenMedia: { width: '100%', height: '100%', position: 'absolute' },
  
  headerOverlay: { position: 'absolute', left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 },
  authorRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20 },
  avatar: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#A78BFA', marginRight: 10 },
  authorName: { color: '#FFF', fontWeight: '700', fontSize: 15, textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 },
  
  moreButton: { padding: 8 },
  deleteButton: { padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 },

  bottomOverlay: { position: 'absolute', left: 15, right: 80, zIndex: 10 },
  postContent: { color: '#FFF', fontSize: 15, lineHeight: 22, fontWeight: '500', textShadowColor: 'rgba(0, 0, 0, 0.9)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 10 },

  actionsContainer: { position: 'absolute', right: 8, zIndex: 20, alignItems: 'center' },
  actionButton: { marginBottom: 20, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', padding: 8, borderRadius: 25 },
  actionText: { color: '#FFF', marginTop: 4, fontSize: 13, fontWeight: '600', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: -1, height: 1 }, textShadowRadius: 5 },

  progressBarContainer: { position: 'absolute', left: 10, right: 10, flexDirection: 'row', height: 3, gap: 4 },
  progressBar: { flex: 1, height: '100%', borderRadius: 2 },
});