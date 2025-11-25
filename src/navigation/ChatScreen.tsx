// mobile/src/navigation/ChatScreen.tsx
import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Image 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- TIPOS E MOCKS (Substitua pelos seus hooks reais) ---
type Tab = 'messages' | 'likes';

// Funções de formatação e URLs
const backendOrigin = 'https://cosmosmatch-backend.onrender.com';
const defaultAvatar = 'https://i.pravatar.cc/300?img=1'; 

const toPublicUrl = (path?: string | null) => {
  if (!path) return defaultAvatar;
  if (/^https?:\/\//i.test(path)) return path;
  return `${backendOrigin}/${path}`;
};

// MOCK: Dados de Login (para Paywall)
const loggedInUserMock = {
    id: 'myId',
    subscription: { status: 'FREE', freeContactsUsed: 4 }, // Paywall Ativo
};

// MOCK: Dados de Conversa (para 3 cenários)
const mockConversations = [
  {
    id: 'c1',
    messages: [{ content: 'Eu acho que a Sinastria é forte entre nós!', createdAt: new Date(Date.now() - 3600000).toISOString(), senderId: 'otherId1' }],
    participants: [{ userId: 'myId', hasUnread: true }, { userId: 'otherId1', user: { name: 'Vênus', profile: { imageUrl: 'https://i.pravatar.cc/300?img=42' } } }],
  },
  {
    id: 'c2',
    messages: [{ content: 'Qual a sua nota no Quiz Comportamental?', createdAt: new Date(Date.now() - 86400000).toISOString(), senderId: 'myId' }],
    participants: [{ userId: 'myId', hasUnread: false }, { userId: 'otherId2', user: { name: 'Marte', profile: { imageUrl: 'https://i.pravatar.cc/300?img=39' } } }],
  },
  {
    id: 'c3', // Conversa Bloqueada (Paywall Ativo + Mensagem Recebida + Contacts > 3)
    messages: [{ content: 'Quero saber mais sobre o seu Caminho de Vida!', createdAt: new Date(Date.now() - 300000).toISOString(), senderId: 'blockedId' }],
    participants: [{ userId: 'myId', hasUnread: true }, { userId: 'blockedId', user: { name: 'Saturno', profile: { imageUrl: null } } }],
  },
];

// MOCK: Lista de Likes Recebidos
const mockLikes = [
    { id: 'l1', name: 'Plutão', profile: { imageUrl: 'https://i.pravatar.cc/300?img=55' } },
    { id: 'l2', name: 'Júpiter', profile: { imageUrl: 'https://i.pravatar.cc/300?img=25' } },
];

const useGetConversations = () => ({ data: mockConversations, isLoading: false, error: null });
const useGetLikesReceived = () => ({ data: mockLikes, isLoading: false, error: null });
const useGetUnreadLikesCount = () => ({ data: { count: 2 } });
const useHideConversation = () => ({ mutate: (id: string) => alert(`Esconder ${id}`), isPending: false });
// --- FIM DOS MOCKS ---


// --- COMPONENTES DE LISTAGEM ---

const MessageItem = React.memo(({ convo }: { convo: typeof mockConversations[0] }) => {
  const navigation = useNavigation();
  const { mutate: hideConversation, isPending: isHiding } = useHideConversation();

  const otherParticipant = convo.participants.find((p) => p.userId !== loggedInUserMock.id);
  if (!otherParticipant) return null;
  const lastMessage = convo.messages[0];
  
  let timeAgo = '';
  if (lastMessage) {
    try {
      timeAgo = formatDistanceToNowStrict(parseISO(lastMessage.createdAt), { addSuffix: true, locale: ptBR });
    } catch (e) {
      console.error('Data inválida', lastMessage.createdAt);
    }
  }

  const myParticipantData = convo.participants.find((p) => p.userId === loggedInUserMock.id);
  const hasUnread = myParticipantData?.hasUnread ?? false;
  const isLastMessageFromOther = lastMessage?.senderId !== loggedInUserMock.id;

  // Lógica do Paywall (Portado do Web)
  const isPaywallActive = loggedInUserMock.subscription.status === 'FREE' && (loggedInUserMock.subscription.freeContactsUsed ?? 0) >= 3;
  const showAsBlocked = isPaywallActive && isLastMessageFromOther;

  const messageContent = lastMessage ? lastMessage.content : '...';
  let textStyle = styles.messageContentDefault;
  if (hasUnread && !showAsBlocked) {
    textStyle = styles.messageContentUnread;
  }
  
  const handleHideClick = useCallback(() => {
     if (isHiding) return;
     Alert.alert(
        'Esconder Conversa', 
        'Tem a certeza de que quer esconder esta conversa? Ela reaparecerá se receber uma nova mensagem.',
        [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Esconder', onPress: () => hideConversation(convo.id), style: 'destructive' }
        ]
     );
  }, [convo.id, isHiding, hideConversation]);

  // Ação ao clicar: Só navega se NÃO estiver bloqueado
  const handlePress = () => {
    if (showAsBlocked) {
        Alert.alert('Ação Bloqueada', 'Você atingiu o limite de contatos gratuitos. Assine o Premium para continuar esta conversa.');
    } else {
        navigation.navigate('ChatConversation' as never, { chatId: convo.id, targetName: otherParticipant.user.name });
    }
  };

  return (
    <View key={convo.id} style={styles.messageRow}>
        
      {/* Área Clicável (Link no Web) */}
      <TouchableOpacity 
        onPress={handlePress}
        style={styles.messageLink}
        activeOpacity={0.8}
        disabled={isHiding}
      >
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: toPublicUrl(otherParticipant.user.profile?.imageUrl) }}
            style={styles.avatarImage}
            onError={(e) => { e.nativeEvent.error = defaultAvatar as any }}
          />
          {hasUnread && !showAsBlocked && (
            <View style={styles.unreadDot} />
          )}
        </View>
        
        <View style={styles.messageContentWrapper}>
          <View style={styles.messageHeader}>
            <Text style={styles.nameText} numberOfLines={1}>
              {otherParticipant.user.name}
            </Text>
            <Text style={styles.timeAgoText}>{timeAgo}</Text>
          </View>
          
          {showAsBlocked ? (
            // CORREÇÃO: Bloqueio visual (Ícone + Texto)
            <View style={styles.blockedContent}>
              <Ionicons name="lock-closed" size={14} color="#C084FC" />
              <Text style={styles.blockedText} numberOfLines={1}>
                {messageContent}
              </Text>
            </View>
          ) : (
            <Text style={textStyle} numberOfLines={1}>
              {messageContent}
            </Text>
          )}
        </View>
      </TouchableOpacity>

      {/* Botão de Esconder/Lixo */}
      <TouchableOpacity
        onPress={handleHideClick}
        style={styles.hideButton}
        aria-label="Esconder conversa"
      >
        <Ionicons name="trash-outline" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );
});


