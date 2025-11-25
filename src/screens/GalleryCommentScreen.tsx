// mobile/src/screens/GalleryCommentScreen.tsx

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  FlatList,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';

import { Feather, Ionicons } from '@expo/vector-icons'; 
import { useTimeAgo } from '../hooks/useTimeAgo';
import { 
    useGetGalleryPhotoComments, 
    useCommentOnGalleryPhoto 
} from '../hooks/useGalleryHooks'; 
import { useCreateOrGetConversation } from '../hooks/useChatMutations'; // Assume que este hook existe
import type { ProfilePhotoComment, User } from '../types/profile.types';

// --- CONFIGURAÇÃO DA TELA ---

// Definição dos parâmetros esperados ao navegar
type GalleryCommentRouteParams = {
  photoId: string;
  photoUserId: string;
};
type GalleryCommentScreenRouteProp = RouteProp<
  { GalleryCommentScreen: GalleryCommentRouteParams },
  'GalleryCommentScreen'
>;

// Helper para URL de avatar (Ajuste conforme a sua convenção)
const defaultAvatarUri = 'https://i.pravatar.cc/300?img=1'; 

const toPublicUrl = (path: string | null | undefined) => {
  if (!path) return { uri: defaultAvatarUri };
  if (path.startsWith('http')) return { uri: path };
  return { uri: `${path}` }; // Assumindo que o path já é a URL completa ou a convenção local
};


