// src/features/feed/components/FeedUserDeck.tsx

import React, { useState, useRef, useEffect } from 'react';
import { 
  View, FlatList, Dimensions, ViewToken, StyleSheet, Animated, Platform, TouchableOpacity, Image, Text 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FeedDeck, MediaType } from '@/types/feed.types';
import { FeedPostCard } from './FeedPostCard';
import { useAuth } from '@/contexts/AuthContext';

// --- IMPORTAMOS OS NOVOS HOOKS DE "FIXAÇÃO" AQUI ---
import { useFollowAuthorInFeed, useUnfollowAuthorInFeed } from '../hooks/useFeed';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FeedUserDeckProps {
  deck: FeedDeck;
  isActiveDeck: boolean;
  onDeckFinished: () => void;
  onSharePost: (postId: string, url: string, author: string) => void;
  onOptionsPost: (postId: string, isOwner: boolean) => void;
  onOpenComments: (postId: string, authorId: string) => void;
  onDeletePost: (postId: string) => void;
  // O onFollowAuthor antigo vindo do pai será ignorado em favor dos hooks locais mais inteligentes
  onFollowAuthor?: (authorId: string) => void; 
}

export const FeedUserDeck: React.FC<FeedUserDeckProps> = ({ 
  deck, 
  isActiveDeck,
  onDeckFinished,
  onSharePost,
  onOptionsPost,
  onOpenComments,
  onDeletePost,
}) => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  // --- NOVOS HOOKS QUE "FIXAM" O BOTÃO ---
  const { mutate: followAuthor } = useFollowAuthorInFeed();
  const { mutate: unfollowAuthor } = useUnfollowAuthorInFeed();

  if (!deck || !deck.posts || !Array.isArray(deck.posts) || deck.posts.length === 0) {
    return null;
  }

  const [activePostIndex, setActivePostIndex] = useState(0);
  const horizontalListRef = useRef<FlatList>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const isOwner = user?.id === deck.author.id;

  // Lê o status. Se o Backend não mandou nada, usamos false. 
  // Mas como o hook atualiza o cache localmente, isso vai virar TRUE assim que você clicar.
  const isFollowed = deck.author.isFollowedByMe ?? (deck.author as any).isFollowing ?? false;

  // --- FUNÇÃO INTELIGENTE DE SEGUIR ---
  const handleToggleFollow = () => {
    const authorId = deck.author.id;
    if (isFollowed) {
        // Se já sigo, paro de seguir (muda visualmente na hora)
        unfollowAuthor(authorId);
    } else {
        // Se não sigo, começo a seguir (muda visualmente na hora)
        followAuthor(authorId);
    }
  };

  const handleProfilePress = () => {
    if (isOwner) {
      navigation.navigate('MainTabs', { screen: 'Profile' });
    } else {
      navigation.navigate('PublicProfile', { userId: deck.author.id });
    }
  };

  useEffect(() => {
    if (isActiveDeck) {
      const currentPost = deck.posts[activePostIndex];
      const isHidden = currentPost.isHidden;

      if (isHidden) {
        progressAnim.setValue(0);
        return;
      }

      progressAnim.setValue(0);
      const duration = currentPost.mediaType === MediaType.VIDEO && currentPost.videoDuration 
        ? currentPost.videoDuration * 1000 
        : 5000;

      Animated.timing(progressAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) {
          handleNextPost();
        }
      });
    } else {
      progressAnim.stopAnimation();
      progressAnim.setValue(0);
    }
  }, [isActiveDeck, activePostIndex, deck.posts]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActivePostIndex(viewableItems[0].index);
    }
  }).current;

  const handleNextPost = () => {
    if (activePostIndex < deck.posts.length - 1) {
       horizontalListRef.current?.scrollToIndex({
         index: activePostIndex + 1,
         animated: true
       });
    } else {
       onDeckFinished();
    }
  };

  return (
    <View style={styles.container}>
      
      {/* 1. BARRA DE PROGRESSO FIXA */}
      <View style={styles.progressContainer}>
        {deck.posts.map((_, idx) => (
          <View key={idx} style={styles.progressBarBg}>
            {idx < activePostIndex ? (
              <View style={[styles.progressBarFill, { width: '100%' }]} />
            ) : idx === activePostIndex ? (
              <Animated.View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%']
                    }) 
                  }
                ]} 
              />
            ) : null}
          </View>
        ))}
      </View>

      {/* 2. HEADER FIXO */}
      <TouchableOpacity style={styles.topHeaderProfile} onPress={handleProfilePress} activeOpacity={0.8}>
          <Image 
            source={{ uri: deck.author.profile?.imageUrl || 'https://via.placeholder.com/50' }} 
            style={styles.headerAvatar} 
          />
          <Text style={styles.headerUsername}>{deck.author.name}</Text>
      </TouchableOpacity>

      {/* 3. LISTA DE POSTS */}
      <FlatList
        ref={horizontalListRef}
        data={deck.posts}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <FeedPostCard 
            post={item} 
            author={deck.author} 
            isActive={isActiveDeck && index === activePostIndex}
            isFollowedByMe={isFollowed} // Passa o status controlado pelo hook
            onFollow={handleToggleFollow} // Passa a nossa nova função
            onShare={() => onSharePost(item.id, item.imageUrl, deck.author.name)}
            onOptions={() => onOptionsPost(item.id, isOwner)} 
            onOpenComments={() => onOpenComments(item.id, deck.author.id)}
            onDelete={() => onDeletePost(item.id)}
          />
        )}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        removeClippedSubviews={true}
        onEndReached={onDeckFinished}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: 'black' },
  progressContainer: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 20, left: 10, right: 10, flexDirection: 'row', height: 3, gap: 4, zIndex: 110, elevation: 10 },
  progressBarBg: { flex: 1, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: 'white' },
  topHeaderProfile: { position: 'absolute', top: Platform.OS === 'ios' ? 65 : 35, left: 16, flexDirection: 'row', alignItems: 'center', zIndex: 120, elevation: 10 },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: 'white', marginRight: 10 },
  headerUsername: { color: 'white', fontSize: 16, fontWeight: 'bold', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 3 },
});