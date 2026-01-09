// mobile/src/features/feed/components/FeedUserDeck.tsx

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  View, Text, Image, StyleSheet, Dimensions, FlatList, Animated, Easing, TouchableOpacity, Alert, Share 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { BlurView } from 'expo-blur'; 
import { useVideoPlayer, VideoView } from 'expo-video';

import { useAuth } from '../../../contexts/AuthContext'; 
import { useLikePost, useUnlikePost, useDeletePost } from '../hooks/useFeed';
import { useFollowUser } from '../../profile/hooks/useProfile'; 
import { FeedCommentSheet } from './FeedCommentSheet'; 
import { ReportPostModal } from './ReportPostModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FeedMediaItem = ({ item, isActive, isMuted, setIsMuted }: any) => {
  const isVideo = 
    item.mediaType?.toUpperCase() === 'VIDEO' || 
    item.imageUrl?.toLowerCase().includes('.mp4') || 
    item.imageUrl?.toLowerCase().includes('.mov') ||
    item.imageUrl?.toLowerCase().includes('video/upload');

  const player = useVideoPlayer(isVideo ? item.imageUrl : null, p => {
    p.loop = true;
    p.muted = isMuted; 
    if (isActive) p.play();
  });

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  useEffect(() => {
    if (isActive && isVideo) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, isVideo, player]);

  if (isVideo) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <VideoView 
          player={player} 
          style={StyleSheet.absoluteFill} 
          contentFit="cover" 
          nativeControls={false} 
        />
        <TouchableOpacity 
          style={styles.topRightMuteButton} 
          onPress={() => setIsMuted(!isMuted)}
          activeOpacity={0.7}
        >
          <Ionicons name={isMuted ? "volume-mute" : "volume-high"} size={20} color="white" />
        </TouchableOpacity>
      </View>
    );
  }

  return <Image source={{ uri: item.imageUrl }} style={styles.media} resizeMode="cover" />;
};

