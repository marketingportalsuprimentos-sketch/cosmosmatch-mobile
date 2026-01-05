import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, FlatList, ActivityIndicator, StatusBar, ViewToken, Dimensions, Text, Button 
} from 'react-native';
import { useGetFeed } from '@/features/feed/hooks/useFeed';
import { FeedUserDeck } from '@/features/feed/components/FeedUserDeck';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export const FeedScreen = () => {
  const insets = useSafeAreaInsets();
  const { data, fetchNextPage, hasNextPage, isLoading, isError, error, refetch } = useGetFeed();
  const [activeDeckIndex, setActiveDeckIndex] = useState(0);

  // CORREÇÃO CRÍTICA: O data.pages é uma array de arrays. Precisamos de um .flat()
  const decks = useMemo(() => {
    return data?.pages.flat().filter(deck => 
      deck && deck.author && Array.isArray(deck.posts) && deck.posts.length > 0
    ) || [];
  }, [data]);

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveDeckIndex(viewableItems[0].index);
    }
  }, []);

  if (isLoading && decks.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <FlatList
        data={decks}
        keyExtractor={(item, index) => `${item.author.id}-${index}`}
        renderItem={({ item, index }) => (
          <View style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH }}>
            <FeedUserDeck 
              deck={item} 
              isActiveDeck={index === activeDeckIndex}
              onDeckFinished={() => {}} // Evita erro de undefined
              onSharePost={() => {}}
              onOptionsPost={() => {}}
              onOpenComments={() => {}}
              onDeletePost={() => {}}
            />
          </View>
        )}
        pagingEnabled
        onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
      />
    </View>
  );
};