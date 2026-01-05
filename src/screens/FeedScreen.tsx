import React, { useState, useCallback } from 'react';
import { 
  View, 
  FlatList, 
  ActivityIndicator, 
  StatusBar, 
  ViewToken, 
  Dimensions, 
  Text, 
  Button 
} from 'react-native';
import { useGetFeed } from '@/features/feed/hooks/useFeed';
import { FeedUserDeck } from '@/features/feed/components/FeedUserDeck';
import { FeedDeck } from '@/types/feed.types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const FeedScreen = () => {
  const insets = useSafeAreaInsets();
  
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useGetFeed();
  
  const [activeDeckIndex, setActiveDeckIndex] = useState(0);

  // --- SINCRONIZAÇÃO DE DADOS EM TEMPO REAL ---
  // Extraímos os decks diretamente do data do React Query.
  // Isso garante que se o cache mudar (Follow/Unfollow), a UI atualiza instantaneamente sem travar.
  const decks = data?.pages.filter((page): page is FeedDeck => {
    return !!page && !!page.author && Array.isArray(page.posts) && page.posts.length > 0;
  }) || [];

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveDeckIndex(viewableItems[0].index);
    }
  }, []);

  // 1. ESTADO DE CARREGAMENTO
  if (isLoading && decks.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8B5CF6" />
        <Text style={{ color: 'white', marginTop: 10 }}>Carregando o teu cosmos...</Text>
      </View>
    );
  }

  // 2. ESTADO DE ERRO
  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: '#ef4444', fontSize: 18, fontWeight: 'bold' }}>Erro de Conexão</Text>
        <Text style={{ color: 'white', marginTop: 10, textAlign: 'center', marginBottom: 20 }}>
          {error instanceof Error ? error.message : 'Não foi possível carregar o feed.'}
        </Text>
        <Button title="Tentar Novamente" color="#8B5CF6" onPress={() => refetch()} />
      </View>
    );
  }

  // 3. ESTADO VAZIO
  if (decks.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>Feed Vazio</Text>
        <Text style={{ color: '#9ca3af', marginTop: 10, textAlign: 'center' }}>
          Segue novas pessoas na aba Descoberta para veres os seus posts aqui.
        </Text>
        <View style={{ marginTop: 20 }}>
          <Button title="Recarregar" color="#8B5CF6" onPress={() => refetch()} />
        </View>
      </View>
    );
  }

  // 4. RENDERIZAÇÃO DO FEED
  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <FlatList
        data={decks}
        keyExtractor={(item, index) => `${item.author.id}-${index}`}
        renderItem={({ item, index }) => (
          <View style={{ height: SCREEN_HEIGHT, width: Dimensions.get('window').width }}>
            <FeedUserDeck 
              deck={item} 
              isActiveDeck={index === activeDeckIndex}
            />
          </View>
        )}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onEndReached={() => {
          if (hasNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ 
          itemVisiblePercentThreshold: 70,
          minimumViewTime: 300 
        }}
        
        // Configurações de Snap (Estilo TikTok)
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        
        // Otimização de Performance
        removeClippedSubviews={true}
        initialNumToRender={1}
        maxToRenderPerBatch={2}
        windowSize={3}
      />
    </View>
  );
};