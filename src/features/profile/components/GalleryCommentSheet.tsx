import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Image, KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard 
} from 'react-native';
import { X, Send } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native'; // <--- IMPORTADO
import { useGetGalleryPhotoComments, useCommentOnGalleryPhoto } from '../hooks/useProfile';
import { useTimeAgo } from '../../../hooks/useTimeAgo';

interface GalleryCommentSheetProps {
  photoId: string | null;
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string;
}

export const GalleryCommentSheet = ({ photoId, isOpen, onClose, targetUserId }: GalleryCommentSheetProps) => {
  const [newComment, setNewComment] = useState('');
  const navigation = useNavigation<any>(); // <--- Hook de Navegação
  
  if (!isOpen || !photoId) return null;

  const { data: comments, isLoading } = useGetGalleryPhotoComments(photoId);
  const { mutate: sendComment, isPending: isSending } = useCommentOnGalleryPhoto(targetUserId);
  
  const { timeAgo } = useTimeAgo();

  const handleSend = () => {
    if (!newComment.trim()) return;
    sendComment({ photoId, content: newComment }, {
        onSuccess: () => setNewComment(''),
        // --- CORREÇÃO: Ordem Segura ---
        onError: (error: any) => {
            if (error?.response?.status === 402) {
                Keyboard.dismiss(); // 1. Fecha Teclado
                onClose(); // 2. Fecha a Folha de Comentários
                
                // 3. Navega para Premium com um leve delay para garantir que a UI limpou
                setTimeout(() => {
                    navigation.navigate('Premium');
                }, 300);
            }
        }
    });
  };

  return (
    <View style={styles.overlayWrapper}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
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
                    data={comments}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.emptyText}>Seja o primeiro a comentar!</Text>}
                    renderItem={({ item }) => (
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
                        </View>
                    )}
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
  );
};

const styles = StyleSheet.create({
  overlayWrapper: { 
      position: 'absolute', 
      top: 0, left: 0, right: 0, bottom: 0, 
      zIndex: 100, 
      justifyContent: 'flex-end' 
  },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  
  sheet: { 
      backgroundColor: '#1F2937', 
      borderTopLeftRadius: 20, 
      borderTopRightRadius: 20, 
      maxHeight: '80%',
      width: '100%'
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#374151' },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  center: { padding: 20 },
  listContent: { padding: 16 },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
  
  commentItem: { flexDirection: 'row', marginBottom: 16 },
  avatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  bubble: { flex: 1 },
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  authorName: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  timeAgo: { color: '#6B7280', fontSize: 12 },
  commentText: { color: '#D1D5DB', fontSize: 14, lineHeight: 20 },

  inputContainer: { flexDirection: 'row', padding: 16, borderTopWidth: 1, borderTopColor: '#374151', alignItems: 'center', gap: 10, paddingBottom: 30 }, 
  input: { flex: 1, backgroundColor: '#374151', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#FFF' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  disabledBtn: { opacity: 0.5 },
});