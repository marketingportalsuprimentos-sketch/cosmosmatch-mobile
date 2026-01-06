import React, { useState, useCallback, useMemo, useRef } from 'react';
import { 
  View, FlatList, ActivityIndicator, StatusBar, Dimensions, Text, TouchableOpacity, StyleSheet, Platform 
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useGetFeed, useDeletePost } from '../hooks/useFeed';
import { FeedUserDeck } from '../components/FeedUserDeck';

// Usamos 'screen' para garantir que o item ocupe a altura física total do aparelho
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

export const FeedScreen = () => {
  const { data, fetchNextPage, hasNextPage, isLoading, isError, refetch } = useGetFeed();
  const { mutate: deletePost } = useDeletePost();
  const [activeDeckIndex, setActiveDeckIndex] = useState(0);

  // Cálculo da altura útil descontando a TabBar do seu App.tsx
  let tabBarHeight = 0;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch (e) {
    tabBarHeight = Platform.OS === 'ios' ? 90 : 70;
  }

  // Altura que o item deve ter para encaixar perfeitamente sem "mola"
  const ITEM_HEIGHT = SCREEN_HEIGHT - tabBarHeight;

  const decks = useMemo(() => {
    // Organiza as páginas conforme o log do seu servidor
    return data?.pages || [];
  }, [data]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveDeckIndex(viewableItems[0].index);
    }
  }, []);

  if (isLoading && !data) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#8B5CF6" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <FlatList
        data={decks}
        keyExtractor={(item, index) => item.author?.id ? `${item.author.id}-${index}` : `${index}`}
        renderItem={({ item, index }) => (
          // O segredo está aqui: a View TEM de ter a altura exata do snapToInterval
          <View style={{ height: ITEM_HEIGHT, width: SCREEN_WIDTH }}>
            <FeedUserDeck 
              userPosts={item.posts.map((p: any) => ({ ...p, author: item.author }))} 
              isActiveDeck={index === activeDeckIndex}
              onDeletePost={(postId: string) => deletePost(postId)}
            />
          </View>
        )}
        // CONFIGURAÇÕES DE TRAVAMENTO VERTICAL (TIKTOK)
        pagingEnabled={true}
        vertical={true}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true} // Força a parada no próximo item
        showsVerticalScrollIndicator={false}
        
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        
        // Melhora a performance do scroll no Android
        removeClippedSubviews={true}
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  centerContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
  errorText: { color: 'white', marginBottom: 20 },
  retryButton: { backgroundColor: '#8B5CF6', padding: 12, borderRadius: 8 },
  retryText: { color: 'white', fontWeight: 'bold' }
});