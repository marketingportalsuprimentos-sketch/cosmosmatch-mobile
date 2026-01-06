import React, { useRef, useState, useMemo, useCallback } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, StatusBar, Dimensions, Platform } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useGetFeed } from '../features/feed/hooks/useFeed';
import { FeedUserDeck } from '../features/feed/components/FeedUserDeck';

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');

export function PostsScreen() {
  const [currentDeckIndex, setCurrentDeckIndex] = useState(0);
  const { data, isLoading, fetchNextPage, hasNextPage } = useGetFeed();
  const flatListRef = useRef<FlatList>(null);
  
  let tabBarHeight = 0;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch (e) {
    tabBarHeight = Platform.OS === 'ios' ? 85 : 65; 
  }

  const ITEM_HEIGHT = WINDOW_HEIGHT - tabBarHeight;

  // CORREÇÃO: Garante que decks com posts "ocultos" (isHidden) continuem na lista
  const decks = useMemo(() => {
    // Removemos filtros agressivos. Se o servidor enviou a página, nós mostramos
    if (!data?.pages) return [];
    
    // Flatten as páginas do infinite query
    return data.pages.filter(deck => deck !== undefined && deck !== null);
  }, [data]);

  const scrollToNextUser = useCallback(() => {
    if (currentDeckIndex < decks.length - 1) {
      const nextIndex = currentDeckIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentDeckIndex(nextIndex);
    }
  }, [currentDeckIndex, decks.length]);

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems?.length > 0) {
      setCurrentDeckIndex(viewableItems[0].index || 0);
    }
  }).current;

  if (isLoading && !data) return <View style={styles.center}><ActivityIndicator size="large" color="#8B5CF6" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <FlatList
        ref={flatListRef}
        data={decks}
        // Usamos author.id ou um fallback para evitar que a lista quebre se o author demorar a carregar
        keyExtractor={(item, index) => item.author?.id || index.toString()}
        renderItem={({ item, index }) => (
          <View style={{ height: ITEM_HEIGHT, width: WINDOW_WIDTH }}>
            {/* Verificação de segurança: Só renderiza o Deck se houver posts */}
            {item.posts && item.posts.length > 0 ? (
              <FeedUserDeck 
                userPosts={item.posts.map((p: any) => ({ ...p, author: item.author }))} 
                isActiveDeck={index === currentDeckIndex} 
                onDeckComplete={scrollToNextUser} 
              />
            ) : (
              // Se o autor não tiver posts visíveis (ou todos expirados), mostra um loader ou pula
              <View style={styles.center}><ActivityIndicator color="#8B5CF6" /></View>
            )}
          </View>
        )}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        getItemLayout={(_, index) => ({
          length: ITEM_HEIGHT,
          offset: ITEM_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'black' }
});