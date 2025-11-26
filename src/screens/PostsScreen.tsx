import React, { useRef, useState, useCallback } from 'react';
import { 
  View, Text, FlatList, StyleSheet, ActivityIndicator, Dimensions, StatusBar, Platform, Share, Alert 
} from 'react-native';
import { useNavigation, useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { useTranslation } from 'react-i18next'; // <--- I18N

import { useGetFeed, useLikePost, useUnlikePost, useDeletePost } from '../features/feed/hooks/useFeed';
import { useFollowUser } from '../features/profile/hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';

import { FeedUserDeck } from '../features/feed/components/FeedUserDeck';
import { FeedCommentSheet } from '../features/feed/components/FeedCommentSheet';
import { PersonalDayCard } from '../features/feed/components/PersonalDayCard';

const { height: WINDOW_HEIGHT } = Dimensions.get('window');
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 50; 
const VIEW_HEIGHT = WINDOW_HEIGHT - TAB_BAR_HEIGHT;

export function PostsScreen() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const { user } = useAuth();
  const insets = useSafeAreaInsets(); 
  const { t } = useTranslation(); // <--- HOOK
  
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

  const handleNavigateToProfile = (userId: string) => { navigation.navigate('PublicProfile', { userId }); };
  const handleFollow = (userId: string) => { follow(userId); };
  const handleLike = (postId: string, isLiked: boolean) => { if (isLiked) unlike(postId); else like(postId); };

  const handleDeletePost = (postId: string) => {
      Alert.alert(
          t('delete_post_title'), // Traduzido
          t('delete_post_confirm'), // Traduzido
          [{ text: t('cancel'), style: "cancel" }, { text: t('delete'), style: "destructive", onPress: () => remove(postId) }]
      );
  };

  const handleOpenComments = (postId: string, authorId: string) => {
    setCommentSheet({ isOpen: true, postId, authorId });
  };

  const handleShare = async (postId: string) => {
    try {
      const url = `https://cosmosmatch.com/post/${postId}`;
      await Share.share({ message: `${t('share_message_default')} 🌌\n${url}`, url: url, title: 'CosmosMatch' });
    } catch (error) { }
  };

  if (isLoading && !data) return <View style={styles.center}><ActivityIndicator size="large" color="#8B5CF6" /></View>;
  if (isError) return <View style={styles.center}><Text style={{color:'white'}}>{t('error_loading_feed')}</Text></View>;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <View style={[
          styles.widgetOverlay, 
          { top: Platform.OS === 'android' ? 40 : insets.top + 10 } 
      ]}>
         <PersonalDayCard />
      </View>
      
      <FlatList
        ref={verticalListRef}
        data={decks}
        keyExtractor={(item, index) => item.author?.id ? `${item.author.id}-${index}` : `deck-${index}`}
        renderItem={({ item, index }) => (
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
             <Text style={styles.emptyStateText}>{t('no_posts_found')}</Text>
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
  widgetOverlay: { position: 'absolute', left: 0, right: 0, zIndex: 999, paddingHorizontal: 10 },
  emptyStateContainer: { height: VIEW_HEIGHT, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyStateText: { color: '#93C5FD', fontSize: 20, textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto' }
});