export const GalleryCommentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute<GalleryCommentScreenRouteProp>();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { photoId, photoUserId } = route.params;

  const [newComment, setNewComment] = useState('');
  const flatListRef = useRef<FlatList<ProfilePhotoComment>>(null);

  // Hooks
  const { data: comments = [], isLoading, isError } = useGetGalleryPhotoComments(photoId);
  const { mutate: createComment, isPending: isSendingComment } = useCommentOnGalleryPhoto(photoId);
  // O hook de chat é usado para enviar Icebreaker (Lógica do Web)
  const useCreateOrGetConversationMock = () => ({ 
      mutate: (data: any, options: any) => {
          Alert.alert('Chat Mock', `Abrindo chat com ${data.targetUserId}`);
          options.onSuccess({ id: 'mockChatId', targetUser: { name: 'Chat Mock' } });
      }, 
      isPending: false 
  });
  const { mutate: createOrGetConversation, isPending: isStartingChat } = useCreateOrGetConversationMock();

  // Rola para o final quando a lista é carregada/atualizada
  useEffect(() => {
    if (comments.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100); 
    }
  }, [comments]);


  // --- AÇÕES ---

  const handleCommentSubmit = useCallback(() => {
    if (!newComment.trim() || !currentUser || isSendingComment) return;

    createComment(
      { text: newComment.trim() },
      {
        onSuccess: () => {
          setNewComment('');
        },
        onError: (error) => {
          console.error('Erro ao comentar:', error);
        },
      }
    );
  }, [newComment, createComment, currentUser, isSendingComment]);


  const handleStartChat = useCallback(() => {
    if (!currentUser) return;

    createOrGetConversation(
      { targetUserId: photoUserId, content: 'Olá, gostei muito desta foto!', contextPhotoId: photoId },
      {
        onSuccess: (data) => {
          // Navega para o ecrã de Chat
          navigation.navigate('ChatConversation' as never, { // Assumindo o nome da rota
            chatId: data.id, 
            targetName: data.targetUser.name 
          } as never);
        },
      }
    );
  }, [createOrGetConversation, navigation, photoId, photoUserId, currentUser]);


  // --- RENDERIZAÇÃO DE COMENTÁRIO ÚNICO ---
  const renderComment = ({ item }: { item: ProfilePhotoComment }) => {
    const isMyComment = item.user.id === currentUser?.id;
    const timeAgo = useTimeAgo(item.createdAt);

    return (
      <View style={[
        styles.commentContainer, 
        isMyComment ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }
      ]}>
        {!isMyComment && ( 
             <Image 
                source={toPublicUrl(item.user.profile?.imageUrl)} 
                style={styles.avatar} 
            />
        )}
       
        <View style={[
          styles.commentContent,
          isMyComment ? styles.myCommentContent : styles.otherCommentContent
        ]}>
          <Text style={styles.commentHeader}>
            <Text style={styles.userName}>{item.user.name}</Text>
            <Text style={styles.commentTime}> • {timeAgo}</Text>
          </Text>
          <Text style={isMyComment ? styles.myCommentText : styles.otherCommentText}>
            {item.text}
          </Text>
        </View>
        
        {isMyComment && ( 
            <Image 
                source={toPublicUrl(item.user.profile?.imageUrl)} 
                style={styles.avatar} 
            />
        )}
      </View>
    );
  };


  // --- RENDERIZAÇÃO PRINCIPAL ---
  return (
    <KeyboardAvoidingView
      style={styles.flexOne}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -500}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comentários ({comments.length})</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Feather name="x" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* CONTEÚDO / LISTA DE COMENTÁRIOS */}
      <View style={styles.commentsListWrapper}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#8B5CF6" style={styles.loading} />
        ) : isError ? (
          <Text style={styles.errorText}>Erro ao carregar comentários.</Text>
        ) : comments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={60} color="#6B7280" />
            <Text style={styles.emptyText}>Seja o primeiro a comentar! ✨</Text>
            
            {/* Botão de iniciar chat (se não for o dono da foto) */}
            {currentUser?.id !== photoUserId && (
                <TouchableOpacity onPress={handleStartChat} disabled={isStartingChat} style={styles.startButton}>
                    <Text style={styles.startButtonText}>
                        {isStartingChat ? 'A iniciar...' : 'Mandar um Icebreaker!'}
                    </Text>
                </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={comments}
            renderItem={renderComment}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.flatListContent}
            inverted={false} 
          />
        )}
      </View>

      {/* INPUT / FOOTER */}
      <View style={styles.footer}>
        <TextInput
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Enviar comentário..."
          placeholderTextColor="#9CA3AF"
          style={styles.textInput}
          multiline={true} 
          disabled={isSendingComment}
        />
        <TouchableOpacity
          onPress={handleCommentSubmit}
          disabled={!newComment.trim() || isSendingComment}
          style={styles.sendButton}
        >
          {isSendingComment ? (
             <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Feather name="send" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};


// --- ESTILOS (React Native) ---
const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
    backgroundColor: '#1F2937', // Gray 800 (Fundo do Ecrã)
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#374151', // Gray 700
    paddingTop: Platform.OS === 'android' ? 16 : 50, 
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  closeButton: {
    padding: 8,
  },
  commentsListWrapper: {
    flex: 1,
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#F87171', 
    textAlign: 'center',
    marginTop: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  emptyText: {
    color: '#9CA3AF', 
    fontSize: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  startButton: {
    backgroundColor: '#8B5CF6', 
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  startButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  // Comentários
  commentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    maxWidth: '100%', 
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 8,
    backgroundColor: '#6B7280', 
  },
  commentContent: {
    padding: 8,
    borderRadius: 12,
    flexShrink: 1,
  },
  otherCommentContent: {
    backgroundColor: '#374151', 
    borderTopLeftRadius: 0, 
  },
  myCommentContent: {
    backgroundColor: '#8B5CF6', 
    borderTopRightRadius: 0, 
  },
  commentHeader: {
    marginBottom: 2,
  },
  userName: {
    fontWeight: 'bold',
    color: '#FFF',
    fontSize: 14,
  },
  commentTime: {
    color: '#9CA3AF', 
    fontSize: 12,
  },
  otherCommentText: {
    color: '#D1D5DB', 
    fontSize: 14,
  },
  myCommentText: {
    color: '#FFF', 
    fontSize: 14,
  },
  // Footer / Input
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1F2937', 
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#374151', 
    color: '#FFF',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100, 
    fontSize: 16,
    textAlignVertical: 'top', 
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B5CF6', 
    justifyContent: 'center',
    alignItems: 'center',
  },
});