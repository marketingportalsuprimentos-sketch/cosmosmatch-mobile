import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, 
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Keyboard, StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Send, Lock, Star } from 'lucide-react-native';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query'; 
// Importando ferramenta para controlar a barra do Android
import * as NavigationBar from 'expo-navigation-bar';

import { useAuth } from '../contexts/AuthContext';
import { useGetConversationById } from '../features/chat/hooks/useChatQueries';
import { useSendMessage, useDeleteMessage, useHideMessageForMe } from '../features/chat/hooks/useChatMutations';

export const ChatConversationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient(); 
  const insets = useSafeAreaInsets();
  
  const { chatId, targetName, targetPhoto } = route.params;
  const { user, socket } = useAuth(); 
  
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data: conversation, isLoading } = useGetConversationById(chatId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: deleteMessage } = useDeleteMessage();
  const { mutate: hideMessage } = useHideMessageForMe();

  const isPaywallActive = user?.subscription?.status === 'FREE' && (user?.subscription?.freeContactsUsed ?? 0) >= 3;

  // --- CORREÇÃO ANDROID: MODO IMERSIVO ---
  useFocusEffect(
    useCallback(() => {
      const enableImmersiveMode = async () => {
        if (Platform.OS === 'android') {
          try {
            // Esconde os botões virtuais para ganhar espaço
            await NavigationBar.setVisibilityAsync('hidden');
            await NavigationBar.setBehaviorAsync('overlay-swipe');
            // Garante que o fundo da barra seja transparente caso ela apareça
            await NavigationBar.setBackgroundColorAsync('#00000000'); 
          } catch (e) {
            console.log('Erro barra android', e);
          }
        }
      };
      enableImmersiveMode();
    }, [])
  );

  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (message: any) => {
      if (message.conversationId === chatId) {
        queryClient.setQueryData(['conversation', chatId], (oldData: any) => {
          if (!oldData) return oldData;
          if (oldData.messages.some((m: any) => m.id === message.id)) return oldData;
          return { ...oldData, messages: [...oldData.messages, message] };
        });
      }
    };
    socket.on('newMessage', handleNewMessage);
    return () => { socket.off('newMessage', handleNewMessage); };
  }, [socket, chatId, queryClient]);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    sendMessage({ conversationId: chatId, content: newMessage.trim() }, {
        onSuccess: () => setNewMessage(''),
        onError: (err: any) => { if (err?.response?.status === 402) Keyboard.dismiss(); }
    });
  };

  const handleMessageLongPress = (msg: any) => {
    const isMe = msg.senderId === user?.id;

    if (isMe) {
      Alert.alert(
        'Opções da Mensagem',
        'Deseja apagar esta mensagem para TODOS?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Apagar para Todos', 
            style: 'destructive',
            onPress: () => deleteMessage(msg.id)
          }
        ]
      );
    } else {
      Alert.alert(
        'Opções da Mensagem',
        'Deseja esconder esta mensagem da sua lista?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { 
            text: 'Esconder para Mim', 
            style: 'destructive',
            onPress: () => hideMessage({ messageId: msg.id, conversationId: chatId })
          }
        ]
      );
    }
  };

  const renderMessage = ({ item }: any) => {
    const isMe = item.senderId === user?.id;
    const shouldBlur = isPaywallActive && !isMe;

    if (shouldBlur) {
        return (
            <TouchableOpacity 
                style={[styles.bubble, styles.bubbleLeft, styles.blurredBubble]}
                onPress={() => navigation.navigate('Premium')}
            >
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <Lock size={16} color="#A78BFA" />
                    <Text style={styles.blurredTitle}>Mensagem Oculta</Text>
                </View>
            </TouchableOpacity>
        );
    }

    return (
      <TouchableOpacity 
        onLongPress={() => handleMessageLongPress(item)}
        delayLongPress={500}
        activeOpacity={0.8}
        style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}
      >
        <Text style={styles.messageText}>{item.content}</Text>
        <Text style={styles.timeText}>{format(new Date(item.createdAt), 'HH:mm')}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <Image source={{ uri: targetPhoto || 'https://via.placeholder.com/100' }} style={styles.avatar} />
            <Text style={styles.headerName}>{targetName || 'Chat'}</Text>
        </View>

        <View style={styles.chatArea}>
            {isLoading && !conversation ? (
                <ActivityIndicator size="large" color="#8B5CF6" style={{marginTop: 20}} />
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={conversation?.messages || []}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={styles.listContent}
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                />
            )}
        </View>

        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            <View style={{ paddingBottom: Math.max(insets.bottom, 20), backgroundColor: '#111827' }}>
                {isPaywallActive ? (
                    <TouchableOpacity 
                        style={styles.premiumFooter} 
                        onPress={() => navigation.navigate('Premium')}
                    >
                        <Star size={20} color="#FFF" fill="#FFF" />
                        <Text style={styles.premiumFooterText}>Assine o Premium</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Mensagem..."
                            placeholderTextColor="#6B7280"
                            value={newMessage}
                            onChangeText={setNewMessage}
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                            {isSending ? <ActivityIndicator size="small" color="#FFF" /> : <Send size={20} color="#FFF" />}
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#111827', borderBottomWidth: 1, borderBottomColor: '#1F2937' },
  backButton: { marginRight: 15 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  headerName: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  chatArea: { flex: 1, backgroundColor: '#0F172A' },
  listContent: { padding: 15, paddingBottom: 20 },
  bubble: { maxWidth: '80%', padding: 10, borderRadius: 8, marginBottom: 12 },
  bubbleRight: { alignSelf: 'flex-end', backgroundColor: '#4F46E5' },
  bubbleLeft: { alignSelf: 'flex-start', backgroundColor: '#1F2937' },
  blurredBubble: { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderWidth: 1, borderColor: '#8B5CF6', borderStyle: 'dashed' },
  blurredTitle: { color: '#A78BFA', fontWeight: 'bold' },
  messageText: { fontSize: 15, color: '#FFF' },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end', color: 'rgba(255,255,255,0.6)' },
  inputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderColor: '#1F2937', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#374151', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, color: '#FFF', marginRight: 10 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' },
  premiumFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#7C3AED', padding: 16, margin: 12, borderRadius: 30, gap: 8 },
  premiumFooterText: { color: '#FFF', fontWeight: 'bold' }
});