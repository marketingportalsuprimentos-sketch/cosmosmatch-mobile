import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useLikePost, useUnlikePost } from '@/features/feed/hooks/useFeed';
import { FeedPost, MediaType } from '@/types/feed.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const FeedPostCard = ({ post, author, isActive, isFollowedByMe, onShare, onOptions, onDelete, onOpenComments, onFollow }) => {
  const { user } = useAuth();
  const videoRef = useRef(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const { mutate: likePost } = useLikePost();
  const { mutate: unlikePost } = useUnlikePost();

  const isOwner = user?.id === author.id;

  useEffect(() => {
    if (post.mediaType === MediaType.VIDEO && videoRef.current) {
      if (isActive) videoRef.current.playAsync();
      else videoRef.current.pauseAsync();
    }
  }, [isActive]);

  return (
    <View style={styles.container}>
      <View style={styles.mediaContainer}>
        {post.mediaType === MediaType.VIDEO ? (
          <Video
            ref={videoRef}
            source={{ uri: post.imageUrl }}
            style={styles.media}
            resizeMode={ResizeMode.CONTAIN}
            isLooping
            shouldPlay={isActive}
            onLoad={() => setIsVideoLoaded(true)}
          />
        ) : (
          <Image source={{ uri: post.imageUrl }} style={styles.media} resizeMode="contain" />
        )}
      </View>

      <View style={styles.sideActions}>
        {!isOwner && (
          <TouchableOpacity onPress={onFollow} style={styles.followButtonContainer}>
              <Image 
                source={{ uri: author.profile?.imageUrl || 'https://via.placeholder.com/50' }} 
                style={styles.followAvatar} 
              />
              <View style={[styles.followBadge, { backgroundColor: isFollowedByMe ? 'white' : '#EC4899' }]}>
                  <Ionicons name={isFollowedByMe ? "remove" : "add"} size={12} color={isFollowedByMe ? "black" : "white"} />
              </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.actionButton} onPress={() => post.isLikedByMe ? unlikePost(post.id) : likePost(post.id)}>
          <Ionicons name={post.isLikedByMe ? "heart" : "heart-outline"} size={35} color={post.isLikedByMe ? "#ef4444" : "white"} />
          <Text style={styles.actionText}>{post.likesCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onOpenComments}>
          <Ionicons name="chatbubble-ellipses" size={32} color="white" />
          <Text style={styles.actionText}>{post.commentsCount}</Text>
        </TouchableOpacity>
      </View>

      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.6)']} style={styles.bottomOverlay}>
        <Text style={styles.content} numberOfLines={3}>{post.content}</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: 'black' },
  mediaContainer: { width: '100%', height: '100%', position: 'absolute' },
  media: { width: '100%', height: '100%' },
  sideActions: { position: 'absolute', right: 10, bottom: 120, alignItems: 'center', gap: 20, zIndex: 100 },
  followButtonContainer: { marginBottom: 15, alignItems: 'center', position: 'relative' },
  followAvatar: { width: 45, height: 45, borderRadius: 22.5, borderWidth: 1, borderColor: 'white' },
  followBadge: { position: 'absolute', bottom: -8, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  actionButton: { alignItems: 'center' },
  actionText: { color: 'white', fontSize: 12, fontWeight: '600', marginTop: 4 },
  bottomOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingBottom: 90, paddingTop: 40 },
  content: { color: 'white', fontSize: 15 }
});