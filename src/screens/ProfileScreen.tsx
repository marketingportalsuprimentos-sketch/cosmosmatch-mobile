import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert, Dimensions, Modal, TouchableWithoutFeedback, TextInput, KeyboardAvoidingView, Platform, Keyboard
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, MapPin, Pencil, Sparkles, UserPlus, MessageCircle, Ban, ArrowLeft, Check, MoreVertical, LogOut, ShieldAlert, Lock, Calculator, X, Send, Plus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { toast } from '../lib/toast'; 
import { useAuth } from '../contexts/AuthContext'; 
import {
  useGetMyProfile,
  useGetPublicProfile,
  useGetGalleryPhotos,
  useGetFollowers,
  useGetFollowing,
  useAddPhotoToGallery,
  useFollowUser,
  useUnfollowUser,
  useBlockUser
} from '../features/profile/hooks/useProfile';

import { useCreateOrGetConversation } from '../features/chat/hooks/useChatMutations';

import { ProfileGalleryGrid } from '../features/profile/components/ProfileGalleryGrid';
import { BehavioralRadarChart } from '../features/profile/components/BehavioralRadarChart';
import { BehavioralQuizModal } from '../features/profile/components/BehavioralQuizModal';
import { GalleryPhotoViewerModal } from '../features/profile/components/GalleryPhotoViewerModal';

// --- CÁLCULO DA GRADE (GRID) ---
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 8; 
const SCREEN_PADDING_H = 16 * 2; 
const CARD_PADDING_H = 16 * 2;   
const CARD_BORDER_W = 2;         
const AVAILABLE_WIDTH = SCREEN_WIDTH - SCREEN_PADDING_H - CARD_PADDING_H - CARD_BORDER_W;
const AVATAR_CARD_SIZE = Math.floor((AVAILABLE_WIDTH - (GAP * 2)) / 3);
const MAX_CONNECTIONS_HEIGHT = (AVATAR_CARD_SIZE * 2.6) + 60; 

// --- COMPONENTES MODAIS ---

// 1. Modal de Enviar Mensagem
const SendMessageModal = ({ visible, onClose, recipient, onSend, isLoading }: any) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (!message.trim()) return;
        onSend(message); 
    };

    React.useEffect(() => {
        if (!visible) setMessage('');
    }, [visible]);

    if (!visible) return null;

    const avatarUrl = recipient?.imageUrl || recipient?.user?.profile?.imageUrl || 'https://via.placeholder.com/150';
    const name = recipient?.user?.name || recipient?.name || 'Usuário';

    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <KeyboardAvoidingView 
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeaderRow}>
                                <Text style={styles.modalTitle}>Enviar Mensagem</Text>
                                <TouchableOpacity onPress={onClose} disabled={isLoading}>
                                    <X size={24} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.recipientBox}>
                                <Image source={{ uri: avatarUrl }} style={styles.recipientAvatar} />
                                <Text style={styles.recipientText}>Para: <Text style={styles.recipientName}>{name}</Text></Text>
                            </View>

                            <TextInput
                                style={styles.messageInput}
                                placeholder={`Escreva a sua primeira mensagem para ${name}...`}
                                placeholderTextColor="#9CA3AF"
                                multiline
                                textAlignVertical="top"
                                value={message}
                                onChangeText={setMessage}
                                editable={!isLoading}
                            />

                            <TouchableOpacity 
                                style={[styles.btnPrimaryFull, isLoading && { opacity: 0.7 }]} 
                                onPress={handleSend}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#FFF" />
                                ) : (
                                    <>
                                        <Text style={styles.btnText}>Enviar</Text>
                                        <Send size={16} color="#FFF" style={{marginLeft: 8}} />
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

// 2. Modal de Bloqueio
const NatalChartLockModal = ({ visible, onClose, counts, metas }: any) => {
    const navigation = useNavigation<any>();
    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Lock size={48} color="#FBBF24" style={{ marginBottom: 16 }} />
                    <Text style={styles.modalTitle}>Desbloquear Plano Astral</Text>
                    <Text style={styles.modalText}>
                        Para aceder ao seu Plano Astral completo, complete as suas primeiras conexões.
                    </Text>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressRow}>
                            <Text style={styles.progressLabel}>Seguidores</Text>
                            <Text style={[styles.progressValue, counts.followers >= metas.followers ? styles.textGreen : styles.textYellow]}>
                                {counts.followers} / {metas.followers}
                            </Text>
                        </View>
                        <View style={styles.progressRow}>
                            <Text style={styles.progressLabel}>Seguindo</Text>
                            <Text style={[styles.progressValue, counts.following >= metas.following ? styles.textGreen : styles.textYellow]}>
                                {counts.following} / {metas.following}
                            </Text>
                        </View>
                    </View>
                    <TouchableOpacity style={styles.btnPrimaryFull} onPress={() => { onClose(); navigation.navigate('Discovery'); }}>
                        <Text style={styles.btnText}>Encontrar Pessoas</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ marginTop: 12 }} onPress={onClose}>
                        <Text style={{ color: '#9CA3AF' }}>Fechar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// 3. Menu Dropdown
