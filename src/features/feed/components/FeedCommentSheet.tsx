// src/features/feed/components/FeedCommentSheet.tsx

import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard, Alert, Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal'; 
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useGetPostComments, useCommentOnPost, useDeletePostComment } from '../hooks/useFeed';
import { useAuth } from '@/contexts/AuthContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FeedCommentSheetProps {
  isVisible: boolean;
  onClose: () => void;
  postId: string;
  authorId: string; // ID do dono do post
}

export function FeedCommentSheet({ isVisible, onClose, postId, authorId }: FeedCommentSheetProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>(); // Navegação
  const [commentText, setCommentText] = useState('');
  const { user: loggedInUser } = useAuth(); // Quem está logado
  
  const { data: comments, isLoading } = useGetPostComments(postId);
  const { mutate: postComment, isPending } = useCommentOnPost();
  const { mutate: deleteComment, isPending: isDeleting } = useDeletePostComment();

  const handleSend = () => {
    if (!commentText.trim()) return;
    
    postComment(
      { postId, content: commentText, authorId }, 
      {
        onSuccess: () => { 
          setCommentText(''); 
          Keyboard.dismiss();
          // onClose(); // Opcional: Manter aberto para ver o comentário surgir
        },
        onError: (error: any) => { 
            Keyboard.dismiss();
            
            // --- CORREÇÃO DO TRAVAMENTO ---
            if (error?.response?.status === 402) { 
                // 1. Fecha o modal PRIMEIRO
                onClose(); 
                
                // 2. Navega DEPOIS de um pequeno delay
                setTimeout(() => {
                    navigation.navigate('PremiumScreen'); 
                }, 300);
            } else {
                Alert.alert(t('error'), t('error_generic') || 'Erro ao enviar.');
            }
        }
      }
    );
  };

  const handleDelete = (commentId: string) => {
      Alert.alert(
          t('delete_comment_title', 'Apagar comentário?'),
          t('delete_comment_confirm', 'Essa ação não tem volta.'),
          [
              { text: t('cancel'), style: 'cancel' },
              { 
                  text: t('delete'), 
                  style: 'destructive', 
                  onPress: () => deleteComment(commentId) 
              }
          ]
      );
  };

  const renderComment = ({ item }: any) => {
    // Sou dono do post?
    const isPostOwner = loggedInUser?.id === authorId;
    // Sou dono do comentário?
    const isCommentAuthor = loggedInUser?.id === item.userId;
    
    // Direito de apagar
    const canDelete = isPostOwner || isCommentAuthor;

    return (
      <View style={styles.commentItem}>
         {item.user?.profile?.imageUrl ? (
           <Image source={{ uri: item.user.profile.imageUrl }} style={styles.avatar} />
         ) : ( <View style={[styles.avatar, styles.placeholderAvatar]} /> )}
         
         <View style={styles.commentBubble}>
            <Text style={styles.commentAuthor}>{item.user?.name || t('user_default')}</Text>
            <Text style={styles.commentText}>{item.content}</Text>
         </View>

         {canDelete && (
             <TouchableOpacity 
                onPress={() => handleDelete(item.id)} 
                style={styles.deleteBtn}
                disabled={isDeleting}
             >
                 <Ionicons name="trash-outline" size={18} color="#EF4444" />
             </TouchableOpacity>
         )}
      </View>
    );
  };

  return (
    <Modal 
      isVisible={isVisible} 
      onBackdropPress={onClose} 
      onSwipeComplete={onClose} 
      swipeDirection={['down']} 
      style={styles.modal} 
      propagateSwipe={true}
      avoidKeyboard={true} 
    >
      <View style={styles.container}>
        <View style={styles.header}>
           <View style={styles.handle} />
           <Text style={styles.title}>{t('comments_title')}</Text>
           <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#9CA3AF" />
           </TouchableOpacity>
        </View>

        <View style={styles.listContainer}>
           {isLoading ? ( <ActivityIndicator color="#8B5CF6" style={{marginTop: 20}} /> ) : (
             <FlatList
               data={comments || []} 
               keyExtractor={(item) => item.id} 
               renderItem={renderComment}
               ListEmptyComponent={<Text style={styles.emptyText}>{t('comments_empty')}</Text>}
               contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
             />
           )}
        </View>

        <KeyboardAvoidingView 
           behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
           keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.footer}>
             <TextInput
               style={styles.input}
               placeholder={t('send_message_placeholder')}
               placeholderTextColor="#6B7280"
               value={commentText} 
               onChangeText={setCommentText} 
               multiline
             />
             <TouchableOpacity 
               style={[styles.sendBtn, !commentText.trim() && styles.disabledBtn]} 
               onPress={handleSend} 
               disabled={!commentText.trim() || isPending}
             >
                {isPending ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="paper-plane" size={20} color="white" />}
             </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { margin: 0, justifyContent: 'flex-end' },
  container: { backgroundColor: '#111827', height: SCREEN_HEIGHT * 0.75, borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  header: { alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#1F2937', backgroundColor: '#1F2937' },
  handle: { width: 40, height: 4, backgroundColor: '#374151', borderRadius: 2, marginBottom: 10 },
  title: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  closeBtn: { position: 'absolute', right: 15, top: 15 },
  listContainer: { flex: 1, backgroundColor: '#0f131f' }, 
  emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
  commentItem: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10, marginTop: 2 },
  placeholderAvatar: { backgroundColor: '#374151' },
  commentBubble: { flex: 1 },
  commentAuthor: { color: '#9CA3AF', fontSize: 12, marginBottom: 2, fontWeight: 'bold' },
  commentText: { color: '#E5E7EB', fontSize: 14, lineHeight: 20 },
  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 15, borderTopWidth: 1, borderTopColor: '#374151', backgroundColor: '#111827' },
  input: { flex: 1, backgroundColor: '#1F2937', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, color: 'white', maxHeight: 100, borderWidth: 1, borderColor: '#374151' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  disabledBtn: { backgroundColor: '#4B5563' },
  deleteBtn: { padding: 8, marginLeft: 4 }
});