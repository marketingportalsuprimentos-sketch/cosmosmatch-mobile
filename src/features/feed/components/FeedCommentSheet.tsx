import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, 
  KeyboardAvoidingView, Platform, Image, ActivityIndicator, Alert, Keyboard 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../contexts/AuthContext';
import { useGetPostComments, useCommentOnPost, useDeleteComment } from '../hooks/useFeed';
import { useCreateOrGetConversation } from '../../chat/hooks/useChatMutations'; 

export function FeedCommentSheet({ postId, authorId, onClose }: any) {
  const [newComment, setNewComment] = useState('');
  const inputRef = useRef<TextInput>(null);
  const { user: loggedInUser } = useAuth();
  
  const { data: comments, isLoading } = useGetPostComments(postId);
  const { mutate: sendComment, isPending } = useCommentOnPost();
  const { mutate: deleteComment } = useDeleteComment(postId);
  const { mutate: createChat } = useCreateOrGetConversation();

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = () => {
    if (!newComment.trim() || isPending) return;

    sendComment({ postId, content: newComment.trim() }, {
      onSuccess: () => {
        // Envia para o chat (Regra: Comentário vira mensagem)
        createChat({
          targetUserId: authorId,
          content: `Comentou no seu post: "${newComment.trim()}"`,
          contextPostId: postId
        });
        setNewComment('');
        Keyboard.dismiss();
      }
    });
  };

  const confirmDelete = (comment: any) => {
    // Regra: Dono do post apaga todos; Autor apaga o seu
    const canDelete = loggedInUser?.id === authorId || loggedInUser?.id === comment.userId;
    if (canDelete) {
      Alert.alert("Apagar", "Remover este comentário?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Apagar", style: "destructive", onPress: () => deleteComment(comment.id) }
      ]);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.sheetContainer}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comentários</Text>
        <TouchableOpacity onPress={onClose}><Ionicons name="close" size={26} color="white" /></TouchableOpacity>
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.commentItem}>
            <Image source={{ uri: item.user.profile?.imageUrl || 'https://ui-avatars.com/api/?name=U' }} style={styles.avatar} />
            <View style={styles.commentContent}>
              <Text style={styles.userName}>{item.user.name}</Text>
              <Text style={styles.commentText}>{item.content}</Text>
            </View>
            {(loggedInUser?.id === authorId || loggedInUser?.id === item.userId) && (
              <TouchableOpacity onPress={() => confirmDelete(item)}>
                <Ionicons name="trash-outline" size={18} color="#FF4444" />
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={isLoading ? <ActivityIndicator color="#8B5CF6" /> : <Text style={styles.emptyText}>Sem comentários ✨</Text>}
      />

      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="Escreve um comentário..."
          placeholderTextColor="#666"
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity onPress={handleSubmit} disabled={!newComment.trim() || isPending}>
          <Ionicons name="paper-plane" size={24} color={newComment.trim() ? "#8B5CF6" : "#444"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  sheetContainer: { height: '70%', backgroundColor: '#111', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  commentItem: { flexDirection: 'row', marginBottom: 15, gap: 10, alignItems: 'center' },
  avatar: { width: 35, height: 35, borderRadius: 17.5 },
  commentContent: { flex: 1 },
  userName: { color: '#888', fontWeight: 'bold', fontSize: 12 },
  commentText: { color: 'white', fontSize: 14 },
  emptyText: { color: '#555', textAlign: 'center', marginTop: 30 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#222', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 10, marginBottom: Platform.OS === 'ios' ? 20 : 0 },
  input: { flex: 1, color: 'white', fontSize: 16, maxHeight: 100 },
});