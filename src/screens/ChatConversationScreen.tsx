import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, 
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Keyboard
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Send, Lock, Star } from 'lucide-react-native';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query'; 
import * as NavigationBar from 'expo-navigation-bar';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../contexts/AuthContext';
import { useGetConversationById } from '../features/chat/hooks/useChatQueries';
import { useSendMessage, useDeleteMessage, useHideMessageForMe } from '../features/chat/hooks/useChatMutations';

export const ChatConversationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const queryClient = useQueryClient(); 
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  const { chatId, targetName, targetPhoto } = route.params;
  const { user, socket } = useAuth(); 
  
  const [newMessage, setNewMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data: conversation, isLoading } = useGetConversationById(chatId);
  const { mutate: sendMessage, isPending: isSending } = useSendMessage();
  const { mutate: deleteMessage } = useDeleteMessage();
  const { mutate: hideMessage } = useHideMessageForMe();

  const isPaywallActive = user?.subscription?.status === 'FREE' && (user?.subscription?.freeContactsUsed ?? 0) >= 3;

  useFocusEffect(
    useCallback(() => {
      const enableImmersiveMode = async () => {
        if (Platform.OS === 'android') {
          try {
            await NavigationBar.setVisibilityAsync('hidden');
            await NavigationBar.setBehaviorAsync('overlay-swipe');
            await NavigationBar.setBackgroundColorAsync('#00000000'); 
          } catch (e) { console.log('Erro barra android', e); }
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
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
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
      Alert.alert(t('chat_options_title'), t('chat_delete_everyone_confirm'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('chat_delete_everyone'), style: 'destructive', onPress: () => deleteMessage(msg.id) }
      ]);
    } else {
      Alert.alert(t('chat_options_title'), t('chat_hide_me_confirm'), [
        { text: t('cancel'), style: 'cancel' },
        { text: t('chat_hide_me'), style: 'destructive', onPress: () => hideMessage({ messageId: msg.id, conversationId: chatId }) }
      ]);
    }
  };

  const renderMessage = ({ item }: any) => {
    const isMe = item.senderId === user?.id;
    const shouldBlur = isPaywallActive && !isMe;

    if (shouldBlur) {
        return (
            <TouchableOpacity style={[styles.bubble, styles.bubbleLeft, styles.blurredBubble]} onPress={() => navigation.navigate('Premium')} activeOpacity={0.8}>
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                    <Lock size={16} color="#A78BFA" />
                    <Text style={styles.blurredTitle}>{t('message_hidden_premium')}</Text>
                </View>
                <Text style={styles.blurredText}>{t('premium_blur_message')}</Text>
            </TouchableOpacity>
        );
    }

    return (
      <TouchableOpacity onLongPress={() => handleMessageLongPress(item)} activeOpacity={0.9} style={[styles.bubble, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
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
            <View style={styles.headerInfo}>
                <Text style={styles.headerName}>{targetName || t('user_default')}</Text>
            </View>
        </View>

        {/* ESTRUTURA CORRIGIDA: KAV Envolve Lista + Input */}
        <KeyboardAvoidingView 
            style={{ flex: 1 }}
            // Android: 'height' para encolher a lista. iOS: 'padding'.
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
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
                        showsVerticalScrollIndicator={false}
                        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                    />
                )}
            </View>

            <View style={{ paddingBottom: Math.max(insets.bottom, 10), backgroundColor: '#111827' }}>
                {isPaywallActive ? (
                    <TouchableOpacity style={styles.premiumFooter} onPress={() => navigation.navigate('Premium')} activeOpacity={0.9}>
                        <Star size={20} color="#FFF" fill="#FFF" />
                        <Text style={styles.premiumFooterText}>{t('premium_blur_footer')}</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder={t('send_message_placeholder')}
                            placeholderTextColor="#6B7280"
                            value={newMessage}
                            onChangeText={setNewMessage}
                            multiline
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={!newMessage.trim() || isSending}>
                            {isSending ? <ActivityIndicator size="small" color="#FFF" /> : <Send size={20} color="#FFF" style={{marginLeft: 2}} />}
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
  headerInfo: { flex: 1 },
  headerName: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  chatArea: { flex: 1, backgroundColor: '#0F172A' },
  listContent: { padding: 15, paddingBottom: 20 },
  bubble: { maxWidth: '80%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, marginBottom: 12 },
  bubbleRight: { alignSelf: 'flex-end', backgroundColor: '#4F46E5', borderBottomRightRadius: 2 },
  bubbleLeft: { alignSelf: 'flex-start', backgroundColor: '#1F2937', borderBottomLeftRadius: 2 },
  blurredBubble: { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderWidth: 1, borderColor: '#8B5CF6', borderStyle: 'dashed', paddingVertical: 15 },
  blurredTitle: { color: '#A78BFA', fontWeight: 'bold', fontSize: 14 },
  blurredText: { color: '#9CA3AF', fontSize: 12, marginTop: 4 },
  messageText: { fontSize: 15, lineHeight: 22, color: '#FFF' },
  timeText: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end', color: 'rgba(255,255,255,0.6)' },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#111827', borderTopWidth: 1, borderTopColor: '#1F2937', alignItems: 'flex-end' },
  input: { flex: 1, backgroundColor: '#374151', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, color: '#FFF', fontSize: 15, marginRight: 10 },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' },
  premiumFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#7C3AED', paddingVertical: 16, margin: 12, borderRadius: 30, gap: 8, elevation: 8 },
  premiumFooterText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});