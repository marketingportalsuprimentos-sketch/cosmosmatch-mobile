import React, { memo, useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width } = Dimensions.get('window');

export const FeedPostCard = memo(({ post, authorName, authorAvatar }: any) => {
  const [isReady, setIsReady] = useState(false);

  // Verificação de segurança para o tipo de mídia
  const isVideo = post.mediaType === 'VIDEO' || post.imageUrl?.includes('.mp4');
  
  // Criamos o player. Importante: no iOS, muted deve ser true para autoplay
  const player = useVideoPlayer(post.imageUrl, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Monitora quando o vídeo sai da tela preta para o estado pronto
  useEffect(() => {
    const subscription = player.addListener('statusChange', (status) => {
      if (status === 'readyToPlay') {
        setIsReady(true);
      }
    });
    return () => subscription.remove();
  }, [player]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image 
          source={{ uri: authorAvatar || 'https://via.placeholder.com/40' }} 
          style={styles.avatar} 
        />
        <Text style={styles.authorName}>@{authorName}</Text>
      </View>

      <View style={styles.mediaContainer}>
        {isVideo ? (
          <>
            <VideoView
              player={player}
              style={styles.media}
              contentFit="cover"
              nativeControls={false}
              // A propriedade abaixo ajuda o iOS a não engasgar no primeiro frame
              allowsFullscreen={false}
              allowsPictureInPicture={false}
            />
            {!isReady && (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color="#8B5CF6" />
              </View>
            )}
          </>
        ) : (
          <Image source={{ uri: post.imageUrl }} style={styles.media} resizeMode="cover" />
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: 20, backgroundColor: '#1F2937' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  authorName: { color: 'white', fontWeight: 'bold' },
  mediaContainer: { width: width, height: width, backgroundColor: 'black', justifyContent: 'center' },
  media: { width: '100%', height: '100%' },
  loader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'black', justifyContent: 'center', alignItems: 'center' }
});