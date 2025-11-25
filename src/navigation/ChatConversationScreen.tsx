import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

import { useAuth } from '../hooks/useAuth';
import { useGetConversationById } from '../features/chat/hooks/useChatQueries'; 
import { useSendMessage, useDeleteMessage } from '../features/chat/hooks/useChatMutations'; 
import type { Message } from '../features/chat/services/chatApi';

// Tipagem de rotas
type ChatRouteParams = {
  chatId: string;
  targetName: string;
  targetUserId?: string;
};

type ChatRouteProp = RouteProp<Record<string, ChatRouteParams>, 'ChatConversation'>;

const defaultAvatar = 'https://via.placeholder.com/150/374151/FFFFFF?text=U';
const toPublicUrl = (path?: string | null) => path || defaultAvatar;


// --- BOLHA DE MENSAGEM ---
interface ChatBubbleProps {
  message: Message;
  isMine: boolean;
  onLongPress: (message: Message) => void;
}

const ChatBubble = React.memo(({ message, isMine, onLongPress }: ChatBubbleProps) => {
  const content = message.content; 
  const time = format(new Date(message.createdAt), 'HH:mm');

  return (
    <TouchableOpacity
      onLongPress={() => isMine && onLongPress(message)}
      activeOpacity={0.9}
      style={[
        styles.messageWrapper,
        isMine ? styles.myMessageWrapper : styles.theirMessageWrapper,
      ]}
    >
      <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
        <Text style={[styles.messageText, isMine ? { color: '#FFF' } : { color: '#E5E7EB' }]}>
          {content}
        </Text>
        <Text style={[styles.timeText, isMine ? { color: 'rgba(255,255,255,0.7)' } : { color: '#6B7280' }]}>
          {time}
        </Text>
      </View>
    </TouchableOpacity>
  );
});


// --- TELA DE CONVERSA ---
export function ChatConversationScreen() {
  const navigation = useNavigation();
  const route = useRoute<ChatRouteProp>();
  const { chatId, targetName, targetUserId } = route.params;
  const { user: loggedInUser } = useAuth();

  const [newMessage, setNewMessage] = useState('');
  
  // Buscar dados REAIS do backend
  const { 
      data: conversation, 
      isLoading, 
      isError, 
      refetch 
  } = useGetConversationById(chatId); 
  
  useEffect(() => {
      const interval = setInterval(() => refetch(), 3000);
      return () => clearInterval(interval);
  }, [refetch]);

  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: deleteMessage } = useDeleteMessage();

  // --- LÓGICA PARA PEGAR A FOTO ---
  const targetParticipantInfo = useMemo(() => {
    if (!conversation) return null;
    return conversation.participants.find(p => p.userId !== loggedInUser?.id)?.user;
  }, [conversation, loggedInUser]);

  const avatarUrl = targetParticipantInfo?.profile?.imageUrl;
  // --------------------------------

  const messagesReversed = useMemo(() => {
      if (!conversation?.messages) return [];
      return [...conversation.messages].reverse(); 
  }, [conversation?.messages]);

  const handleSend = useCallback(() => {
    if (!newMessage.trim() || isSending) return;

    sendMessage({ conversationId: chatId, content: newMessage }, {
        onSuccess: () => {
            setNewMessage('');
            refetch(); 
        },
        onError: () => Alert.alert('Erro', 'Falha ao enviar mensagem.')
    });
  }, [newMessage, isSending, chatId, sendMessage, refetch]);

  const handleLongPress = useCallback((message: Message) => {
    Alert.alert(
        'Opções',
        'O que deseja fazer?',
        [
            {
                text: 'Apagar Mensagem',
                onPress: () => deleteMessage(message.id),
                style: 'destructive'
            },
            { text: 'Cancelar', style: 'cancel' }
        ]
    );
  }, [deleteMessage]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A78BFA" />
      </View>
    );
  }

  if (isError || !conversation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Conversa não encontrada.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0} 
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{targetName}</Text>
            <Text style={styles.headerStatus}>Online agora</Text> 
        </View>

        <TouchableOpacity 
            onPress={() => targetUserId && navigation.navigate('ProfileTab', { screen: 'PublicProfile', params: { userId: targetUserId }})}
            style={styles.profileButton}
        >
             {avatarUrl ? (
                <Image 
                    source={{ uri: toPublicUrl(avatarUrl) }} 
                    style={styles.headerAvatar} 
                />
             ) : (
                <Ionicons name="person-circle" size={45} color="#A78BFA" />
             )}
        </TouchableOpacity>
      </View>

      {/* Lista de Mensagens */}
      <FlatList
        data={messagesReversed}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatBubble 
            message={item}
            isMine={item.senderId === loggedInUser?.id}
            onLongPress={handleLongPress}
          />
        )}
        inverted 
        contentContainerStyle={styles.listContent}
      />

      {/* Input Bar (AJUSTADA PARA SUBIR MAIS) */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escreva uma mensagem..."
          placeholderTextColor="#6B7280"
          value={newMessage}
          onChangeText={setNewMessage}
          multiline
        />
        <TouchableOpacity 
            style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]} 
            onPress={handleSend}
            disabled={!newMessage.trim() || isSending}
        >
            {isSending ? <ActivityIndicator color="#FFF" size="small" /> : <Ionicons name="send" size={20} color="#FFF" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#111827' },
    loadingContainer: { flex: 1, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
    errorText: { color: '#EF4444' },

    header: { 
        flexDirection: 'row', alignItems: 'center', 
        paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15, 
        backgroundColor: '#1F2937', borderBottomWidth: 1, borderBottomColor: '#374151' 
    },
    backBtn: { padding: 5 },
    headerInfo: { flex: 1, marginLeft: 15 },
    headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    headerStatus: { color: '#10B981', fontSize: 12 },
    
    profileButton: { paddingLeft: 10 },
    headerAvatar: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: '#A78BFA' },

    listContent: { paddingHorizontal: 15, paddingVertical: 20 },
    
    messageWrapper: { marginVertical: 4, maxWidth: '80%' },
    myMessageWrapper: { alignSelf: 'flex-end' },
    theirMessageWrapper: { alignSelf: 'flex-start' },

    bubble: { padding: 12, borderRadius: 16 },
    myBubble: { backgroundColor: '#7C3AED', borderBottomRightRadius: 2 },
    theirBubble: { backgroundColor: '#374151', borderBottomLeftRadius: 2 },

    messageText: { fontSize: 16 },
    timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },

    // --- AJUSTE DE ALTURA DA BARRA DE INPUT ---
    inputContainer: { 
        flexDirection: 'row', alignItems: 'center', 
        paddingHorizontal: 10,
        paddingTop: 10, 
        paddingBottom: 30, // AUMENTADO PARA SUBIR O RODAPÉ
        backgroundColor: '#1F2937', 
        borderTopWidth: 1, 
        borderTopColor: '#374151' 
    },
    input: { 
        flex: 1, backgroundColor: '#374151', borderRadius: 20, 
        paddingHorizontal: 15, paddingVertical: 10, color: '#FFF', maxHeight: 100 
    },
    sendBtn: { 
        marginLeft: 10, width: 44, height: 44, borderRadius: 22, 
        backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' 
    },
    sendBtnDisabled: { backgroundColor: '#4B5563' }
});