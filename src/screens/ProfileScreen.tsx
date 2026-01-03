// mobile/src/screens/ProfileScreen.tsx
import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert, Dimensions, Modal, TouchableWithoutFeedback, TextInput, KeyboardAvoidingView, Platform, Keyboard, Linking, RefreshControl 
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Settings, MapPin, Pencil, Sparkles, UserPlus, MessageCircle, Ban, ArrowLeft, Check, MoreVertical, LogOut, ShieldAlert, Lock, Calculator, X, Send, Plus, 
  FileText, Shield, Trash2 
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';

import { toast } from '../lib/toast'; 
import { useAuth } from '../contexts/AuthContext'; 
import { api } from '../services/api'; 
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GAP = 8; 
const SCREEN_PADDING_H = 16 * 2; 
const CARD_PADDING_H = 16 * 2;   
const CARD_BORDER_W = 2;         
const AVAILABLE_WIDTH = SCREEN_WIDTH - SCREEN_PADDING_H - CARD_PADDING_H - CARD_BORDER_W;
const AVATAR_CARD_SIZE = Math.floor((AVAILABLE_WIDTH - (GAP * 2)) / 3);
const MAX_CONNECTIONS_HEIGHT = (AVATAR_CARD_SIZE * 2.6) + 60; 

// --- NOVO MODAL DE EXCLUSÃO (CORRIGIDO CRASH DE ÍCONE) ---
const DeleteAccountModal = ({ visible, onClose, onConfirm, isLoading }: any) => {
    // Usamos Trash2 aqui pois sabemos que ele existe e não vai quebrar o app
    if (!visible) return null;

    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.iconCircleRed}>
                        <Trash2 size={32} color="#EF4444" />
                    </View>
                    
                    <Text style={styles.modalTitleDanger}>Excluir conta</Text>
                    
                    <Text style={styles.modalText}>
                        Tem certeza? Sua conta ficará em quarentena e poderá ser reativada fazendo login novamente dentro do prazo de 30 dias.
                    </Text>

                    <View style={{ width: '100%', gap: 10, marginTop: 10 }}>
                        <TouchableOpacity 
                            style={[styles.btnDangerFull, isLoading && { opacity: 0.7 }]} 
                            onPress={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.btnTextBold}>Sim, excluir minha conta</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.btnGrayFull} 
                            onPress={onClose}
                            disabled={isLoading}
                        >
                            <Text style={styles.btnText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const SendMessageModal = ({ visible, onClose, recipient, onSend, isLoading }: any) => {
    const { t } = useTranslation();
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (!message.trim()) return;
        onSend(message); 
    };

    React.useEffect(() => { if (!visible) setMessage(''); }, [visible]);

    if (!visible) return null;
    const avatarUrl = recipient?.imageUrl || recipient?.user?.profile?.imageUrl || 'https://via.placeholder.com/150';
    const name = recipient?.user?.name || recipient?.name || t('user_default');

    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeaderRow}>
                                <Text style={styles.modalTitle}>{t('send_message_title')}</Text>
                                <TouchableOpacity onPress={onClose} disabled={isLoading}><X size={24} color="#9CA3AF" /></TouchableOpacity>
                            </View>
                            <View style={styles.recipientBox}>
                                <Image source={{ uri: avatarUrl }} style={styles.recipientAvatar} />
                                <Text style={styles.recipientText}>{t('to')}: <Text style={styles.recipientName}>{name}</Text></Text>
                            </View>
                            <TextInput style={styles.messageInput} placeholder={t('send_message_placeholder_name', {name})} placeholderTextColor="#9CA3AF" multiline textAlignVertical="top" value={message} onChangeText={setMessage} editable={!isLoading} />
                            <TouchableOpacity style={[styles.btnPrimaryFull, isLoading && { opacity: 0.7 }]} onPress={handleSend} disabled={isLoading}>
                                {isLoading ? <ActivityIndicator size="small" color="#FFF" /> : <><Text style={styles.btnText}>{t('send')}</Text><Send size={16} color="#FFF" style={{marginLeft: 8}} /></>}
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const NatalChartLockModal = ({ visible, onClose, counts, metas }: any) => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    if (!visible) return null;
    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Lock size={48} color="#FBBF24" style={{ marginBottom: 16 }} />
                    <Text style={styles.modalTitle}>{t('unlock_astral_plan')}</Text>
                    <Text style={styles.modalText}>{t('unlock_astral_plan_desc')}</Text>
                    <View style={styles.progressContainer}>
                        <View style={styles.progressRow}><Text style={styles.progressLabel}>{t('followers')}</Text><Text style={[styles.progressValue, counts.followers >= metas.followers ? styles.textGreen : styles.textYellow]}>{counts.followers} / {metas.followers}</Text></View>
                        <View style={styles.progressRow}><Text style={styles.progressLabel}>{t('following')}</Text><Text style={[styles.progressValue, counts.following >= metas.following ? styles.textGreen : styles.textYellow]}>{counts.following} / {metas.following}</Text></View>
                    </View>
                    <TouchableOpacity style={styles.btnPrimaryFull} onPress={() => { onClose(); navigation.navigate('DiscoveryTab'); }}><Text style={styles.btnText}>{t('find_people')}</Text></TouchableOpacity>
                    <TouchableOpacity style={{ marginTop: 12 }} onPress={onClose}><Text style={{ color: '#9CA3AF' }}>{t('close')}</Text></TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

