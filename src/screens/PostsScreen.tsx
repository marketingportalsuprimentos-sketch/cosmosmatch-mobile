// src/screens/PostsScreen.tsx

import React, { useRef, useState, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, StatusBar, Platform, Share, Alert, Dimensions 
} from 'react-native';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

// Hooks
import { useGetFeed, useLikePost, useUnlikePost, useDeletePost } from '@/features/feed/hooks/useFeed';
import { useFollowUser } from '@/features/profile/hooks/useProfile'; // Hook de seguir
import { useAuth } from '@/contexts/AuthContext';

// Componentes
import { FeedUserDeck } from '@/features/feed/components/FeedUserDeck';
import { FeedCommentSheet } from '@/features/feed/components/FeedCommentSheet';
import { PersonalDayCard } from '@/features/feed/components/PersonalDayCard';
import { ReportPostModal } from '@/features/feed/components/ReportPostModal';

// Tipos
import { FeedDeck } from '@/types/feed.types';

const { height: WINDOW_HEIGHT, width: WINDOW_WIDTH } = Dimensions.get('window');

export function PostsScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets(); 
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const ITEM_HEIGHT = WINDOW_HEIGHT;

  const { data, isLoading, isError, fetchNextPage, hasNextPage, refetch } = useGetFeed();
  const { mutate: like } = useLikePost();
  const { mutate: unlike } = useUnlikePost();
  const { mutate: remove } = useDeletePost();
  const { mutate: follow } = useFollowUser(); // <--- REATIVADO: Hook de seguir

  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
  
  const [commentSheet, setCommentSheet] = useState<{ isOpen: boolean; postId: string; authorId: string }>({
    isOpen: false, postId: '', authorId: ''
  });

  const [reportModal, setReportModal] = useState<{ isOpen: boolean; postId: string | null }>({
    isOpen: false, postId: null
  });

  const verticalListRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => { }, [])
  );

  const decks = data?.pages?.filter((page): page is FeedDeck => 
    !!page && !!page.author && Array.isArray(page.posts) && page.posts.length > 0
  ) || [];

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentDeckIndex(viewableItems[0].index);
    }
  }).current;

  // --- ACTIONS ---

  const handleDeckFinished = () => {
    if (!commentSheet.isOpen && !reportModal.isOpen && isFocused) {
        if (decks && currentDeckIndex < decks.length - 1) {
          const nextIndex = currentDeckIndex + 1;
          verticalListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
          setCurrentDeckIndex(nextIndex);
        } else if (hasNextPage) {
          fetchNextPage(); 
        }
    }
  };

  const handleNavigateToProfile = (userId: string) => {
    if (!userId) return;
    navigation.navigate('PublicProfile', { userId }); 
  };
  
  // <--- NOVA FUNÇÃO: Handler para seguir/deixar de seguir
  const handleFollow = (userId: string) => { 
    follow(userId); 
  };
  
  const handleLike = (postId: string, isLiked: boolean) => { 
      if (isLiked) unlike(postId); else like(postId); 
  };

  const handleShare = async (postId: string, imageUrl: string, authorName: string) => {
    try {
      const message = `Veja o post de ${authorName} no CosmosMatch! ✨\n${imageUrl}`;
      await Share.share({ message, url: imageUrl, title: 'CosmosMatch' });
    } catch (error) { }
  };

  const handleDeletePost = (postId: string) => {
      Alert.alert(
          t('delete_post_title') || 'Excluir Post?',
          t('delete_post_confirm') || 'Tem certeza que deseja apagar?',
          [
              { text: t('cancel') || 'Cancelar', style: "cancel" },
              { 
                  text: t('delete_post') || 'Excluir', 
                  style: "destructive", 
                  onPress: () => remove(postId) 
              }
          ]
      );
  };

  const handleOptionsPost = (postId: string, authorId: string) => {
    // Abre direto o modal de denúncia para não donos
    setReportModal({ isOpen: true, postId: postId });
  };

  if (isLoading && !data) {
      return (
        <View style={styles.center}>
            <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      );
  }

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <View pointerEvents="box-none" style={[styles.widgetOverlay, { top: Platform.OS === 'android' ? 40 : insets.top + 10 }]}>
         <PersonalDayCard />
      </View>
      
      <FlatList
          ref={verticalListRef}
          data={decks}
          keyExtractor={(item, index) => item.author?.id ? `${item.author.id}-${index}` : `deck-${index}`}
          renderItem={({ item, index }) => (
            <View style={{ height: ITEM_HEIGHT, width: WINDOW_WIDTH }}>
                <FeedUserDeck 
                    deck={item}
                    isActiveDeck={index === currentDeckIndex && isFocused}
                    onDeckFinished={handleDeckFinished}
                    onSharePost={handleShare}
                    onOpenComments={(pid, aid) => setCommentSheet({ isOpen: true, postId: pid, authorId: aid })}
                    onOptionsPost={(pid) => handleOptionsPost(pid, item.author.id)}
                    onDeletePost={handleDeletePost}
                    onFollowAuthor={handleFollow} // <--- ADICIONADO: Passando a função para o componente
                />
            </View>
          )}
          pagingEnabled
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
          onEndReachedThreshold={1}
          getItemLayout={(data, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
          ListEmptyComponent={
            <View style={[styles.emptyStateContainer, { height: ITEM_HEIGHT }]}>
                <Text style={styles.emptyStateText}>
                   {isError ? "Erro ao carregar feed." : t('no_posts_found') || "Nenhum post encontrado."}
                </Text>
            </View>
          }
      />

      {/* Modal de Comentários */}
      {commentSheet.isOpen && (
        <FeedCommentSheet 
           isVisible={commentSheet.isOpen}
           onClose={() => setCommentSheet({ ...commentSheet, isOpen: false })}
           postId={commentSheet.postId}
           authorId={commentSheet.authorId}
        />
      )}

      {/* Modal de Denúncia */}
      <ReportPostModal 
        isOpen={reportModal.isOpen}
        postId={reportModal.postId}
        onClose={() => setReportModal({ isOpen: false, postId: null })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' },
  widgetOverlay: { position: 'absolute', left: 0, right: 0, zIndex: 999, paddingHorizontal: 10 },
  emptyStateContainer: { justifyContent: 'center', alignItems: 'center', width: WINDOW_WIDTH },
  emptyStateText: { color: '#93C5FD', fontSize: 20 }
});