const ProfileMenu = ({ visible, onClose, onLogout, onBlocked }: any) => {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.menuOverlay}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onBlocked(); }}>
               <ShieldAlert size={20} color="#D1D5DB" style={{marginRight: 10}} />
               <Text style={styles.menuText}>Gerenciar Bloqueados</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); if (onLogout) onLogout(); }}>
               <LogOut size={20} color="#EF4444" style={{marginRight: 10}} />
               <Text style={[styles.menuText, {color: '#EF4444'}]}>Sair (Logout)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// --- CARD DE IDENTIDADE ---
const IdentityCard = ({ profile, isOwner, onEdit, onOpenQuiz, myId, onLogout, onMessagePress }: any) => {
    const navigation = useNavigation<any>();
    const [menuVisible, setMenuVisible] = useState(false);
    
    const { mutate: follow } = useFollowUser();
    const { mutate: unfollow } = useUnfollowUser();
    const { mutate: block } = useBlockUser();
    
    const { data: myFollowing } = useGetFollowing(myId);
    const isFollowing = myFollowing?.some((u: any) => u.id === profile.userId);

    const handleToggleFollow = () => {
        if (isFollowing) unfollow(profile.userId);
        else follow(profile.userId);
    };

    const handleBlockPress = () => {
        Alert.alert(
            "Bloquear Usuário",
            "Tem a certeza? Vocês deixarão de ver o conteúdo um do outro.",
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Bloquear", 
                    style: "destructive", 
                    onPress: () => {
                        block(profile.userId);
                        navigation.goBack(); 
                    }
                }
            ]
        );
    };

    const avatarUrl = profile.imageUrl || profile.user?.profile?.imageUrl;

    return (
        <View style={styles.card}>
            <View style={styles.headerAction}>
                {!isOwner ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
                        <ArrowLeft size={24} color="#FFF" />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.iconBtn}>
                        <MoreVertical size={24} color="#9CA3AF" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.avatarContainer}>
                <Image source={{ uri: avatarUrl || 'https://via.placeholder.com/150' }} style={styles.avatar} />
                {isOwner && <TouchableOpacity onPress={onEdit} style={styles.editBadge}><Pencil size={12} color="#FFF" /></TouchableOpacity>}
            </View>
            
            <Text style={styles.name}>{profile.user?.name || 'Usuário'}</Text>
            {profile.currentCity && <View style={styles.locationRow}><MapPin size={14} color="#9CA3AF" /><Text style={styles.locationText}>{profile.currentCity}</Text></View>}
            
            <View style={styles.buttonRow}>
                {isOwner ? (
                    <>
                        <TouchableOpacity style={styles.btnPrimary} onPress={onEdit}><Settings size={18} color="#FFF" /><Text style={styles.btnText}>Editar</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.btnSecondary} onPress={onOpenQuiz}><Sparkles size={18} color="#FFF" /><Text style={styles.btnText}>Sintonia</Text></TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity 
                            style={[styles.btnPrimary, isFollowing && styles.btnOutlined]} 
                            onPress={handleToggleFollow}
                        >
                            {isFollowing ? <Check size={18} color="#FFF" /> : <UserPlus size={18} color="#FFF" />}
                            <Text style={styles.btnText}>{isFollowing ? 'Seguindo' : 'Seguir'}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnGray} onPress={onMessagePress}>
                            <MessageCircle size={18} color="#FFF" />
                            <Text style={styles.btnText}>Mensagem</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.btnIconDanger} onPress={handleBlockPress}>
                            <Ban size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </>
                )}
            </View>

            <ProfileMenu 
                visible={menuVisible} 
                onClose={() => setMenuVisible(false)} 
                onLogout={onLogout} 
                onBlocked={() => navigation.navigate('BlockedProfiles')}
            />
        </View>
    );
};