// --- MENU (CORRIGIDO TEXTO "EXCLUIR CONTA") ---
const ProfileMenu = ({ visible, onClose, onLogout, onBlocked, onDeleteAccount }: any) => {
  const { t } = useTranslation();
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.menuOverlay}>
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); onBlocked(); }}>
                <ShieldAlert size={20} color="#D1D5DB" style={{marginRight: 10}} />
                <Text style={styles.menuText}>{t('manage_blocked')}</Text>
            </TouchableOpacity>
            
            <View style={styles.menuDivider} />

            <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); Linking.openURL('https://cosmosmatch-frontend.vercel.app/terms'); }}>
                <FileText size={20} color="#D1D5DB" style={{marginRight: 10}} />
                <Text style={styles.menuText}>Termos de Uso</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); Linking.openURL('https://cosmosmatch-frontend.vercel.app/privacy'); }}>
                <Shield size={20} color="#D1D5DB" style={{marginRight: 10}} />
                <Text style={styles.menuText}>Política de Privacidade</Text>
            </TouchableOpacity>

            <View style={styles.menuDivider} />
            
            <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); if (onLogout) onLogout(); }}>
                <LogOut size={20} color="#EF4444" style={{marginRight: 10}} />
                <Text style={[styles.menuText, {color: '#EF4444'}]}>{t('logout')}</Text>
            </TouchableOpacity>

             {/* TEXTO FORÇADO EM PORTUGUÊS PARA EVITAR ERRO DE TRADUÇÃO */}
             <TouchableOpacity style={styles.menuItem} onPress={() => { onClose(); if (onDeleteAccount) onDeleteAccount(); }}>
                <Trash2 size={20} color="#EF4444" style={{marginRight: 10}} />
                <Text style={[styles.menuText, {color: '#EF4444', fontWeight: 'bold'}]}>
                    Excluir conta
                </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// --- IDENTITY CARD ---
