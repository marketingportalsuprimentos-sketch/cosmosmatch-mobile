import React, { useRef, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Dimensions, StatusBar, Platform, Share, Alert } from 'react-native';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Importante para posicionar a nuvem

import { useGetFeed, useLikePost, useUnlikePost, useDeletePost } from '../features/feed/hooks/useFeed';
import { useFollowUser } from '../features/profile/hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';

import { FeedUserDeck } from '../features/feed/components/FeedUserDeck';
import { FeedCommentSheet } from '../features/feed/components/FeedCommentSheet';
// O Widget de Vibração
import { PersonalDayCard } from '../features/feed/components/PersonalDayCard';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = 80; 
const VIEW_HEIGHT = SCREEN_HEIGHT - TAB_BAR_HEIGHT;

export function PostsScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const insets = useSafeAreaInsets(); // Para saber onde termina o notch/barra de status
  
  const { data, isLoading, isError, fetchNextPage, hasNextPage, refetch } = useGetFeed();
  const { mutate: like } = useLikePost();
  const { mutate: unlike } = useUnlikePost();
  const { mutate: follow } = useFollowUser();
  const { mutate: remove } = useDeletePost();

  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
  const [commentSheet, setCommentSheet] = useState<{ isOpen: boolean; postId: string; authorId: string }>({
    isOpen: false,
    postId: '',
    authorId: ''
  });

  const verticalListRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      refetch(); 
    }, [refetch])
  );

  const decks = data?.pages?.filter(page => 
    page !== null && Array.isArray(page.posts) && page.posts.length > 0
  ) || [];

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentDeckIndex(viewableItems[0].index || 0);
    }
  }).current;

  const handleDeckFinished = () => {
    if (!commentSheet.isOpen && isFocused) {
        if (decks && currentDeckIndex < decks.length - 1) {
          const nextIndex = currentDeckIndex + 1;
          verticalListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
          setCurrentDeckIndex(nextIndex);
        } else if (hasNextPage) {
          fetchNextPage(); 
        }
    }
  };

  const handleNavigateToProfile = (userId: string) => { navigation.navigate('PublicProfile', { userId }); };
  const handleFollow = (userId: string) => { follow(userId); };
  const handleLike = (postId: string, isLiked: boolean) => { if (isLiked) unlike(postId); else like(postId); };

  const handleDeletePost = (postId: string) => {
      Alert.alert(
          "Apagar Publicação",
          "Tem a certeza que deseja apagar este post?",
          [{ text: "Cancelar", style: "cancel" }, { text: "Apagar", style: "destructive", onPress: () => remove(postId) }]
      );
  };

  const handleOpenComments = (postId: string, authorId: string) => {
    setCommentSheet({ isOpen: true, postId, authorId });
  };

  const handleShare = async (postId: string) => {
    try {
      const url = `https://cosmosmatch.com/post/${postId}`;
      await Share.share({ message: `Veja este post cósmico! 🌌\n${url}`, url: url, title: 'CosmosMatch Post' });
    } catch (error) { console.log('Erro ao partilhar:', error); }
  };

  if (isLoading && !data) return <View style={styles.center}><ActivityIndicator size="large" color="#8B5CF6" /></View>;
  if (isError) return <View style={styles.center}><Text style={{color:'white'}}>Erro ao carregar feed.</Text></View>;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* --- CAMADA DE OVERLAY (WIDGET DE VIBRAÇÃO) --- */}
      {/* Posicionado absolutamente para flutuar sobre a lista */}
      <View style={[styles.widgetOverlay, { top: insets.top + 10 }]}>
         <PersonalDayCard />
      </View>
      {/* ---------------------------------------------- */}
      
      <FlatList
        ref={verticalListRef}
        data={decks}
        keyExtractor={(item, index) => item.author?.id ? `${item.author.id}-${index}` : `deck-${index}`}
        renderItem={({ item, index }) => (
           <FeedUserDeck 
              authorId={item.author?.id}
              authorName={item.author?.name || 'Desconhecido'}
              authorAvatar={item.author?.profile?.imageUrl || null}
              posts={item.posts || []} 
              
              isDeckActive={index === currentDeckIndex && isFocused}
              paused={commentSheet.isOpen} 
              
              onDeckFinished={handleDeckFinished}
              onLikePost={(postId) => {
                  const post = item.posts?.find(p => p.id === postId);
                  if (post) handleLike(postId, post.isLikedByMe);
              }}
              onOpenComments={handleOpenComments}
              onSharePost={handleShare}
              onNavigateToProfile={handleNavigateToProfile}
              onFollowAuthor={handleFollow}
              onDeletePost={handleDeletePost} 
           />
        )}
        pagingEnabled
        snapToInterval={VIEW_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
        onEndReachedThreshold={1}
        getItemLayout={(data, index) => ({ length: VIEW_HEIGHT, offset: VIEW_HEIGHT * index, index })}
        
        ListEmptyComponent={
          <View style={styles.emptyStateContainer}>
             <Text style={styles.emptyStateText}>Nenhuma publicação encontrada ainda.</Text>
          </View>
        }
      />

      {commentSheet.isOpen && (
        <FeedCommentSheet 
           isVisible={commentSheet.isOpen}
           onClose={() => setCommentSheet({ ...commentSheet, isOpen: false })}
           postId={commentSheet.postId}
           authorId={commentSheet.authorId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  
  // Estilo para fazer o widget flutuar
  widgetOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 999, // Garante que fique acima dos vídeos
    paddingHorizontal: 10,
  },

  emptyStateContainer: {
    height: VIEW_HEIGHT, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateText: {
    color: '#93C5FD', 
    fontSize: 20,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  }
});