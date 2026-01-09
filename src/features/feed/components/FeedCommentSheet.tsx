import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, 
  KeyboardAvoidingView, Platform, ActivityIndicator, Keyboard, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Modal from 'react-native-modal'; 
import { useNavigation } from '@react-navigation/native'; // Adicionado para navegar para o Premium
import { useGetPostComments, useCommentOnPost, useDeleteComment } from '../hooks/useFeed';
import { useCreateOrGetConversation } from '../../chat/hooks/useChatMutations'; 
import { useAuth } from '../../../contexts/AuthContext';

interface FeedCommentSheetProps {
  isVisible: boolean;
  onClose: () => void;
  postId: string;
  authorId: string; 
}

export function FeedCommentSheet({ isVisible, onClose, postId, authorId }: FeedCommentSheetProps) {
  const navigation = useNavigation<any>(); // Hook de navegação
  const [commentText, setCommentText] = useState('');
  const { user: loggedInUser } = useAuth();
  const inputRef = useRef<TextInput>(null);
  
  // Hooks
  const { data: comments, isLoading } = useGetPostComments(postId);
  const { mutate: postComment, isPending } = useCommentOnPost();
  const { mutate: deleteComment } = useDeleteComment();
  const { mutate: createChat } = useCreateOrGetConversation();

  // Verifica se o utilizador é Premium [cite: 2025-11-14]
  const isPremium = loggedInUser?.subscriptionStatus === 'ACTIVE' || loggedInUser?.role === 'ADMIN';

  useEffect(() => {
    if (isVisible) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isVisible]);

  const handleSend = () => {
    const trimmedContent = commentText.trim();
    if (!trimmedContent || isPending) return;

    // BLOQUEIO PREMIUM PREVENTIVO
    // Se não for Premium, fecha o modal de comentários e abre o Premium antes de enviar nada
    if (!isPremium) {
      Keyboard.dismiss();
      onClose(); // Fecha o balão de comentários
      setTimeout(() => {
        navigation.navigate('Premium'); // Abre a página Premium
      }, 300);
      return; // Interrompe o envio aqui
    }

    // Se for Premium, prossegue com o envio normal
    postComment(
      { postId, content: trimmedContent }, 
      {
        onSuccess: () => { 
          if (loggedInUser?.id !== authorId) {
            createChat({
              targetUserId: authorId,
              content: `Comentou no seu post: "${trimmedContent}"`,
            });
          }
          setCommentText(''); 
          Keyboard.dismiss();
        },
        onError: (error: any) => { 
          console.log("❌ Erro ao comentar:", error.response?.data);
          Alert.alert("Erro", "Não foi possível enviar o comentário.");
        }
      }
    );
  };

  const renderComment = ({ item }: any) => {
    const canDelete = loggedInUser?.id === authorId || loggedInUser?.id === item.userId;
    return (
      <View style={styles.commentItem}>
         <Image source={{ uri: item.user?.profile?.imageUrl || 'https://ui-avatars.com/api/?name=U' }} style={styles.avatar} />
         <View style={styles.commentBubble}>
            <Text style={styles.commentAuthor}>{item.user?.name || 'Utilizador'}</Text>
            <Text style={styles.commentText}>{item.content}</Text>
         </View>
         {canDelete && (
             <TouchableOpacity 
               onPress={() => {
                 Alert.alert("Apagar", "Remover este comentário?", [
                   { text: "Cancelar", style: "cancel" },
                   { text: "Apagar", style: "destructive", onPress: () => deleteComment(item.id) }
                 ]);
               }} 
               style={styles.deleteBtn}
             >
                 <Ionicons name="trash-outline" size={18} color="#EF4444" />
             </TouchableOpacity>
         )}
      </View>
    );
  };

  return (
    <Modal isVisible={isVisible} onBackdropPress={onClose} style={styles.modal} avoidKeyboard={true}>
      <View style={styles.container}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={styles.header}>
             <View style={styles.handle} />
             <Text style={styles.title}>Comentários</Text>
             <TouchableOpacity onPress={onClose} style={styles.closeBtn}><Ionicons name="close" size={24} color="#9CA3AF" /></TouchableOpacity>
          </View>

          <FlatList
            data={comments || []} 
            keyExtractor={(item) => item.id} 
            renderItem={renderComment}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>Sem comentários ainda.</Text> : null}
          />

          <View style={styles.footer}>
             <TextInput
               ref={inputRef}
               style={styles.input}
               placeholder="Escreve um comentário..."
               placeholderTextColor="#6B7280"
               value={commentText} 
               onChangeText={setCommentText} 
               multiline
               maxLength={280}
             />
             <TouchableOpacity 
               style={[styles.sendBtn, !commentText.trim() && { opacity: 0.5 }]} 
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
  container: { backgroundColor: '#111827', height: '70%', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  header: { alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  handle: { width: 40, height: 4, backgroundColor: '#374151', borderRadius: 2, marginBottom: 10 },
  title: { color: 'white', fontWeight: 'bold' },
  closeBtn: { position: 'absolute', right: 15, top: 15 },
  commentItem: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
  commentBubble: { flex: 1, backgroundColor: '#1F2937', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#374151' },
  commentAuthor: { color: '#9CA3AF', fontSize: 12, marginBottom: 2 },
  commentText: { color: 'white', fontSize: 14 },
  footer: { flexDirection: 'row', padding: 15, borderTopWidth: 1, borderTopColor: '#374151', paddingBottom: Platform.OS === 'ios' ? 40 : 15, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#1F2937', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, color: 'white', maxHeight: 100 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  deleteBtn: { padding: 8 }
});