import React, { useState, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard, Modal, Alert 
} from 'react-native';
import { X, Send, Trash2 } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  useGetGalleryPhotoComments, 
  useCommentOnGalleryPhoto,
  useDeleteGalleryPhotoComment 
} from '../hooks/useProfile';
import { useTimeAgo } from '../../../hooks/useTimeAgo';

interface GalleryCommentSheetProps {
  photoId: string | null;
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string;
  isPhotoOwner: boolean; 
}

export const GalleryCommentSheet = ({ 
  photoId, isOpen, onClose, targetUserId, isPhotoOwner 
}: GalleryCommentSheetProps) => {
  
  const [newComment, setNewComment] = useState('');
  const navigation = useNavigation<any>();
  const { user: loggedInUser } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  
  if (!isOpen || !photoId) return null;

  const { data: comments, isLoading } = useGetGalleryPhotoComments(photoId);
  const { mutate: sendComment, isPending: isSending } = useCommentOnGalleryPhoto(targetUserId);
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteGalleryPhotoComment(); 
  
  const { timeAgo } = useTimeAgo();

  const handleSend = () => {
    if (!newComment.trim()) return;
    sendComment({ photoId, content: newComment }, {
        onSuccess: () => {
          setNewComment('');
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 500);
        },
        onError: (error: any) => {
            if (error?.response?.status === 402) {
                Keyboard.dismiss(); 
                onClose(); 
                setTimeout(() => {
                    navigation.navigate('Premium');
                }, 300);
            }
        }
    });
  };

  const handleDeleteConfirm = (commentId: string) => {
    Alert.alert(
      "Apagar comentário?",
      "Essa ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Apagar", 
          style: "destructive", 
          // Ajustado para enviar photoId e commentId
          onPress: () => deleteComment({ photoId, commentId }) 
        }
      ]
    );
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlayWrapper}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
          
          <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} 
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
              style={styles.sheet}
          >
              <View style={styles.header}>
                  <Text style={styles.title}>Comentários</Text>
                  <TouchableOpacity onPress={onClose} style={{padding: 4}}>
                      <X size={24} color="#9CA3AF" />
                  </TouchableOpacity>
              </View>

              {isLoading ? (
                  <View style={styles.center}><ActivityIndicator color="#818CF8" /></View>
              ) : (
                  <FlatList
                      ref={flatListRef}
                      data={comments}
                      keyExtractor={(item) => item.id}
                      contentContainerStyle={styles.listContent}
                      ListEmptyComponent={<Text style={styles.emptyText}>Seja o primeiro a comentar!</Text>}
                      renderItem={({ item }) => {
                        const isAuthor = loggedInUser?.id === item.userId;
                        const canDelete = isPhotoOwner || isAuthor;

                        return (
                          <View style={styles.commentItem}>
                              <Image 
                                  source={{ uri: item.user.profile?.imageUrl || 'https://via.placeholder.com/40' }} 
                                  style={styles.avatar} 
                              />
                              <View style={styles.bubble}>
                                  <View style={styles.bubbleHeader}>
                                      <Text style={styles.authorName}>{item.user.name}</Text>
                                      <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
                                  </View>
                                  <Text style={styles.commentText}>{item.content}</Text>
                              </View>

                              {canDelete && (
                                <TouchableOpacity 
                                  onPress={() => handleDeleteConfirm(item.id)}
                                  style={styles.deleteBtn}
                                  disabled={isDeleting}
                                >
                                  <Trash2 size={16} color="#EF4444" />
                                </TouchableOpacity>
                              )}
                          </View>
                        );
                      }}
                  />
              )}

              <View style={styles.inputContainer}>
                  <TextInput
                      style={styles.input}
                      placeholder="Adicionar comentário..."
                      placeholderTextColor="#6B7280"
                      value={newComment}
                      onChangeText={setNewComment}
                  />
                  <TouchableOpacity 
                      style={[styles.sendBtn, (!newComment.trim() || isSending) && styles.disabledBtn]} 
                      onPress={handleSend}
                      disabled={!newComment.trim() || isSending}
                  >
                      {isSending ? <ActivityIndicator size="small" color="#FFF" /> : <Send size={20} color="#FFF" />}
                  </TouchableOpacity>
              </View>
          </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayWrapper: { 
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.6)'
  },
  backdrop: { ...StyleSheet.absoluteFillObject },
  
  sheet: { 
      backgroundColor: '#1F2937', 
      borderTopLeftRadius: 20, 
      borderTopRightRadius: 20, 
      maxHeight: '80%',
      width: '100%',
      overflow: 'hidden'
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#374151' },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  center: { padding: 20 },
  listContent: { padding: 16 },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  
  commentItem: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  bubble: { flex: 1 },
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  authorName: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  timeAgo: { color: '#6B7280', fontSize: 12 },
  commentText: { color: '#D1D5DB', fontSize: 14, lineHeight: 20 },

  deleteBtn: { padding: 8, marginLeft: 4, alignSelf: 'flex-start' },

  inputContainer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#374151', alignItems: 'center', gap: 10, paddingBottom: 30, backgroundColor: '#1F2937' }, 
  input: { flex: 1, backgroundColor: '#374151', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#FFF', borderWidth: 1, borderColor: '#374151' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  disabledBtn: { opacity: 0.5 },
});