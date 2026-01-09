// mobile/src/screens/FeedScreen.tsx

import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, FlatList, ActivityIndicator, StatusBar, Dimensions, StyleSheet, Platform 
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useGetFeed, useDeletePost } from '../hooks/useFeed';
import { FeedUserDeck } from '../components/FeedUserDeck';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

export const FeedScreen = () => {
  const { data, fetchNextPage, hasNextPage, isLoading, refetch } = useGetFeed();
  const { mutate: deletePost } = useDeletePost();
  const [activeDeckIndex, setActiveDeckIndex] = useState(0);

  let tabBarHeight = 0;
  try {
    tabBarHeight = useBottomTabBarHeight();
  } catch (e) {
    tabBarHeight = Platform.OS === 'ios' ? 90 : 70;
  }

  const ITEM_HEIGHT = SCREEN_HEIGHT - tabBarHeight;

  const decks = useMemo(() => {
    return data?.pages || [];
  }, [data]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveDeckIndex(viewableItems[0].index);
    }
  }, []);

  // FUNÇÃO DE DELEÇÃO COM REFETCH AUTOMÁTICO
  const handleDeletePost = (postId: string) => {
    deletePost(postId, {
      onSuccess: () => {
        // Força a atualização da lista para remover o autor se necessário
        refetch(); 
      }
    });
  };

  if (isLoading && !data) return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#8B5CF6" /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <FlatList
        data={decks}
        keyExtractor={(item, index) => item.author?.id ? `${item.author.id}-${index}` : `${index}`}
        renderItem={({ item, index }) => (
          <View style={{ height: ITEM_HEIGHT, width: SCREEN_WIDTH }}>
            <FeedUserDeck 
              userPosts={item.posts.map((p: any) => ({ ...p, author: item.author }))} 
              isActiveDeck={index === activeDeckIndex}
              onDeletePost={handleDeletePost}
            />
          </View>
        )}
        pagingEnabled={true}
        vertical={true}
        snapToInterval={ITEM_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum={true}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 80 }}
        onEndReached={() => hasNextPage && fetchNextPage()}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  centerContainer: { flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' },
});