const renderMessagesList = () => {
    const { data: conversations, isLoading: isLoadingConversations, error: conversationsError } = useGetConversations();

    if (isLoadingConversations) {
      return <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>;
    }
    if (conversationsError) {
      return <View style={styles.center}><Text style={styles.errorText}>Erro ao carregar as conversas.</Text></View>;
    }
    if (!conversations || conversations.length === 0) {
      return (
        <View style={styles.center}><Ionicons name="chatbubbles-outline" size={40} color="#9CA3AF" /><Text style={styles.noDataTitle}>Sem conversas</Text><Text style={styles.noDataText}>Quando você enviar ou receber uma mensagem, ela aparecerá aqui.</Text></View>
      );
    }

    return (
      <View style={styles.listContainer}>
        {conversations.map(convo => <MessageItem key={convo.id} convo={convo} />)}
      </View>
    );
};


const renderLikesList = () => {
    const navigation = useNavigation();
    const { data: likesReceived, isLoading: isLoadingLikes, error: likesError } = useGetLikesReceived();
    const { mutate: markAsRead } = useMarkLikesAsRead();
    
    // Marca como lido ao entrar no separador Likes (Lógica do Web)
    React.useEffect(() => {
        if (!isLoadingLikes && likesReceived?.length) {
             markAsRead();
        }
    }, [isLoadingLikes, likesReceived, markAsRead]);
    

    if (isLoadingLikes) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#6366F1" /></View>;
    }
    if (likesError) {
        return <View style={styles.center}><Text style={styles.errorText}>Erro ao carregar os likes.</Text></View>;
    }
    if (!likesReceived || likesReceived.length === 0) {
        return (
            <View style={styles.center}><Ionicons name="heart-outline" size={40} color="#9CA3AF" /><Text style={styles.noDataTitle}>Sem likes ainda</Text><Text style={styles.noDataText}>Quando alguém curtir o seu perfil essa pessoa aparecerá aqui.</Text></View>
        );
    }
    
    return (
        <View style={styles.listContainer}>
            {likesReceived.map((user) => (
            <TouchableOpacity
                key={user.id}
                onPress={() => navigation.navigate('Profile' as never, { userId: user.id })}
                style={styles.likeRow}
            >
                <Image
                source={{ uri: toPublicUrl(user.profile?.imageUrl) }}
                style={styles.likeAvatar}
                />
                <Text style={styles.nameText}>{user.name}</Text>
            </TouchableOpacity>
            ))}
        </View>
    );
};


