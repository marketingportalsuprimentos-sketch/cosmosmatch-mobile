import React, { useRef, useState, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, StatusBar, Platform, Share, Alert, Dimensions 
} from 'react-native';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { useTranslation } from 'react-i18next';

import { useGetFeed, useLikePost, useUnlikePost, useDeletePost } from '../features/feed/hooks/useFeed';
import { useFollowUser } from '../features/profile/hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';

import { FeedUserDeck } from '../features/feed/components/FeedUserDeck';
import { FeedCommentSheet } from '../features/feed/components/FeedCommentSheet';
import { PersonalDayCard } from '../features/feed/components/PersonalDayCard';

export function PostsScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets(); 
  const { t } = useTranslation();
  
  const [containerHeight, setContainerHeight] = useState(0);

  const { data, isLoading, isError, fetchNextPage, hasNextPage, refetch } = useGetFeed();
  const { mutate: like } = useLikePost();
  const { mutate: unlike } = useUnlikePost();
  const { mutate: follow } = useFollowUser();
  const { mutate: remove } = useDeletePost();

  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
  const [commentSheet, setCommentSheet] = useState<{ isOpen: boolean; postId: string; authorId: string }>({
    isOpen: false, postId: '', authorId: ''
  });

  const verticalListRef = useRef<FlatList>(null);

  // Modo Imersivo no Android
  useFocusEffect(
    React.useCallback(() => {
      const enableImmersiveMode = async () => {
        if (Platform.OS === 'android') {
          try {
            await NavigationBar.setVisibilityAsync('hidden');
            await NavigationBar.setBehaviorAsync('overlay-swipe');
            await NavigationBar.setBackgroundColorAsync('#00000000'); 
          } catch (e) {}
        }
      };
      enableImmersiveMode();
    }, [])
  );

  useFocusEffect(
    useCallback(() => { refetch(); }, [refetch])
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

  // --- NAVEGAÇÃO CORRIGIDA ---
  const handleNavigateToProfile = (userId: string) => {
    if (!userId) return;
    try {
        navigation.navigate('PublicProfile', { userId });
    } catch (error) {
        console.log("Erro ao navegar para perfil:", error);
    }
  };
  
  const handleFollow = (userId: string) => { follow(userId); };
  const handleLike = (postId: string, isLiked: boolean) => { if (isLiked) unlike(postId); else like(postId); };

  const handleDeletePost = (postId: string) => {
      Alert.alert(
          t('delete_post_title'),
          t('delete_post_confirm'),
          [{ text: t('cancel'), style: "cancel" }, { text: t('delete'), style: "destructive", onPress: () => remove(postId) }]
      );
  };

  const handleOpenComments = (postId: string, authorId: string) => {
    setCommentSheet({ isOpen: true, postId, authorId });
  };

  // --- SHARE CORRIGIDO ---
  const handleShare = async (postId: string, imageUrl: string, authorName: string) => {
    try {
      const appLink = "https://cosmosmatch.app";
      const message = `Veja o post de ${authorName} no CosmosMatch! ✨\n\nVer mídia: ${imageUrl}\n\nBaixe o App: ${appLink}`;
      
      await Share.share({ 
        message: message, 
        url: imageUrl, 
        title: 'CosmosMatch' 
      });
    } catch (error) { }
  };

  if (isLoading && !data) return <View style={styles.center}><ActivityIndicator size="large" color="#8B5CF6" /></View>;
  if (isError) return <View style={styles.center}><Text style={{color:'white'}}>{t('error_loading_feed')}</Text></View>;

  return (
    <View 
      style={styles.container}
      onLayout={(event) => {
        const { height } = event.nativeEvent.layout;
        if (Math.abs(containerHeight - height) > 1) {
            setContainerHeight(height);
        }
      }}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* CORREÇÃO: pointerEvents="box-none" permite clicar no perfil através da área transparente */}
      <View 
          pointerEvents="box-none"
          style={[
            styles.widgetOverlay, 
            { top: Platform.OS === 'android' ? 40 : insets.top + 10 } 
          ]}
      >
         <PersonalDayCard />
      </View>
      
      {containerHeight > 0 && (
        <FlatList
            ref={verticalListRef}
            data={decks}
            keyExtractor={(item, index) => item.author?.id ? `${item.author.id}-${index}` : `deck-${index}`}
            renderItem={({ item, index }) => (
            <View style={{ height: containerHeight, width: '100%' }}>
                <FeedUserDeck 
                    authorId={item.author?.id}
                    authorName={item.author?.name || t('unknown_user')}
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
                    customHeight={containerHeight}
                />
            </View>
            )}
            pagingEnabled
            snapToInterval={containerHeight}
            snapToAlignment="start"
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={handleViewableItemsChanged}
            viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
            onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
            onEndReachedThreshold={1}
            getItemLayout={(data, index) => ({ length: containerHeight, offset: containerHeight * index, index })}
            
            ListEmptyComponent={
            <View style={[styles.emptyStateContainer, { height: containerHeight }]}>
                <Text style={styles.emptyStateText}>{t('no_posts_found')}</Text>
            </View>
            }
        />
      )}

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
  widgetOverlay: { position: 'absolute', left: 0, right: 0, zIndex: 999, paddingHorizontal: 10 },
  emptyStateContainer: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyStateText: { color: '#93C5FD', fontSize: 20, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' }
});