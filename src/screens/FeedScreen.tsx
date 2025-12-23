// src/screens/FeedScreen.tsx (VERSÃO DE DEBUG)

import React, { useRef, useState, useEffect } from 'react';
import { View, FlatList, ActivityIndicator, StatusBar, ViewToken, Dimensions, Text, Button } from 'react-native';
import { useGetFeed } from '@/features/feed/hooks/useFeed';
import { FeedUserDeck } from '@/features/feed/components/FeedUserDeck';
import { FeedDeck } from '@/types/feed.types';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const FeedScreen = () => {
  const insets = useSafeAreaInsets();
  
  // Hooks de dados
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

  // --- LOGS DE DEBUG ---
  useEffect(() => {
    console.log("--- DEBUG FEED ---");
    console.log("Is Loading:", isLoading);
    console.log("Is Error:", isError);
    if (error) console.log("Error Detail:", error);
    
    if (data) {
      console.log("Data Pages:", data.pages.length);
      data.pages.forEach((page, index) => {
        console.log(`Page ${index}:`, page ? `Author: ${page.author?.name}, Posts: ${page.posts?.length}` : "NULL/UNDEFINED");
      });
    } else {
      console.log("Data is undefined/null");
    }
    console.log("------------------");
  }, [data, isLoading, isError, error]);
  // --------------------

  // Processamento dos dados
  const decks = data?.pages.filter((page): page is FeedDeck => {
    return !!page && !!page.author && Array.isArray(page.posts) && page.posts.length > 0;
  }) || [];

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setActiveDeckIndex(viewableItems[0].index);
    }
  }).current;

  // ESTADO 1: CARREGANDO
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#a855f7" />
        <Text style={{ color: 'white', marginTop: 10 }}>Carregando Feed...</Text>
      </View>
    );
  }

  // ESTADO 2: ERRO
  if (isError) {
    return (
      <View style={{ flex: 1, backgroundColor: '#1a0000', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: 'red', fontSize: 18, fontWeight: 'bold' }}>Ocorreu um Erro</Text>
        <Text style={{ color: 'white', marginTop: 10, textAlign: 'center' }}>{JSON.stringify(error)}</Text>
        <Button title="Tentar Novamente" onPress={() => refetch()} />
      </View>
    );
  }

  // ESTADO 3: LISTA VAZIA
  if (decks.length === 0) {
     return (
        <View style={{ flex: 1, backgroundColor: '#00001a', justifyContent: 'center', alignItems: 'center' }}>
           <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>Feed Vazio</Text>
           <Text style={{ color: '#ccc', marginTop: 5 }}>Nenhum post retornado da API.</Text>
           <Text style={{ color: '#666', marginTop: 20, fontSize: 12 }}>Verifique se você segue alguém ou se há posts públicos.</Text>
           <Button title="Recarregar" onPress={() => refetch()} />
        </View>
     );
  }

  // ESTADO 4: SUCESSO (RENDERIZAÇÃO)
  return (
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Texto de Debug temporário no topo */}
      <View style={{ position: 'absolute', top: insets.top + 10, left: 10, zIndex: 100, backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Text style={{ color: '#0f0', fontSize: 10 }}>DEBUG: {decks.length} Decks carregados</Text>
      </View>

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
        viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
        
        // Configurações de Layout
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        
        // Performance
        windowSize={3}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        removeClippedSubviews={true}
      />
    </View>
  );
};