// --- COMPONENTE PRINCIPAL (ChatScreen) ---
export function ChatScreen() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<Tab>('messages');
  const { data: unreadData } = useGetUnreadLikesCount();
  const unreadCount = unreadData?.count || 0;

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mensagens</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('SearchPage' as never)}
          style={styles.searchButton}
          aria-label="Pesquisar usuários"
        >
          <Ionicons name="search" size={20} color="#D1D5DB" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('messages')}
          style={[styles.tabButton, activeTab === 'messages' && styles.tabActive]}
        >
          <Ionicons name="chatbubbles" size={20} color={activeTab === 'messages' ? '#FFF' : '#9CA3AF'} />
          <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>Mensagens</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('likes')}
          style={[styles.tabButton, activeTab === 'likes' && styles.tabActive]}
        >
          <Ionicons name="heart" size={20} color={activeTab === 'likes' ? '#FFF' : '#9CA3AF'} />
          <Text style={[styles.tabText, activeTab === 'likes' && styles.tabTextActive]}>
            Likes Recebidos
          </Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Conteúdo */}
      <ScrollView style={styles.content}>
        {activeTab === 'messages' ? renderMessagesList() : renderLikesList()}
      </ScrollView>
    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // Gray 900
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  searchButton: {
    padding: 8,
    backgroundColor: '#1F2937',
    borderRadius: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 4,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#6366F1', // Indigo 500
  },
  tabText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginLeft: 5,
  },
  tabTextActive: {
    color: 'white',
  },
  unreadBadge: {
    marginLeft: 5,
    backgroundColor: '#A855F7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  listContainer: {
    gap: 10,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 10,
  },
  messageLink: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    objectFit: 'cover',
    borderWidth: 2,
    borderColor: '#374151',
  },
  unreadDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#6366F1',
    borderWidth: 2,
    borderColor: '#1F2937',
  },
  messageContentWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    maxWidth: '70%',
  },
  timeAgoText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  messageContentDefault: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  messageContentUnread: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  blockedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  blockedText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  hideButton: {
    padding: 8,
    marginLeft: 10,
  },
  // Estilos da lista de Likes
  likeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  likeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#A855F7',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  errorText: {
    color: '#F87171',
    marginTop: 10,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginTop: 10,
  },
  noDataText: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 5,
  }
});