const IdentityCard = ({ profile, isOwner, onEdit, onOpenQuiz, myId, onLogout, onMessagePress, onDeleteAccount }: any) => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
    const [menuVisible, setMenuVisible] = useState(false);
    const { mutate: follow } = useFollowUser();
    const { mutate: unfollow } = useUnfollowUser();
    const { mutate: block } = useBlockUser();
    const { data: myFollowing } = useGetFollowing(myId);
    const isFollowing = myFollowing?.some((u: any) => u.id === profile.userId);

    const handleToggleFollow = () => { if (isFollowing) unfollow(profile.userId); else follow(profile.userId); };
    const handleBlockPress = () => { Alert.alert(t('block_user_title'), t('block_user_confirm'), [{ text: t('cancel'), style: "cancel" }, { text: t('block'), style: "destructive", onPress: () => { block(profile.userId); navigation.goBack(); } }]); };

    const avatarUrl = profile.imageUrl || profile.user?.profile?.imageUrl;

    return (
        <View style={styles.card}>
            <View style={styles.headerAction}>
                {!isOwner ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}><ArrowLeft size={24} color="#FFF" /></TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.iconBtn}><MoreVertical size={24} color="#9CA3AF" /></TouchableOpacity>
                )}
            </View>
            <View style={styles.avatarContainer}>
                <Image source={{ uri: avatarUrl || 'https://via.placeholder.com/150' }} style={styles.avatar} />
                {isOwner && <TouchableOpacity onPress={onEdit} style={styles.editBadge}><Pencil size={12} color="#FFF" /></TouchableOpacity>}
            </View>
            <Text style={styles.name}>{profile.user?.name || t('user_default')}</Text>
            {profile.currentCity && <View style={styles.locationRow}><MapPin size={14} color="#9CA3AF" /><Text style={styles.locationText}>{profile.currentCity}</Text></View>}
            <View style={styles.buttonRow}>
                {isOwner ? (
                    <>
                        <TouchableOpacity style={styles.btnPrimary} onPress={onEdit}><Settings size={18} color="#FFF" /><Text style={styles.btnText}>{t('edit')}</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.btnSecondary} onPress={onOpenQuiz}>
                            <Sparkles size={18} color="#FFF" />
                            <Text style={styles.btnText}>{t('harmony')}</Text>
                        </TouchableOpacity>
                    </>
                ) : (
                    <>
                        <TouchableOpacity style={[styles.btnPrimary, isFollowing && styles.btnOutlined]} onPress={handleToggleFollow}>
                            {isFollowing ? <Check size={18} color="#FFF" /> : <UserPlus size={18} color="#FFF" />}
                            <Text style={styles.btnText}>{isFollowing ? t('following_status') : t('follow')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.btnGray} onPress={onMessagePress}><MessageCircle size={18} color="#FFF" /><Text style={styles.btnText}>{t('message_button')}</Text></TouchableOpacity>
                        <TouchableOpacity style={styles.btnIconDanger} onPress={handleBlockPress}><Ban size={18} color="#EF4444" /></TouchableOpacity>
                    </>
                )}
            </View>
            <ProfileMenu 
                visible={menuVisible} 
                onClose={() => setMenuVisible(false)} 
                onLogout={onLogout} 
                onBlocked={() => navigation.navigate('BlockedProfiles')}
                onDeleteAccount={onDeleteAccount}
            />
        </View>
    );
};

// --- CONNECTIONS CARD ---
const ConnectionsCard = ({ userId }: { userId: string }) => {
    if (!userId) return null;

    const navigation = useNavigation(); 
    const { t } = useTranslation();
    const { user: loggedInUser } = useAuth();
    
    const [activeTab, setActiveTab] = React.useState<'following' | 'followers'>('following');
    
    const { data: followers = [] } = useGetFollowers(userId);
    const { data: following = [] } = useGetFollowing(userId);
    
    const list = activeTab === 'followers' ? followers : following;
    
    const countFollowers = followers?.length || 0;
    const countFollowing = following?.length || 0;
    
    const { mutate: follow } = useFollowUser();
    const { mutate: unfollow } = useUnfollowUser();

    const handleFollowToggle = (targetId: string, isAlreadyFollowing: boolean) => { 
        if (isAlreadyFollowing) unfollow(targetId); 
        else follow(targetId); 
    };

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{t('orbit_connections')}</Text>
            
            <View style={styles.tabsRow}>
                <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'following' && styles.activeTab]} 
                    onPress={() => setActiveTab('following')}
                >
                    <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
                        {t('following')} ({countFollowing})
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={[styles.tabItem, activeTab === 'followers' && styles.activeTab]} 
                    onPress={() => setActiveTab('followers')}
                >
                    <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
                        {t('followers')} ({countFollowers})
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={{ height: (list && list.length > 3) ? MAX_CONNECTIONS_HEIGHT : undefined }}>
                <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true}>
                    <View style={styles.grid}>
                        {(list && list.length > 0) ? list.map((u: any) => {
                            if (!u || !u.id) return null;

                            const isMe = loggedInUser?.id === u.id;
                            const amIFollowing = u.isFollowedByMe ?? false;
                            
                            const rawName = u.name || '';
                            const displayName = rawName ? rawName.split(' ')[0] : t('user_default');
                            
                            const avatarUrl = u.profile?.imageUrl || 'https://via.placeholder.com/150';

                            return (
                                <View key={u.id} style={styles.connectionItemWrapper}>
                                    <TouchableOpacity 
                                        style={styles.connectionItem} 
                                        onPress={() => (navigation as any).push('PublicProfile', { userId: u.id })}
                                    >
                                        <Image 
                                            source={{ uri: avatarUrl }} 
                                            style={styles.connectionAvatar} 
                                        />
                                        <Text style={styles.connectionName} numberOfLines={1}>
                                            {displayName}
                                        </Text>
                                    </TouchableOpacity>
                                    {!isMe && (
                                        <TouchableOpacity 
                                            style={[styles.followMiniBtn, amIFollowing && styles.followingMiniBtn]} 
                                            onPress={() => handleFollowToggle(u.id, !!amIFollowing)} 
                                            activeOpacity={0.8}
                                        >
                                            {amIFollowing 
                                                ? <Check size={10} color="#FFF" strokeWidth={4} /> 
                                                : <Plus size={10} color="#FFF" strokeWidth={4} />
                                            }
                                        </TouchableOpacity>
                                    )}
                                </View>
                            );
                        }) : <Text style={styles.emptyText}>{t('nobody_here')}</Text>}
                    </View>
                </ScrollView>
            </View>
        </View>
    );
};