// --- CONEXÕES EM ÓRBITA (ATUALIZADO COM BOTÃO DE SEGUIR) ---
const ConnectionsCard = ({ userId }: { userId: string }) => {
    const navigation = useNavigation(); 
    const { user: loggedInUser } = useAuth(); // 1. Quem sou eu?
    
    const [activeTab, setActiveTab] = React.useState<'followers' | 'following'>('followers');
    const { data: followers } = useGetFollowers(userId);
    const { data: following } = useGetFollowing(userId);
    const list = activeTab === 'followers' ? followers : following;
    
    const countFollowers = followers?.length || 0;
    const countFollowing = following?.length || 0;

    // 2. Quem eu sigo? (Para saber se mostro + ou Check)
    const { data: myFollowing } = useGetFollowing(loggedInUser?.id);
    // 3. Ação de seguir
    const { mutate: follow } = useFollowUser();
    const { mutate: unfollow } = useUnfollowUser(); // Opcional, se quiser permitir unfollow aqui

    const handleFollowToggle = (targetId: string, isAlreadyFollowing: boolean) => {
        if (isAlreadyFollowing) {
            unfollow(targetId);
        } else {
            follow(targetId);
        }
    };

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Conexão em Órbita</Text>
            <View style={styles.tabsRow}>
                <TouchableOpacity style={[styles.tabItem, activeTab === 'followers' && styles.activeTab]} onPress={() => setActiveTab('followers')}><Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>Seguidores ({countFollowers})</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.tabItem, activeTab === 'following' && styles.activeTab]} onPress={() => setActiveTab('following')}><Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>Seguindo ({countFollowing})</Text></TouchableOpacity>
            </View>
            <View style={{ height: (list && list.length > 3) ? MAX_CONNECTIONS_HEIGHT : 'auto' }}>
                <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                    <View style={styles.grid}>
                        {list && list.length > 0 ? list.map((u: any) => {
                            // Verifica se sou eu mesmo
                            const isMe = loggedInUser?.id === u.id;
                            // Verifica se já sigo essa pessoa
                            const amIFollowing = myFollowing?.some((myF: any) => myF.id === u.id);

                            return (
                                <View key={u.id} style={styles.connectionItemWrapper}>
                                    <TouchableOpacity 
                                        style={styles.connectionItem} 
                                        onPress={() => (navigation as any).push('PublicProfile', { userId: u.id })}
                                    >
                                        <Image source={{ uri: u.profile?.imageUrl || 'https://via.placeholder.com/150' }} style={styles.connectionAvatar} />
                                        <Text style={styles.connectionName} numberOfLines={1}>{u.name ? u.name.split(' ')[0] : 'User'}</Text>
                                    </TouchableOpacity>

                                    {/* BOTÃO DE SEGUIR FLUTUANTE (Só aparece se não for eu) */}
                                    {!isMe && (
                                        <TouchableOpacity 
                                            style={[
                                                styles.followMiniBtn, 
                                                amIFollowing && styles.followingMiniBtn // Estilo diferente se já segue
                                            ]}
                                            onPress={() => handleFollowToggle(u.id, !!amIFollowing)}
                                            activeOpacity={0.8}
                                        >
                                            {amIFollowing ? (
                                                <Check size={10} color="#FFF" strokeWidth={4} />
                                            ) : (
                                                <Plus size={10} color="#FFF" strokeWidth={4} />
                                            )}
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        }) : <Text style={styles.emptyText}>Ninguém aqui ainda.</Text>}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

const AboutCard = ({ bio }: { bio: string }) => (<View style={styles.card}><Text style={styles.cardTitle}>Sobre mim</Text><Text style={styles.bioText}>{bio}</Text></View>);

const CosmicDetailsCard = ({ profile, isOwner, onUnlockPress, isLocked }: any) => {
    const navigation = useNavigation<any>();
    const { natalChart, numerologyMap } = profile;
    const sun = natalChart?.planets?.find((p: any) => p.name === 'Sol')?.sign || '...';
    const moon = natalChart?.planets?.find((p: any) => p.name === 'Lua')?.sign || '...';
    const ascendant = natalChart?.houses?.find((h: any) => h.name === 'Casa 1 (ASC)')?.sign || '...'; 
    const lifePath = numerologyMap?.lifePathNumber || '...';
    const hasNatalChart = !!natalChart;
    const hasNumerology = !!(numerologyMap && numerologyMap.expressionNumber);

    const handleReportClick = (type: 'synastry' | 'numerology') => {
        if (type === 'synastry') navigation.push('SynastryReport', { targetUserId: profile.userId });
        if (type === 'numerology') navigation.push('NumerologyConnection', { targetUserId: profile.userId });
    };

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>Detalhes Cósmicos</Text>
            <View style={styles.astroRow}>
                <View style={styles.astroCol}><Text style={styles.astroLabel}>Sol ☀️</Text><Text style={styles.astroVal}>{sun}</Text></View>
                <View style={styles.astroCol}><Text style={styles.astroLabel}>Lua 🌙</Text><Text style={styles.astroVal}>{moon}</Text></View>
                <View style={styles.astroCol}><Text style={styles.astroLabel}>Ascendente ✨</Text><Text style={styles.astroVal}>{ascendant}</Text></View>
            </View>
            {lifePath !== '...' && (
                 <View style={styles.numerologyRow}>
                    <Text style={styles.astroLabel}>Caminho de Vida 🔢</Text>
                    <Text style={styles.astroVal}>{lifePath}</Text>
                 </View>
            )}
            {!isOwner && (
                <View style={{gap: 8, marginTop: 15}}>
                    <TouchableOpacity 
                        style={[styles.btnPurpleFull, !hasNatalChart && styles.btnDisabled]} 
                        onPress={() => hasNatalChart && handleReportClick('synastry')}
                        disabled={!hasNatalChart}
                    >
                        <Sparkles size={18} color={hasNatalChart ? "#FFF" : "#6B7280"} />
                        <Text style={[styles.btnText, !hasNatalChart && {color: '#6B7280'}]}>Ver Compatibilidade</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.btnPurpleFull, !hasNumerology && styles.btnDisabled]} 
                        onPress={() => hasNumerology && handleReportClick('numerology')}
                        disabled={!hasNumerology}
                    >
                        <Calculator size={18} color={hasNumerology ? "#FFF" : "#6B7280"} />
                        <Text style={[styles.btnText, !hasNumerology && {color: '#6B7280'}]}>Ver Conexão (Numerologia)</Text>
                    </TouchableOpacity>
                    {(!hasNatalChart || !hasNumerology) && <Text style={styles.missingDataText}>Alguns relatórios indisponíveis. O utilizador não preencheu todos os dados.</Text>}
                </View>
            )}
            {isOwner && (
                <TouchableOpacity 
                    style={[styles.btnPurpleFull, {marginTop: 15}, isLocked && styles.btnLocked]} 
                    onPress={isLocked ? onUnlockPress : () => navigation.navigate('NatalChartScreen')}
                >
                     {isLocked && <Lock size={18} color="#FFF" style={{marginRight: 6}} />}
                    <Text style={styles.btnText}>Ver Meu Plano Astral</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { user: loggedInUser, isLoading: authLoading, signOut } = useAuth();
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  
  const [isLockModalOpen, setLockModalOpen] = useState(false);
  const [isMessageModalOpen, setMessageModalOpen] = useState(false);

  const targetUserId = (route.params as any)?.userId || loggedInUser?.id;
  const isOwner = targetUserId === loggedInUser?.id;

  const { data: profileData, isLoading: profileLoading } = isOwner ? useGetMyProfile() : useGetPublicProfile(targetUserId);
  const { data: photosData } = useGetGalleryPhotos(targetUserId);
  const { mutate: addPhoto, isPending: isUploading } = useAddPhotoToGallery();
  
  const { mutate: sendMessage, isPending: isSendingMessage } = useCreateOrGetConversation();

  const handleEdit = () => navigation.navigate('EditProfileScreen' as never);
  const handleLogout = () => { if (signOut) { signOut(); } else { Alert.alert("Erro", "Função de sair indisponível."); } };

  const activePhoto = photosData?.find(p => p.id === selectedPhotoId) || null;

  // --- FUNÇÃO AUXILIAR: ABRIR CÂMERA ---
  const openCamera = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissão necessária", "Precisamos de acesso à sua câmera.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6
      });
      if (!result.canceled) addPhoto(result.assets[0].uri);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível abrir a câmera.");
    }
  };

  // --- FUNÇÃO AUXILIAR: ABRIR GALERIA ---
  const openGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permissão necessária", "Precisamos de acesso à sua galeria.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7
      });
      if (!result.canceled) addPhoto(result.assets[0].uri);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível abrir a galeria.");
    }
  };

  // --- CORREÇÃO DA GALERIA AQUI ---
  const handleAddPhoto = () => {
    if (isUploading) return;

    // Mostra o alerta com opções
    Alert.alert(
      "Adicionar Foto",
      "Escolha a origem da foto",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Tirar Foto", onPress: openCamera },
        { text: "Abrir Galeria", onPress: openGallery }
      ]
    );
  };

  const handleSendMessage = (text: string) => {
      sendMessage(
        { targetUserId: profileData.userId, content: text }, 
        {
          onSuccess: () => {
             toast.success('Mensagem enviada com sucesso!');
             setMessageModalOpen(false); 
          },
          onError: (error: any) => {
             if (error?.response?.status === 402) {
                 Keyboard.dismiss();
                 setMessageModalOpen(false);
             }
          }
        }
      );
  };

  if (authLoading || profileLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#A78BFA" /></View>;
  if (!profileData) return <View style={styles.center}><Text style={{color: '#EF4444'}}>Perfil não encontrado</Text></View>;

  const sunSign = profileData.natalChart?.planets?.find((p: any) => p.name === 'Sol')?.sign || 'Cosmos';
  const MIN_FOLLOWERS = 5;
  const MIN_FOLLOWING = 10;
  const followersCount = profileData.user?._count?.followers ?? 0;
  const followingCount = profileData.user?._count?.following ?? 0;
  const isLocked = isOwner && (followersCount < MIN_FOLLOWERS || followingCount < MIN_FOLLOWING);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {!isOwner && <View style={{height: 10}} />}
      <ScrollView contentContainerStyle={styles.scroll}>
        
        <IdentityCard 
            profile={profileData} 
            isOwner={isOwner} 
            onEdit={handleEdit} 
            onOpenQuiz={() => setIsQuizOpen(true)}
            myId={loggedInUser?.id}
            onLogout={handleLogout}
            onMessagePress={() => setMessageModalOpen(true)} 
        />
        
        {profileData.behavioralAnswers && profileData.behavioralAnswers.length > 0 && (
            <BehavioralRadarChart answers={profileData.behavioralAnswers} sign={sunSign} userId={profileData.userId} isOwner={isOwner} />
        )}
        {profileData.bio && <AboutCard bio={profileData.bio} />}
        
        <CosmicDetailsCard 
            profile={profileData} 
            isOwner={isOwner} 
            isLocked={isLocked}
            onUnlockPress={() => setLockModalOpen(true)}
        />
        
        <ProfileGalleryGrid photos={photosData || []} isOwner={isOwner} onAddPhoto={handleAddPhoto} onPhotoClick={(p) => setSelectedPhotoId(p.id)} profileUserId={targetUserId} />
        <ConnectionsCard userId={targetUserId} />
      </ScrollView>

      {isUploading && <View style={styles.uploadOverlay}><View style={styles.uploadBox}><ActivityIndicator size="large" color="#FFF" /><Text style={styles.uploadText}>Enviando foto...</Text></View></View>}

      <BehavioralQuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} sunSign={sunSign} existingAnswers={profileData.behavioralAnswers} />
      <GalleryPhotoViewerModal photo={activePhoto} onClose={() => setSelectedPhotoId(null)} isOwner={isOwner} profileUserId={targetUserId} />
      
      <NatalChartLockModal 
        visible={isLockModalOpen} 
        onClose={() => setLockModalOpen(false)} 
        counts={{ followers: followersCount, following: followingCount }}
        metas={{ followers: MIN_FOLLOWERS, following: MIN_FOLLOWING }}
      />

      <SendMessageModal 
        visible={isMessageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        recipient={profileData}
        onSend={handleSendMessage}
        isLoading={isSendingMessage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  scroll: { padding: 16, paddingBottom: 80, gap: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  card: { backgroundColor: '#1F2937', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#374151' },
  cardTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  headerAction: { position: 'absolute', top: 16, right: 16, zIndex: 10, flexDirection: 'row' },
  iconBtn: { padding: 4 },
  avatarContainer: { alignSelf: 'center', position: 'relative', marginBottom: 12, marginTop: 10 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#6366F1' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#6366F1', padding: 6, borderRadius: 15, borderWidth: 2, borderColor: '#1F2937' },
  name: { color: '#FFF', fontSize: 22, fontWeight: 'bold', textAlign: 'center' },
  locationRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4, gap: 4 },
  locationText: { color: '#9CA3AF', fontSize: 14 },
  buttonRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  btnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#4F46E5', paddingVertical: 10, borderRadius: 8 },
  btnPrimaryFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#4F46E5', paddingVertical: 12, borderRadius: 8, width: '100%', marginTop: 20 },
  btnOutlined: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#4B5563' },
  btnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#9333EA', paddingVertical: 10, borderRadius: 8 },
  btnGray: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#374151', paddingVertical: 10, borderRadius: 8 },
  btnIcon: { padding: 10, backgroundColor: '#374151', borderRadius: 8 },
  btnIconDanger: { padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.5)' },
  btnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#374151', marginBottom: 16 },
  tabItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#818CF8' },
  tabText: { color: '#9CA3AF', fontWeight: '600' },
  activeTabText: { color: '#818CF8' },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, justifyContent: 'flex-start' },
  
  // --- ESTILOS NOVOS PARA O BOTÃO DE SEGUIR MINI ---
  connectionItemWrapper: { position: 'relative', width: AVATAR_CARD_SIZE, marginBottom: 12 },
  connectionItem: { width: '100%', alignItems: 'center', backgroundColor: '#374151', padding: 8, borderRadius: 8 },
  connectionAvatar: { width: 48, height: 48, borderRadius: 24, marginBottom: 4, backgroundColor: '#4B5563' },
  connectionName: { color: '#FFF', fontSize: 11, textAlign: 'center' },
  
  followMiniBtn: {
    position: 'absolute',
    top: 0,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#4F46E5', // Roxo (Seguir)
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#374151', // Borda da cor do card para separar
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2
  },
  followingMiniBtn: {
    backgroundColor: '#10B981', // Verde (Seguindo)
  },
  
  emptyText: { color: '#6B7280', fontStyle: 'italic' },
  astroRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },
  numerologyRow: { borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 10, marginTop: 5, alignItems: 'center' },
  astroCol: { alignItems: 'center' },
  astroLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 4 },
  astroVal: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  btnPurpleFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#6366F1', padding: 12, borderRadius: 8 },
  btnDisabled: { backgroundColor: '#374151' },
  btnLocked: { backgroundColor: '#374151' },
  bioText: { color: '#D1D5DB', lineHeight: 20 },
  missingDataText: { fontSize: 12, color: '#6B7280', textAlign: 'center', marginTop: 8 },
  
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'flex-end' },
  menuContainer: { width: 220, backgroundColor: '#1F2937', marginTop: 60, marginRight: 20, borderRadius: 12, padding: 8, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 10, elevation: 10, borderWidth: 1, borderColor: '#374151' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8 },
  menuText: { color: '#FFF', fontSize: 14, fontWeight: '500' },
  menuDivider: { height: 1, backgroundColor: '#374151', marginVertical: 4 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', backgroundColor: '#1F2937', borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold' },
  modalText: { color: '#D1D5DB', textAlign: 'center', marginBottom: 20 },
  
  recipientBox: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 16, backgroundColor: '#374151', padding: 8, borderRadius: 8 },
  recipientAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  recipientText: { color: '#D1D5DB' },
  recipientName: { fontWeight: 'bold', color: '#FFF' },
  messageInput: { backgroundColor: '#4B5563', width: '100%', borderRadius: 8, padding: 12, color: '#FFF', height: 120, marginBottom: 16 },

  progressContainer: { width: '100%', gap: 12, marginBottom: 10 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#111827', padding: 12, borderRadius: 8 },
  progressLabel: { color: '#D1D5DB' },
  progressValue: { fontWeight: 'bold' },
  textGreen: { color: '#4ADE80' },
  textYellow: { color: '#FBBF24' },

  uploadOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  uploadBox: { backgroundColor: '#1F2937', padding: 24, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#374151' },
  uploadText: { color: '#FFF', marginTop: 12, fontWeight: 'bold' }
});