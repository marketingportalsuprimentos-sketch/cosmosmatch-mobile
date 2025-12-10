import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FeedPost, MediaType } from '../services/feedApi';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface FeedPostCardProps {
  post: FeedPost;
  authorName: string;
  authorAvatar: string | null;
  onLike: () => void;
  onComment: () => void;
  onDelete?: () => void; 
  isOwner: boolean;
}

export function FeedPostCard({ post, authorName, authorAvatar, onLike, onComment, onDelete, isOwner }: FeedPostCardProps) {
  const { t, i18n } = useTranslation();
  
  // Data localizada
  const date = new Date(post.createdAt).toLocaleDateString(i18n.language, { day: '2-digit', month: 'short' });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.authorInfo}>
          {authorAvatar ? (
            <Image source={{ uri: authorAvatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}><Ionicons name="person" size={16} color="#9CA3AF" /></View>
          )}
          <View>
             <Text style={styles.authorName}>{authorName}</Text>
             <Text style={styles.dateText}>{date}</Text>
          </View>
        </View>
        {isOwner && (
          <TouchableOpacity onPress={onDelete}><Ionicons name="trash-outline" size={20} color="#EF4444" /></TouchableOpacity>
        )}
      </View>

      <View style={styles.mediaContainer}>
         {/* Nota: Para um card estático na lista, usamos placeholder. 
             Se precisar de autoplay aqui, use VideoView com controls=false */}
         {post.mediaType === MediaType.VIDEO ? (
            <View style={styles.videoPlaceholder}>
                <Ionicons name="play-circle" size={50} color="white" />
                <Text style={{color:'white', marginTop: 10}}>{t('video_label')}</Text>
            </View>
         ) : (
            <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" />
         )}
      </View>

      <View style={styles.actionsRow}>
         <TouchableOpacity style={styles.actionButton} onPress={onLike}>
            <Ionicons name={post.isLikedByMe ? "heart" : "heart-outline"} size={26} color={post.isLikedByMe ? "#EF4444" : "white"} />
            <Text style={styles.actionText}>{post.likesCount}</Text>
         </TouchableOpacity>
         <TouchableOpacity style={styles.actionButton} onPress={onComment}>
            <Ionicons name="chatbubble-outline" size={24} color="white" />
            <Text style={styles.actionText}>{post.commentsCount}</Text>
         </TouchableOpacity>
      </View>

      {post.content && (
        <Text style={styles.content} numberOfLines={3}>
           <Text style={{fontWeight: 'bold'}}>{authorName} </Text>{post.content}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20, backgroundColor: '#1F2937', paddingBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 },
  authorInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  placeholderAvatar: { backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' },
  authorName: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  dateText: { color: '#9CA3AF', fontSize: 12 },
  mediaContainer: { width: '100%', height: width }, 
  image: { width: '100%', height: '100%' },
  videoPlaceholder: { width: '100%', height: '100%', backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  actionsRow: { flexDirection: 'row', padding: 10, gap: 20 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  content: { color: '#D1D5DB', paddingHorizontal: 10, fontSize: 14, lineHeight: 20 }
});