const AboutCard = ({ bio }: { bio: string }) => {
    const { t } = useTranslation();
    return (<View style={styles.card}><Text style={styles.cardTitle}>{t('about_me')}</Text><Text style={styles.bioText}>{bio}</Text></View>);
};

const CosmicDetailsCard = ({ profile, isOwner, onUnlockPress, isLocked }: any) => {
    const navigation = useNavigation<any>();
    const { t } = useTranslation();
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
            <Text style={styles.cardTitle}>{t('cosmic_details')}</Text>
            <View style={styles.astroRow}>
                <View style={styles.astroCol}><Text style={styles.astroLabel}>{t('sun')} ☀️</Text><Text style={styles.astroVal}>{sun}</Text></View>
                <View style={styles.astroCol}><Text style={styles.astroLabel}>{t('moon')} 🌙</Text><Text style={styles.astroVal}>{moon}</Text></View>
                <View style={styles.astroCol}><Text style={styles.astroLabel}>{t('ascendant')} ✨</Text><Text style={styles.astroVal}>{ascendant}</Text></View>
            </View>
            {lifePath !== '...' && ( <View style={styles.numerologyRow}><Text style={styles.astroLabel}>{t('life_path')} 🔢</Text><Text style={styles.astroVal}>{lifePath}</Text></View> )}
            {!isOwner && (
                <View style={{gap: 8, marginTop: 15}}>
                    <TouchableOpacity style={[styles.btnPurpleFull, !hasNatalChart && styles.btnDisabled]} onPress={() => hasNatalChart && handleReportClick('synastry')} disabled={!hasNatalChart}>
                        <Sparkles size={18} color={hasNatalChart ? "#FFF" : "#6B7280"} /><Text style={[styles.btnText, !hasNatalChart && {color: '#6B7280'}]}>{t('view_compatibility')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.btnPurpleFull, !hasNumerology && styles.btnDisabled]} onPress={() => hasNumerology && handleReportClick('numerology')} disabled={!hasNumerology}>
                        <Calculator size={18} color={hasNumerology ? "#FFF" : "#6B7280"} /><Text style={[styles.btnText, !hasNumerology && {color: '#6B7280'}]}>{t('view_connection_numerology')}</Text>
                    </TouchableOpacity>
                    {(!hasNatalChart || !hasNumerology) && <Text style={styles.missingDataText}>{t('reports_unavailable')}</Text>}
                </View>
            )}
            {isOwner && (
                <TouchableOpacity 
                    style={[styles.btnPurpleFull, {marginTop: 15}, isLocked && styles.btnLocked]} 
                    onPress={isLocked ? onUnlockPress : () => navigation.navigate('NatalChartScreen')}
                    activeOpacity={0.8}
                >
                     {isLocked && <Lock size={18} color="#FFF" style={{marginRight: 6}} />}
                     <Text style={styles.btnText}>{t('view_my_astral_plan')}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { t } = useTranslation();
  const { user: loggedInUser, isLoading: authLoading, signOut } = useAuth();
  
  // --- Estados ---
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [isLockModalOpen, setLockModalOpen] = useState(false);
  const [isMessageModalOpen, setMessageModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false); 

  // NOVO ESTADO: Controle do modal de delete
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const targetUserId = (route.params as any)?.userId || loggedInUser?.id;
  const isOwner = targetUserId === loggedInUser?.id;

  // --- Hooks de Dados ---
  const { 
    data: profileData, 
    isLoading: profileLoading, 
    refetch: refetchProfile 
  } = isOwner ? useGetMyProfile() : useGetPublicProfile(targetUserId);

  const { 
    data: photosData, 
    refetch: refetchPhotos 
  } = useGetGalleryPhotos(targetUserId);
  
  const { 
    data: followers, 
    refetch: refetchFollowers 
  } = useGetFollowers(targetUserId);
  
  const { 
    data: following, 
    refetch: refetchFollowing 
  } = useGetFollowing(targetUserId);

  const { mutate: addPhoto, isPending: isUploading } = useAddPhotoToGallery();
  const { mutate: sendMessage, isPending: isSendingMessage } = useCreateOrGetConversation();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
        await Promise.all([
            refetchProfile(),
            refetchPhotos(),
            refetchFollowers(),
            refetchFollowing()
        ]);
        toast.success("Perfil atualizado");
    } catch (error) {
        console.error("Erro ao atualizar:", error);
    } finally {
        setRefreshing(false);
    }
  }, [refetchProfile, refetchPhotos, refetchFollowers, refetchFollowing]);

  const handleEdit = () => navigation.navigate('EditProfileScreen' as never);
  const handleLogout = () => { if (signOut) { signOut(); } else { Alert.alert(t('error'), t('error_logout')); } };

  // --- FUNÇÃO QUE CONFIRMA A EXCLUSÃO ---
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      // 1. Chama a API para iniciar a quarentena no Backend
      await api.delete('/users/me');
      
      setDeleteModalOpen(false);
      toast.success('Conta desativada com sucesso.');
      
      // 2. Faz logout localmente
      if (signOut) signOut();

    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      Alert.alert(t('error'), 'Erro ao processar solicitação.');
    } finally {
      setIsDeleting(false);
    }
  };

  const activePhoto = photosData?.find(p => p.id === selectedPhotoId) || null;

  const handleAddPhoto = () => {
    if (isUploading) return;
    Alert.alert(t('add_photo_title'), t('add_photo_msg'), [
        { text: t('cancel'), style: "cancel" },
        { text: t('take_photo'), onPress: async () => {
             try {
               const { status } = await ImagePicker.requestCameraPermissionsAsync();
               if (status !== 'granted') { Alert.alert(t('permission_needed'), t('camera_permission')); return; }
               const result = await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.6 });
               if (!result.canceled) addPhoto(result.assets[0].uri);
             } catch (e) { Alert.alert(t('error'), t('error_camera')); }
        }},
        { text: t('open_gallery'), onPress: async () => {
             try {
               const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
               if (status !== 'granted') { Alert.alert(t('permission_needed'), t('gallery_permission')); return; }
               const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
               if (!result.canceled) addPhoto(result.assets[0].uri);
             } catch (e) { Alert.alert(t('error'), t('error_gallery')); }
        }}
    ]);
  };

  const handleSendMessage = (text: string) => {
      sendMessage({ targetUserId: profileData.userId, content: text }, {
          onSuccess: () => { toast.success(t('toast_message_sent')); setMessageModalOpen(false); },
          onError: (error: any) => { if (error?.response?.status === 402) { Keyboard.dismiss(); setMessageModalOpen(false); } }
      });
  };

  if (authLoading || profileLoading) return <View style={styles.center}><ActivityIndicator size="large" color="#A78BFA" /></View>;
  if (!profileData) return <View style={styles.center}><Text style={{color: '#EF4444'}}>{t('profile_not_found')}</Text></View>;

  const sunSign = profileData.natalChart?.planets?.find((p: any) => p.name === 'Sol')?.sign || 'Cosmos';
  
  const MIN_FOLLOWERS = 5;
  const MIN_FOLLOWING = 10;
  
  const followersCount = followers?.length || 0;
  const followingCount = following?.length || 0;
  
  const isLocked = isOwner && (followersCount < MIN_FOLLOWERS || followingCount < MIN_FOLLOWING);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {!isOwner && <View style={{height: 10}} />}
      
      <ScrollView 
        contentContainerStyle={styles.scroll}
        refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#A78BFA"
                colors={["#A78BFA"]} 
            />
        }
      >
        <IdentityCard 
            profile={profileData} 
            isOwner={isOwner} 
            onEdit={handleEdit} 
            onOpenQuiz={() => setIsQuizOpen(true)} 
            myId={loggedInUser?.id} 
            onLogout={handleLogout} 
            onMessagePress={() => setMessageModalOpen(true)}
            onDeleteAccount={() => setDeleteModalOpen(true)} // ABERTURA DO MODAL
        />
        {profileData.behavioralAnswers && profileData.behavioralAnswers.length > 0 && ( <BehavioralRadarChart answers={profileData.behavioralAnswers} sign={sunSign} userId={profileData.userId} isOwner={isOwner} /> )}
        
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

      {isUploading && <View style={styles.uploadOverlay}><View style={styles.uploadBox}><ActivityIndicator size="large" color="#FFF" /><Text style={styles.uploadText}>{t('uploading_photo')}</Text></View></View>}

      <BehavioralQuizModal isOpen={isQuizOpen} onClose={() => setIsQuizOpen(false)} sunSign={sunSign} existingAnswers={profileData.behavioralAnswers} />
      <GalleryPhotoViewerModal photo={activePhoto} onClose={() => setSelectedPhotoId(null)} isOwner={isOwner} profileUserId={targetUserId} />
      
      <NatalChartLockModal 
        visible={isLockModalOpen} 
        onClose={() => setLockModalOpen(false)} 
        counts={{ followers: followersCount, following: followingCount }} 
        metas={{ followers: MIN_FOLLOWERS, following: MIN_FOLLOWING }} 
      />
      
      <SendMessageModal visible={isMessageModalOpen} onClose={() => setMessageModalOpen(false)} recipient={profileData} onSend={handleSendMessage} isLoading={isSendingMessage} />
      
      {/* NOVO MODAL INTEGRADO */}
      <DeleteAccountModal 
        visible={isDeleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
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
  btnPurpleFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#A855F7', padding: 12, borderRadius: 8, width: '100%' },
  btnPrimaryFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#4F46E5', paddingVertical: 12, borderRadius: 8, width: '100%', marginTop: 20 },
  btnDangerFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#DC2626', paddingVertical: 12, borderRadius: 8, width: '100%' },
  btnGrayFull: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#374151', paddingVertical: 12, borderRadius: 8, width: '100%' },
  btnOutlined: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#4B5563' },
  btnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#9333EA', paddingVertical: 10, borderRadius: 8 },
  btnGray: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#374151', paddingVertical: 10, borderRadius: 8 },
  btnIcon: { padding: 10, backgroundColor: '#374151', borderRadius: 8 },
  btnIconDanger: { padding: 10, backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.5)' },
  btnText: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  btnTextBold: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#374151', marginBottom: 16 },
  tabItem: { flex: 1, paddingVertical: 8, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  activeTab: { borderBottomColor: '#818CF8' },
  tabText: { color: '#9CA3AF', fontWeight: '600' },
  activeTabText: { color: '#818CF8' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, justifyContent: 'flex-start' },
  connectionItemWrapper: { position: 'relative', width: AVATAR_CARD_SIZE, marginBottom: 12 },
  connectionItem: { width: '100%', alignItems: 'center', backgroundColor: '#374151', padding: 8, borderRadius: 8 },
  connectionAvatar: { width: 48, height: 48, borderRadius: 24, marginBottom: 4, backgroundColor: '#4B5563' },
  connectionName: { color: '#FFF', fontSize: 11, textAlign: 'center' },
  followMiniBtn: { position: 'absolute', top: 0, right: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: '#4F46E5', justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#374151', elevation: 3, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 2 },
  followingMiniBtn: { backgroundColor: '#10B981' },
  emptyText: { color: '#6B7280', fontStyle: 'italic' },
  astroRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 10 },
  numerologyRow: { borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 10, marginTop: 5, alignItems: 'center' },
  astroCol: { alignItems: 'center' },
  astroLabel: { color: '#9CA3AF', fontSize: 12, marginBottom: 4 },
  astroVal: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
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
  modalTitleDanger: { color: '#EF4444', fontSize: 20, fontWeight: 'bold', marginVertical: 12 },
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
  uploadText: { color: '#FFF', marginTop: 12, fontWeight: 'bold' },
  iconCircleRed: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(239, 68, 68, 0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 }
});