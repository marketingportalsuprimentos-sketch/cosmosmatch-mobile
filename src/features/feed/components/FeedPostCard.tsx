import React from 'react';
import { 
  View, Text, Image, StyleSheet, Dimensions, TouchableOpacity 
} from 'react-native';
import { ResizeMode, Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { FeedPost, MediaType } from '@/types/feed.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FeedPostCardProps {
  post: FeedPost;
  author: { id: string; name: string; profile?: { imageUrl?: string | null } };
  isActive: boolean;
  isFollowedByMe: boolean; 
  onShare?: () => void;
  onOptions?: () => void;
  onOpenComments?: () => void;
  onFollow?: () => void; 
}

export const FeedPostCard: React.FC<FeedPostCardProps> = ({ 
  post, 
  author, 
  isActive, 
  isFollowedByMe, 
  onShare,
  onOptions,
  onOpenComments,
  onFollow,
}) => {
  const { user } = useAuth();
  const isOwner = user?.id === author.id;

  return (
    <View style={styles.container}>
      {post.mediaType === MediaType.VIDEO ? (
        <Video
          source={{ uri: post.imageUrl }}
          style={styles.media}
          resizeMode={ResizeMode.COVER}
          shouldPlay={isActive}
          isLooping
          isMuted={false}
        />
      ) : (
        <Image source={{ uri: post.imageUrl }} style={styles.media} resizeMode="cover" />
      )}

      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient} />

      <View style={styles.sideActions}>
        <View style={styles.followButtonContainer}>
          <TouchableOpacity activeOpacity={0.8}>
            {author.profile?.imageUrl ? (
              <Image source={{ uri: author.profile.imageUrl }} style={styles.followAvatar} />
            ) : (
              <View style={[styles.followAvatar, { backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="person" size={24} color="#9CA3AF" />
              </View>
            )}
          </TouchableOpacity>
          
          {!isOwner && (
            <TouchableOpacity 
              style={[
                styles.followBadge, 
                { backgroundColor: isFollowedByMe ? '#10B981' : '#8B5CF6' } 
              ]} 
              onPress={onFollow}
            >
              <Ionicons 
                name={isFollowedByMe ? "checkmark" : "add"} 
                size={14} 
                color="white" 
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.actionButton} onPress={onOpenComments}>
          <Ionicons name="chatbubble-outline" size={32} color="white" />
          <Text style={styles.actionText}>{post.commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onShare}>
          <Ionicons name="share-social-outline" size={32} color="white" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={onOptions}>
          <Ionicons name="ellipsis-horizontal" size={28} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomInfo}>
        <Text style={styles.authorName}>@{author.name}</Text>
        {post.content && <Text style={styles.caption} numberOfLines={2}>{post.content}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { width: SCREEN_WIDTH, height: SCREEN_HEIGHT, backgroundColor: 'black' },
  media: { ...StyleSheet.absoluteFillObject },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 300 },
  sideActions: { position: 'absolute', right: 10, bottom: 120, alignItems: 'center', gap: 20 },
  followButtonContainer: { marginBottom: 15, alignItems: 'center', position: 'relative' },
  followAvatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: 'white' },
  followBadge: { position: 'absolute', bottom: -5, width: 22, height: 22, borderRadius: 11, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'black' },
  actionButton: { alignItems: 'center' },
  actionText: { color: 'white', fontSize: 12, fontWeight: '600', marginTop: 4 },
  bottomInfo: { position: 'absolute', left: 16, bottom: 40, right: 80 },
  authorName: { color: 'white', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  caption: { color: 'white', fontSize: 14 },
});