export function FeedUserDeck({ userPosts = [], isActiveDeck, onDeckComplete }: any) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isReportingOpen, setIsReportingOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true); 

  const isFocused = useIsFocused();
  const { user: loggedInUser } = useAuth();
  const navigation = useNavigation<any>();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const { mutate: likePost } = useLikePost();
  const { mutate: unlikePost } = useUnlikePost();
  const { mutate: deletePost } = useDeletePost();
  const { mutate: followUser } = useFollowUser();

  // GARANTIR QUE SEMPRE TEMOS UM POST PARA NÃO DAR TELA PRETA
  const currentPost = userPosts[currentIndex];
  const author = currentPost?.author;
  const isOwner = loggedInUser?.id === author?.id;
  const isFollowing = author?.isFollowedByMe; 
  const isSensitive = currentPost?.isSensitive;

  useEffect(() => {
    if (isFocused) {
      setIsCommentsOpen(false);
      setIsReportingOpen(false);
    }
  }, [isFocused]);

  useEffect(() => {
    if (!isActiveDeck || !isFocused || isCommentsOpen || isReportingOpen || !currentPost) {
      progressAnim.stopAnimation();
      return;
    }

    const currentVal = (progressAnim as any)._value || 0;
    if (currentVal >= 0.98) progressAnim.setValue(0);

    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: 5000 * (1 - (currentVal >= 1 ? 0 : currentVal)),
      easing: Easing.linear,
      useNativeDriver: false,
    });

    animation.start(({ finished }) => { 
      if (finished) {
        progressAnim.setValue(0);
        handleNext();
      }
    });

    return () => animation.stop();
  }, [currentIndex, isActiveDeck, isFocused, isCommentsOpen, isReportingOpen, currentPost]); 

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Vê este post de ${author?.name} no CosmosMatch! ${currentPost.imageUrl}`,
      });
    } catch (error: any) {
      console.log(error.message);
    }
  };

  const handleNext = () => {
    if (currentIndex < userPosts.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      onDeckComplete?.();
    }
  };

  const onScroll = (e: any) => {
    const contentOffset = e.nativeEvent.contentOffset.x;
    const nextIndex = Math.round(contentOffset / SCREEN_WIDTH);
    if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < userPosts.length) {
      progressAnim.stopAnimation();
      progressAnim.setValue(0); 
      setCurrentIndex(nextIndex);
    }
  };

  const handleDelete = () => {
    Alert.alert("Apagar", "Deseja remover este post permanentemente?", [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Apagar", 
        style: "destructive", 
        onPress: () => {
          deletePost(currentPost.id, {
            onSuccess: () => {
              // Se houver post anterior, volta para ele para evitar a tela preta
              if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
              }
            }
          });
        } 
      }
    ]);
  };

  if (!currentPost) return null;

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={userPosts}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.mediaContainer}>
            <FeedMediaItem 
              item={item} 
              isActive={isActiveDeck && isFocused && index === currentIndex && !isCommentsOpen} 
              isMuted={isMuted}
              setIsMuted={setIsMuted}
            />
            {item.isSensitive && (
              <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill}>
                <View style={styles.blurContent}>
                  <Ionicons name="alert-circle" size={80} color="#EF4444" style={{ marginBottom: 20 }} />
                  <Text style={styles.blurTitle}>Post Ocultado</Text>
                  <Text style={styles.blurSubtitle}>Conteúdo em moderação.</Text>
                </View>
              </BlurView>
            )}
          </View>
        )}
        decelerationRate="fast"
        snapToInterval={SCREEN_WIDTH}
      />

      <LinearGradient colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient} pointerEvents="none" />

      <View style={styles.topUserInfo}>
        <TouchableOpacity 
          onPress={() => navigation.navigate(isOwner ? 'ProfileTab' : 'PublicProfile', { userId: author?.id })}
          style={styles.authorRow}
        >
          <Image source={{ uri: author?.profile?.imageUrl || 'https://ui-avatars.com/api/?name=U' }} style={styles.avatar} />
          <Text style={styles.name}>{author?.name}</Text>
        </TouchableOpacity>
      </View>

      {!isSensitive && (
        <>
          <View style={styles.sideButtons}>
            {!isOwner && !isFollowing && (
              <TouchableOpacity onPress={() => followUser(author.id)} style={styles.followBtnSide}>
                <Ionicons name="add-circle" size={42} color="#8B5CF6" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.actionBtn} onPress={() => currentPost.isLikedByMe ? unlikePost(currentPost.id) : likePost(currentPost.id)}>
              <Ionicons name={currentPost.isLikedByMe ? "heart" : "heart-outline"} size={35} color={currentPost.isLikedByMe ? "#EF4444" : "white"} />
              <Text style={styles.actionText}>{currentPost.likesCount || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => setIsCommentsOpen(true)}>
              <Ionicons name="chatbubble-outline" size={32} color="white" />
              <Text style={styles.actionText}>{currentPost.commentsCount || 0}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionBtn} onPress={isOwner ? handleDelete : () => setIsReportingOpen(true)}>
              <Ionicons name={isOwner ? "trash-outline" : "ellipsis-horizontal"} size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={28} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.caption} numberOfLines={2}>{currentPost.content}</Text>
          </View>
        </>
      )}

      <View style={styles.progressContainer}>
        {userPosts.map((_: any, index: number) => (
          <View key={index} style={styles.progressBarBg}>
            <Animated.View 
              style={[
                styles.progressBarFill, 
                { 
                  width: index === currentIndex 
                    ? progressAnim.interpolate({inputRange: [0, 1], outputRange: ['0%', '100%']}) 
                    : index < currentIndex ? '100%' : '0%' 
                }
              ]} 
            />
          </View>
        ))}
      </View>

      <FeedCommentSheet isVisible={isCommentsOpen} onClose={() => setIsCommentsOpen(false)} postId={currentPost.id} authorId={author?.id} />
      {isReportingOpen && <ReportPostModal isVisible={isReportingOpen} onClose={() => setIsReportingOpen(false)} postId={currentPost.id} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  mediaContainer: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT },
  media: { width: '100%', height: '100%' },
  topRightMuteButton: {
    position: 'absolute',
    top: 130,
    right: 15,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  gradient: { ...StyleSheet.absoluteFillObject },
  blurContent: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  blurTitle: { color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  blurSubtitle: { color: '#9CA3AF', textAlign: 'center', fontSize: 16 },
  topUserInfo: { position: 'absolute', top: 70, left: 15, zIndex: 60 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 2, borderColor: 'white' },
  name: { color: 'white', fontWeight: 'bold', fontSize: 18, textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4 },
  progressContainer: { position: 'absolute', top: 55, left: 10, right: 10, flexDirection: 'row', gap: 5, zIndex: 70 },
  progressBarBg: { flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
  progressBarFill: { height: '100%', backgroundColor: 'white' },
  sideButtons: { position: 'absolute', right: 15, bottom: 100, alignItems: 'center', gap: 22, zIndex: 20 },
  followBtnSide: { marginBottom: 10 },
  actionBtn: { alignItems: 'center' },
  actionText: { color: 'white', fontSize: 12, fontWeight: 'bold', marginTop: 2 },
  footer: { position: 'absolute', bottom: 45, left: 15, right: 80, zIndex: 10 },
  caption: { color: 'white', fontSize: 15, textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4 }
});