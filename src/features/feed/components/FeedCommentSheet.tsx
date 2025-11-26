import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal'; 
import { useTranslation } from 'react-i18next'; // <--- I18N
import { useGetPostComments, useCommentOnPost } from '../hooks/useFeed';
import { useAuth } from '../../../contexts/AuthContext';

interface FeedCommentSheetProps {
  isVisible: boolean;
  onClose: () => void;
  postId: string;
  authorId: string;
}

export function FeedCommentSheet({ isVisible, onClose, postId, authorId }: FeedCommentSheetProps) {
  const { user } = useAuth();
  const { t } = useTranslation(); // <--- HOOK
  const [commentText, setCommentText] = useState('');
  
  const { data: comments, isLoading } = useGetPostComments(postId);
  const { mutate: postComment, isPending } = useCommentOnPost();

  const handleSend = () => {
    if (!commentText.trim()) return;
    
    postComment(
      { postId, content: commentText, authorId }, 
      {
        onSuccess: () => { setCommentText(''); Keyboard.dismiss(); },
        onError: (error: any) => { if (error?.response?.status === 402) { Keyboard.dismiss(); onClose(); } }
      }
    );
  };

  const renderComment = ({ item }: any) => (
    <View style={styles.commentItem}>
       {item.user?.profile?.imageUrl ? (
         <Image source={{ uri: item.user.profile.imageUrl }} style={styles.avatar} />
       ) : ( <View style={[styles.avatar, styles.placeholderAvatar]} /> )}
       <View style={styles.commentBubble}>
          <Text style={styles.commentAuthor}>{item.user?.name || 'Usuário'}</Text>
          <Text style={styles.commentText}>{item.content}</Text>
       </View>
    </View>
  );

  return (
    <Modal 
      isVisible={isVisible} onBackdropPress={onClose} onSwipeComplete={onClose} 
      swipeDirection={['down']} style={styles.modal} propagateSwipe={true} avoidKeyboard={false} 
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.container} keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
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
               data={comments || []} keyExtractor={(item) => item.id} renderItem={renderComment}
               ListEmptyComponent={<Text style={styles.emptyText}>{t('comments_empty')}</Text>}
               contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
             />
           )}
        </View>

        <View style={styles.footer}>
           <TextInput
             style={styles.input}
             placeholder={t('comments_placeholder')}
             placeholderTextColor="#6B7280"
             value={commentText} onChangeText={setCommentText} multiline
           />
           <TouchableOpacity 
             style={[styles.sendBtn, !commentText.trim() && styles.disabledBtn]} 
             onPress={handleSend} disabled={!commentText.trim() || isPending}
           >
              {isPending ? <ActivityIndicator size="small" color="white" /> : <Ionicons name="paper-plane" size={20} color="white" />}
           </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: { margin: 0, justifyContent: 'flex-end' },
  container: { backgroundColor: '#111827', height: '75%', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  header: { alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#1F2937', backgroundColor: '#1F2937' },
  handle: { width: 40, height: 4, backgroundColor: '#374151', borderRadius: 2, marginBottom: 10 },
  title: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  closeBtn: { position: 'absolute', right: 15, top: 15 },
  listContainer: { flex: 1, backgroundColor: '#0f131f' }, 
  emptyText: { color: '#6B7280', textAlign: 'center', marginTop: 40, fontStyle: 'italic' },
  commentItem: { flexDirection: 'row', marginBottom: 16 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  placeholderAvatar: { backgroundColor: '#374151' },
  commentBubble: { flex: 1 },
  commentAuthor: { color: '#9CA3AF', fontSize: 12, marginBottom: 2 },
  commentText: { color: '#E5E7EB', fontSize: 14 },
  footer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 30 : 15, borderTopWidth: 1, borderTopColor: '#374151', backgroundColor: '#111827' },
  input: { flex: 1, backgroundColor: '#1F2937', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, color: 'white', maxHeight: 100, borderWidth: 1, borderColor: '#374151' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  disabledBtn: { backgroundColor: '#4B5563' }
});