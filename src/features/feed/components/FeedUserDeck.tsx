// mobile/src/features/feed/components/FeedUserDeck.tsx

import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, Image, StyleSheet, Dimensions, FlatList, TouchableOpacity, Animated, Easing 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useVideoPlayer, VideoView } from 'expo-video';
import { FeedPost, MediaType } from '../services/feedApi';
import { useAuth } from '../../../contexts/AuthContext'; 
import { useGetFollowing } from '../../profile/hooks/useProfile'; 
import { useTranslation } from 'react-i18next';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const DEFAULT_PHOTO_DURATION = 5000; 

const getOptimizedVideoUrl = (url: string) => {
  if (!url) return null;
  if (!url.includes('cloudinary.com')) return url;
  if (url.includes('vc_h264')) return url;

  let optimized = url.replace(
    /\/upload\//,
    '/upload/f_mp4,vc_h264,q_auto:eco,br_1m/'
  );

  if (optimized.endsWith('.mov')) {
    optimized = optimized.replace('.mov', '.mp4');
  }
  return optimized;
};

interface FeedUserDeckProps {
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  posts: FeedPost[];
  isDeckActive: boolean; 
  paused: boolean;
  onDeckFinished: () => void; 
  onLikePost: (postId: string) => void;
  onOpenComments: (postId: string, authorId: string) => void;
  onSharePost: (postId: string, imageUrl: string, authorName: string) => void;
  onNavigateToProfile: (userId: string) => void;
  onFollowAuthor: (userId: string) => void;
  onDeletePost?: (postId: string) => void; 
  customHeight?: number;
}

