import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ActivityIndicator, Alert, Platform 
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'; // Importei useSafeAreaInsets
import { MessageCircle, Heart, Search, Trash2, Lock } from 'lucide-react-native';
import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFocusEffect } from '@react-navigation/native'; 
import * as NavigationBar from 'expo-navigation-bar';

import { useAuth } from '../contexts/AuthContext';
import { useGetConversations } from '../features/chat/hooks/useChatQueries';
import { useGetLikesReceived, useMarkLikesAsRead, useGetUnreadLikesCount } from '../features/profile/hooks/useProfile';
import { useHideConversation } from '../features/chat/hooks/useChatMutations'; 

type Tab = 'messages' | 'likes';

export const ChatListScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState<Tab>('messages');
  const { user } = useAuth();
  const insets = useSafeAreaInsets(); // Hook para medir o topo (relógio)
  
  const { data: conversations, isLoading: loadingChat, refetch: refetchChats } = useGetConversations();
  const { data: likes, isLoading: loadingLikes, refetch: refetchLikes } = useGetLikesReceived();
  const { data: unreadLikesData } = useGetUnreadLikesCount();
  
  const { mutate: markAsRead } = useMarkLikesAsRead();
  const { mutate: hideConversation } = useHideConversation();

  // --- MODO IMERSIVO ---
  useFocusEffect(
    useCallback(() => {
      const enableImmersiveMode = async () => {
        if (Platform.OS === 'android') {
          try {
            await NavigationBar.setVisibilityAsync('hidden');
            await NavigationBar.setBehaviorAsync('overlay-swipe');
            await NavigationBar.setBackgroundColorAsync('#00000000'); 
          } catch (e) {
            console.log('Erro barra android chat list', e);
          }
        }
      };
      enableImmersiveMode();
      refetchChats();
      refetchLikes();
    }, [refetchChats, refetchLikes])
  );

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    if (tab === 'likes') {
        markAsRead();
    }
  };

  const handleDeleteChat = (id: string) => {
    Alert.alert(
      'Esconder Conversa', 
      'Tem a certeza de que quer esconder esta conversa? Ela reaparecerá se receber uma nova mensagem.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Esconder', style: 'destructive', onPress: () => hideConversation(id) }
      ]
    );
  };

  const renderMessageItem = ({ item }: any) => {
    const otherParticipant = item.participants.find((p: any) => p.userId !== user?.id);
    if (!otherParticipant) return null;

    const lastMsg = item.messages[0];
    const timeAgo = lastMsg ? formatDistanceToNowStrict(new Date(lastMsg.createdAt), { addSuffix: true, locale: ptBR }) : '';
    
    const isPaywallActive = user?.subscription?.status === 'FREE' && (user?.subscription?.freeContactsUsed ?? 0) >= 3;
    const isLastMsgFromOther = lastMsg?.senderId !== user?.id;
    const showAsBlocked = isPaywallActive && isLastMsgFromOther;

    return (
      <View style={styles.card}>
        <TouchableOpacity 
            style={styles.cardContent}
            onPress={() => navigation.navigate('ChatConversation', { 
                chatId: item.id, targetName: otherParticipant.user.name, targetPhoto: otherParticipant.user.profile?.imageUrl 
            })}
        >
            <View style={styles.avatarContainer}>
                <Image source={{ uri: otherParticipant.user.profile?.imageUrl || 'https://via.placeholder.com/150' }} style={styles.avatar} />
                {!showAsBlocked && <View style={styles.onlineIndicator} />}
            </View>
            <View style={styles.textContainer}>
                <View style={styles.topRow}>
                    <Text style={styles.name} numberOfLines={1}>{otherParticipant.user.name}</Text>
                    <Text style={styles.time}>{timeAgo}</Text>
                </View>
                {showAsBlocked ? (
                    <View style={styles.blurRow}>
                        <Lock size={14} color="#A78BFA" />
                        <Text style={styles.blurText}>Mensagem Oculta (Premium)</Text>
                    </View>
                ) : (
                    <Text style={styles.messagePreview} numberOfLines={1}>{lastMsg?.content || 'Inicie a conversa...'}</Text>
                )}
            </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteChat(item.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Trash2 size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderLikeItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('PublicProfile', { userId: item.id })}>
        <Image source={{ uri: item.profile?.imageUrl || 'https://via.placeholder.com/150' }} style={[styles.avatar, { borderColor: '#A78BFA', borderWidth: 2 }]} />
        <View style={styles.textContainer}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={[styles.messagePreview, {color: '#A78BFA'}]}>Curtiu seu perfil!</Text>
        </View>
        <Heart size={24} color="#A78BFA" fill="#A78BFA" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER COM PADDING DINÂMICO (Correção aqui) */}
      <View style={[
          styles.header, 
          { paddingTop: Platform.OS === 'android' ? insets.top + 10 : 15 } 
      ]}>
        <Text style={styles.headerTitle}>Mensagens</Text>
        {/* Botão de busca agora leva para a tela de pesquisa */}
        <TouchableOpacity style={styles.searchButton} onPress={() => navigation.navigate('SearchUsers')}>
            <Search size={20} color="#D1D5DB" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'messages' && styles.activeTab]} onPress={() => handleTabChange('messages')}>
            <MessageCircle size={18} color={activeTab === 'messages' ? '#FFF' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>Mensagens</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'likes' && styles.activeTab]} onPress={() => handleTabChange('likes')}>
            <Heart size={18} color={activeTab === 'likes' ? '#FFF' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'likes' && styles.activeTabText]}>Likes</Text>
            {(unreadLikesData?.count || 0) > 0 && ( <View style={styles.counterBadge}><Text style={styles.counterText}>{unreadLikesData?.count}</Text></View> )}
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {activeTab === 'messages' ? (
            loadingChat ? <ActivityIndicator color="#A78BFA" style={{marginTop: 50}} /> : 
            <FlatList data={conversations || []} keyExtractor={item => item.id} renderItem={renderMessageItem} contentContainerStyle={styles.listContent} ListEmptyComponent={<View style={styles.emptyState}><MessageCircle size={48} color="#374151" /><Text style={styles.emptyTitle}>Sem conversas</Text><Text style={styles.emptyText}>Suas conexões aparecerão aqui.</Text></View>} />
        ) : (
            loadingLikes ? <ActivityIndicator color="#A78BFA" style={{marginTop: 50}} /> : 
            <FlatList data={likes || []} keyExtractor={item => item.id} renderItem={renderLikeItem} contentContainerStyle={styles.listContent} ListEmptyComponent={<View style={styles.emptyState}><Heart size={48} color="#374151" /><Text style={styles.emptyTitle}>Sem likes ainda</Text><Text style={styles.emptyText}>Capriche no perfil para atrair conexões!</Text></View>} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  // Header não tem padding fixo no topo mais, é dinâmico no componente
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  searchButton: { padding: 10, backgroundColor: '#1F2937', borderRadius: 20 },
  tabsContainer: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#374151', marginBottom: 10 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#8B5CF6' },
  tabText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  activeTabText: { color: '#FFF' },
  counterBadge: { backgroundColor: '#7C3AED', paddingHorizontal: 6, borderRadius: 10, height: 18, justifyContent: 'center' },
  counterText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  content: { flex: 1 },
  listContent: { padding: 15, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 12, padding: 12, marginBottom: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  cardContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#374151' },
  onlineIndicator: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#10B981', borderWidth: 2, borderColor: '#1F2937' },
  textContainer: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  time: { color: '#6B7280', fontSize: 12 },
  messagePreview: { color: '#9CA3AF', fontSize: 14 },
  blurRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  blurText: { color: '#6B7280', fontSize: 13, fontStyle: 'italic' },
  deleteButton: { padding: 10, marginLeft: 5 },
  emptyState: { alignItems: 'center', justifyContent: 'center', marginTop: 50, opacity: 0.7 },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginTop: 10 },
  emptyText: { color: '#9CA3AF', fontSize: 14, marginTop: 5 }
});