const DeckPostItem = ({ 
  item, 
  isActive, 
  effectiveHeight, 
  isOwner, 
  isFollowing, 
  authorName, 
  t, 
  onDeletePost, 
  onFollowPress, 
  onLikePost, 
  onOpenComments, 
  onSharePost 
}: any) => {
  
  const isVideo = 
    item.mediaType === MediaType.VIDEO || 
    item.mediaType === 'video' || 
    (item.imageUrl && (item.imageUrl.includes('.mov') || item.imageUrl.includes('.mp4')));

  const videoSource = isVideo ? getOptimizedVideoUrl(item.imageUrl) : null;

  const player = useVideoPlayer(videoSource, player => {
    player.loop = true; 
    player.muted = false;
  });

  useEffect(() => {
    if (isVideo && videoSource) {
      if (isActive) {
        player.play();
      } else {
        player.pause();
      }
    }
  }, [isActive, isVideo, videoSource, player]);

  return (
    <View style={[styles.postContainer, { height: effectiveHeight }]}>
      {isVideo && videoSource ? (
          <View style={styles.fullImage}>
            <VideoView
                player={player}
                style={styles.fullImage}
                contentFit="cover"
                nativeControls={false}
                backgroundColor="black"
            />
          </View>
      ) : (
          <Image source={{ uri: item.imageUrl }} style={styles.fullImage} resizeMode="cover" />
      )}

      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.9)']} style={styles.bottomGradient} />

      <View style={styles.rightActions}>
          {isOwner ? (
              <TouchableOpacity style={styles.actionButton} onPress={() => { if (onDeletePost) onDeletePost(item.id); }}>
                  <View style={styles.iconCircle}>
                     <Ionicons name="trash-outline" size={24} color="#EF4444" />
                  </View>
                  <Text style={[styles.actionLabel, {color: '#EF4444'}]}>{t('delete')}</Text>
              </TouchableOpacity>
          ) : (
              <TouchableOpacity style={styles.actionButton} onPress={onFollowPress} disabled={isFollowing}>
                  <View style={[styles.followIconContainer, isFollowing && { borderColor: '#10B981', backgroundColor:'rgba(16, 185, 129, 0.3)' }]}>
                     {isFollowing ? 
                        <Ionicons name="checkmark" size={20} color="#10B981" /> : 
                        <><Ionicons name="person" size={20} color="white" /><View style={styles.plusBadge}><Ionicons name="add" size={10} color="white" /></View></>
                     }
                  </View>
                  <Text style={styles.actionLabel}>{isFollowing ? t('following_status') : t('follow')}</Text>
              </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionButton} onPress={() => onLikePost(item.id)}>
             <Ionicons name={item.isLikedByMe ? "heart" : "heart-outline"} size={35} color={item.isLikedByMe ? "#EF4444" : "white"} />
             <Text style={styles.actionLabel}>{item.likesCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => onOpenComments(item.id, item.authorId)}>
             <Ionicons name="chatbubble-ellipses-outline" size={32} color="white" />
             <Text style={styles.actionLabel}>{item.commentsCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={() => onSharePost(item.id, item.imageUrl, authorName)}>
             <Ionicons name="share-outline" size={32} color="white" />
             <Text style={styles.actionLabel}>{t('send')}</Text> 
          </TouchableOpacity>
      </View>

      <View style={styles.bottomInfo}>
          {item.content && <Text style={styles.caption} numberOfLines={3}>{item.content}</Text>}
      </View>
    </View>
  );
};

export function FeedUserDeck({ 
  authorId, authorName, authorAvatar, posts, isDeckActive, paused,
  onDeckFinished, onLikePost, onOpenComments, onSharePost,
  onNavigateToProfile, onFollowAuthor, onDeletePost,
  customHeight 
}: FeedUserDeckProps) {
  
  const { user } = useAuth(); 
  const { t } = useTranslation();
  const isOwner = user?.id === authorId; 

  const effectiveHeight = (customHeight && customHeight > 0) ? customHeight : SCREEN_HEIGHT;

  const { data: followingList } = useGetFollowing(user?.id);
  const isFollowing = followingList?.some(u => u.id === authorId) ?? false;

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isDeckActive || paused) {
      progressAnim.setValue(0);
      return;
    }
    progressAnim.setValue(0);
    const currentPost = posts[currentIndex];
    if (!currentPost) return;

    let actualDuration = DEFAULT_PHOTO_DURATION;
    
    const isVideo = currentPost.mediaType === MediaType.VIDEO || 
                    currentPost.mediaType === 'video' ||
                    (currentPost.imageUrl && (currentPost.imageUrl.includes('.mp4') || currentPost.imageUrl.includes('.mov')));

    if (isVideo && currentPost.videoDuration && !isNaN(Number(currentPost.videoDuration))) {
        actualDuration = (Number(currentPost.videoDuration) * 1000) + 200;
    }

    const animation = Animated.timing(progressAnim, {
      toValue: 1,
      duration: actualDuration, 
      easing: Easing.linear,
      useNativeDriver: false, 
    });

    const timer = setTimeout(() => { goToNextPost(); }, actualDuration);
    animation.start();

    return () => { clearTimeout(timer); animation.stop(); };
  }, [currentIndex, isDeckActive, paused]);

  const goToNextPost = () => {
    if (currentIndex < posts.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    } else {
      onDeckFinished();
    }
  };

  const onViewRef = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) { setCurrentIndex(viewableItems[0].index || 0); }
  });
  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const handleFollowPress = () => { onFollowAuthor(authorId); };

  return (
    <View style={{ height: effectiveHeight, width: SCREEN_WIDTH, backgroundColor: 'black' }}>
      <View style={styles.progressContainer}>
         {posts.map((_, index) => {
           let width: any = '0%';
           if (index < currentIndex) width = '100%'; 
           else if (index === currentIndex) {
              width = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
           }
           return (<View key={index} style={styles.progressBarBg}><Animated.View style={[styles.progressBarFill, { width }]} /></View>);
         })}
      </View>

      <TouchableOpacity 
        style={styles.header} 
        onPress={() => onNavigateToProfile(authorId)} 
        activeOpacity={0.7}
      >
         {authorAvatar ? (
            <Image source={{ uri: authorAvatar }} style={styles.avatar} />
         ) : (
            <View style={[styles.avatar, {backgroundColor:'#333'}]} />
         )}
         <Text style={styles.authorName}>@{authorName}</Text>
         <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          const isActive = isDeckActive && index === currentIndex && !paused;
          
          return (
            <DeckPostItem 
              item={item}
              isActive={isActive}
              effectiveHeight={effectiveHeight}
              isOwner={isOwner}
              isFollowing={isFollowing}
              authorName={authorName}
              t={t}
              onDeletePost={onDeletePost}
              onFollowPress={handleFollowPress}
              onLikePost={onLikePost}
              onOpenComments={onOpenComments}
              onSharePost={onSharePost}
            />
          );
        }}
        horizontal pagingEnabled showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewRef.current}
        viewabilityConfig={viewConfigRef.current}
        initialNumToRender={1} maxToRenderPerBatch={2} windowSize={3} scrollEnabled={true} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  postContainer: { width: SCREEN_WIDTH, justifyContent: 'center', backgroundColor: 'black' },
  fullImage: { width: '100%', height: '100%' },
  bottomGradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%' },

  progressContainer: { position: 'absolute', top: 60, left: 10, right: 10, zIndex: 20, flexDirection: 'row', gap: 4, height: 3 },
  progressBarBg: { flex: 1, height: '100%', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 2 },
  progressBarFill: { height: '100%', backgroundColor: 'white', borderRadius: 2 },

  // AJUSTE 1: Desci um pouco o cabeçalho (top 100) para separar da barra de progresso e do card de dia pessoal
  header: { position: 'absolute', top: 100, left: 15, zIndex: 30, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', padding: 6, borderRadius: 20 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: 'white', marginRight: 10 },
  authorName: { color: 'white', fontWeight: 'bold', fontSize: 18, textShadowColor: 'black', textShadowRadius: 3, marginRight: 4 },

  // AJUSTE 2: Subi os botões (bottom 120) para não cortar na TabBar
  rightActions: { position: 'absolute', right: 10, bottom: 120, alignItems: 'center', zIndex: 20, gap: 20 },
  actionButton: { alignItems: 'center' },
  actionLabel: { color: 'white', fontSize: 12, fontWeight: '600', marginTop: 2, textShadowColor: 'black', textShadowRadius: 3 },
  
  followIconContainer: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 20, borderWidth: 1, borderColor: 'white' },
  iconCircle: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 20, borderWidth: 1, borderColor: '#EF4444' }, 
  plusBadge: { position: 'absolute', bottom: -5, backgroundColor: '#EF4444', borderRadius: 8, width: 16, height: 16, justifyContent: 'center', alignItems: 'center' },

  // AJUSTE 3: Subi a legenda (bottom 120) para alinhar com o início dos botões
  bottomInfo: { position: 'absolute', bottom: 120, left: 15, right: 80, zIndex: 20 },
  caption: { color: 'white', fontSize: 14, marginBottom: 10, textShadowColor: 'black', textShadowRadius: 3 },
});