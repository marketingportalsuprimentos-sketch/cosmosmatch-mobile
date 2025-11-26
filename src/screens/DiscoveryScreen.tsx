import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, StyleSheet, ActivityIndicator, SafeAreaView, 
  TouchableOpacity, TextInput, Dimensions, Image, Keyboard, KeyboardAvoidingView, Platform, Alert,
  TouchableWithoutFeedback, Animated as RNAnimated, StatusBar
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { useTranslation } from 'react-i18next';

import { useDiscoveryQueue } from '../features/discovery/hooks/useDiscoveryQueue';
import { useDiscoveryMutations } from '../features/discovery/hooks/useDiscoveryMutations';
import { useFollowUser } from '../features/profile/hooks/useProfile'; 
import { api } from '../services/api'; 

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.92;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.62; 

const CustomToast = ({ message, visible, icon }: { message: string, visible: boolean, icon?: any }) => {
  const fadeAnim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.timing(fadeAnim, { toValue: visible ? 1 : 0, duration: 300, useNativeDriver: true }).start();
  }, [visible]);
  if (!visible && fadeAnim._value === 0) return null;
  return (
    <RNAnimated.View style={[styles.toastContainer, { opacity: fadeAnim }]}>
      <Ionicons name={icon || "heart"} size={20} color="white" />
      <Text style={styles.toastText}>{message}</Text>
    </RNAnimated.View>
  );
};

function DiscoveryCard({ 
    profile, onSwipeRight, onSwipeLeft, onSearchTap, isKeyboardVisible, activeInput, onConnectPress, isConnected, onNamePress 
}: any) {
  const { t } = useTranslation();
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => { translateX.value = 0; translateY.value = 0; }, [profile.userId]);

  const pan = Gesture.Pan()
    .onUpdate((event) => { translateX.value = event.translationX; translateY.value = event.translationY; })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 120) {
        const direction = event.translationX > 0 ? 'right' : 'left';
        const targetX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
        translateX.value = withTiming(targetX, { duration: 200 }, () => {
          runOnJS(direction === 'right' ? onSwipeRight : onSwipeLeft)();
        });
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(translateX.value, [-SCREEN_WIDTH/2, SCREEN_WIDTH/2], [-10, 10]);
    return { transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { rotate: `${rotate}deg` }] };
  });

  const imageUrl = profile.profile?.imageUrl;
  const name = profile.name || t('no_name');
  const city = profile.profile?.currentCity || t('unknown_location');
  const score = profile.compatibility?.score ?? 0;
  const shouldHideFooter = isKeyboardVisible && activeInput === 'message';

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, animatedStyle]}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, {backgroundColor: '#374151', alignItems:'center', justifyContent:'center'}]}>
             <Ionicons name="person" size={80} color="#6B7280" />
          </View>
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.95)']} style={styles.gradient} />
        <View style={styles.topContainer}>
           <View style={styles.affinityBadge}>
              <Ionicons name="sparkles" size={14} color="#E9D5FF" />
              <Text style={styles.affinityLabel}>{t('affinity')}</Text>
              <Text style={styles.affinityScore}>{Math.round(score)}%</Text>
           </View>
           <TouchableOpacity style={styles.searchIconBtn} onPress={onSearchTap} activeOpacity={0.7}>
              <Ionicons name="search" size={20} color="white" />
           </TouchableOpacity>
        </View>
        {!shouldHideFooter && (
          <View style={styles.bottomContainer}>
             <TouchableOpacity onPress={onNamePress} activeOpacity={0.7}>
                <Text style={styles.nameText} numberOfLines={1}>
                    {name} <Ionicons name="chevron-forward" size={20} color="white" style={{ opacity: 0.7 }} />
                </Text>
             </TouchableOpacity>
             <View style={styles.locationRow}>
                <Ionicons name="location-sharp" size={16} color="#E5E7EB" />
                <Text style={styles.locationText} numberOfLines={1}>{city}</Text>
             </View>
             <TouchableOpacity 
                style={[styles.connectButton, isConnected && styles.likedButton]} 
                onPress={onConnectPress} activeOpacity={0.9} disabled={isConnected} 
             >
                <Ionicons name={isConnected ? "checkmark-circle" : "person-add"} size={20} color="white" style={{marginRight: 8}} />
                <Text style={styles.connectButtonText}>
                    {isConnected ? t('connected') : t('connect')}
                </Text>
             </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </GestureDetector>
  );
}

function ActionFooter({ onSkip, onLike, onSendMessage, isProcessing, onFocusMsg, isLiked }: any) {
  const { t } = useTranslation();
  const [msg, setMsg] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const handleSend = async () => { 
      if (!msg.trim() || localLoading || isProcessing) return; 
      setLocalLoading(true);
      try {
          await onSendMessage(msg); 
          setMsg(''); 
          Keyboard.dismiss(); 
      } catch (error) {
      } finally {
          setLocalLoading(false);
      }
  };

  return (
    <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.circleButton} onPress={onSkip} disabled={isProcessing || localLoading}>
            <Ionicons name="close" size={26} color="#9CA3AF" />
        </TouchableOpacity>
        <View style={styles.messageInputPill}>
          <TextInput 
            style={styles.inputMessage} 
            placeholder={t('send_message_placeholder')} 
            placeholderTextColor="#6B7280" 
            value={msg} 
            onChangeText={setMsg} 
            onFocus={onFocusMsg} 
            onSubmitEditing={handleSend} 
            returnKeyType="send" 
          />
          <TouchableOpacity 
            style={[styles.sendIconBubble, { opacity: msg.trim() ? 1 : 0.5 }]} 
            onPress={handleSend} 
            disabled={!msg.trim() || isProcessing || localLoading}
          >
             {localLoading ? (
                 <ActivityIndicator size="small" color="white" />
             ) : (
                 <Ionicons name="paper-plane" size={14} color="white" />
             )}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.circleButton, {borderColor: isLiked ? '#A855F7' : '#A78BFA', backgroundColor: isLiked ? 'rgba(168, 85, 247, 0.2)' : 'rgba(31, 41, 55, 0.5)'}]} onPress={onLike} disabled={isProcessing || isLiked || localLoading}>
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={26} color={isLiked ? "#A855F7" : "#A78BFA"} />
        </TouchableOpacity>
    </View>
  );
}

export default function DiscoveryScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets(); 
  const { t } = useTranslation();

  const [citySearch, setCitySearch] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedCityName, setSelectedCityName] = useState<string | undefined>(undefined);
  const [isSearching, setIsSearching] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [activeInput, setActiveInput] = useState<'city' | 'message' | null>(null);
  
  const lastSearchRef = useRef('');
  const [isLikedCurrent, setIsLikedCurrent] = useState(false);
  const [isConnectedCurrent, setIsConnectedCurrent] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastIcon, setToastIcon] = useState('heart');

  const showToast = (message: string, icon: string = 'heart') => { 
      setToastMessage(message); setToastIcon(icon); setToastVisible(true); 
      setTimeout(() => setToastVisible(false), 2500); 
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => { setKeyboardVisible(false); setActiveInput(null); });
    return () => { showSubscription.remove(); hideSubscription.remove(); };
  }, []);

  const { currentProfile, removeCurrentProfile, isQueueEmpty, isLoading, requiresProfile, refetchQueue } = useDiscoveryQueue({ locationFilter, cityName: selectedCityName });

  useEffect(() => { setIsLikedCurrent(false); setIsConnectedCurrent(false); }, [currentProfile?.userId]);

  const { like, sendIcebreaker, likeStatus } = useDiscoveryMutations();
  const { mutate: followUser } = useFollowUser(); 
  const isProcessing = likeStatus === 'pending';

  const handleOpenSearch = () => { navigation.navigate('SearchUsers'); };
  const handleGoToProfile = () => { if (currentProfile) navigation.navigate('PublicProfile', { userId: currentProfile.userId }); };

  const searchCity = async (text: string) => {
    setCitySearch(text); lastSearchRef.current = text; 
    if (text.length === 0) { setLocationFilter(null); setSelectedCityName(undefined); }
    if (text.length > 2) {
      try { 
          const { data } = await api.get<string[]>('/profile/autocomplete', { params: { input: text } }); 
          if (lastSearchRef.current === text) setSuggestions(data || []); 
      } catch (e) {}
    } else { setSuggestions([]); }
  };

  const selectSuggestion = (item: string) => { setCitySearch(item); lastSearchRef.current = item; setSuggestions([]); handleSearchPress(item); };

  const handleSearchPress = async (cityOverride?: string) => {
    const cityToSearch = cityOverride || citySearch;
    if (!cityToSearch.trim()) return;
    setSuggestions([]); Keyboard.dismiss(); setIsSearching(true);
    try {
      const { data } = await api.get('/profile/geocode', { params: { city: cityToSearch } });
      if (data.lat && data.lng) { setLocationFilter(data); setSelectedCityName(cityToSearch); }
    } catch (e) { Alert.alert(t('error'), t('error_city_not_found')); setLocationFilter(null); setSelectedCityName(undefined); } 
    finally { setIsSearching(false); }
  };

  const handleLikePress = async () => {
    if (!currentProfile) return;
    setIsLikedCurrent(true); showToast(t('toast_like_sent'), "heart");
    try { await like(currentProfile.userId); setTimeout(() => removeCurrentProfile(), 500); } 
    catch (error) { setIsLikedCurrent(false); Alert.alert(t('error'), t('error_like_failed')); }
  };

  const handleConnectPress = () => {
      if (!currentProfile) return;
      setIsConnectedCurrent(true); showToast(t('toast_followed'), "person-add");
      followUser(currentProfile.userId, {
          onSuccess: () => { setTimeout(() => removeCurrentProfile(), 800); },
          onError: () => { setIsConnectedCurrent(false); Alert.alert(t('error'), t('error_follow_failed')); }
      });
  };

  const handleSendMessage = async (message: string) => {
    if (!currentProfile) return;
    try {
        await sendIcebreaker({ userId: currentProfile.userId, content: message });
        showToast(t('toast_message_sent'), "paper-plane");
    } catch (error: any) { 
        if (error?.response?.status === 402) throw error; 
        Alert.alert(t('error'), t('error_send_failed')); throw error;
    }
  };

  const handleSwipeAction = () => { if (!currentProfile) return; removeCurrentProfile(); };

  if (requiresProfile) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle" size={60} color="#F59E0B" />
        <Text style={styles.infoTitle}>{t('complete_profile_first')}</Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('EditProfile')}><Text style={styles.actionButtonText}>{t('edit_profile')}</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CustomToast message={toastMessage} visible={toastVisible} icon={toastIcon} />
      
      <KeyboardAvoidingView 
        // CORREÇÃO: Android usa 'height' para encolher a tela corretamente
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{flex: 1}} 
        enabled={activeInput === 'message'} 
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 30}
      >
        
        <View style={[
            styles.searchWrapper, 
            { paddingTop: Platform.OS === 'android' ? insets.top + 15 : Math.max(insets.top - 5, 10) }
        ]}>
            <View style={styles.headerContainer}>
              <View style={styles.inputWrapper}>
                <Ionicons name="location" size={18} color="#9CA3AF" style={{marginRight: 8}} />
                <TextInput style={styles.input} placeholder={t('filter_city_placeholder')} placeholderTextColor="#6B7280" value={citySearch} onChangeText={searchCity} onFocus={() => setActiveInput('city')} onSubmitEditing={() => handleSearchPress()} returnKeyType="search" />
              </View>
              <TouchableOpacity style={styles.searchButton} onPress={() => handleSearchPress()}><Text style={styles.searchButtonText}>{t('filter_button')}</Text></TouchableOpacity>
            </View>
            {suggestions.length > 0 && (
              <View style={[
                  styles.suggestionsList, 
                  { top: Platform.OS === 'android' ? insets.top + 70 : insets.top + 55 }
              ]}>
                {suggestions.map((item, i) => (
                  <TouchableOpacity key={i} style={styles.suggestionItem} onPress={() => selectSuggestion(item)}><Text style={{color:'#D1D5DB'}}>{item}</Text></TouchableOpacity>
                ))}
              </View>
            )}
        </View>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.contentContainer}>
              {(isLoading || isSearching) && <ActivityIndicator size="large" color="#8B5CF6" />}
              {!isLoading && !isSearching && isQueueEmpty && (
                 <View style={{alignItems: 'center'}}>
                    <Ionicons name="telescope-outline" size={60} color="#4B5563" />
                    <Text style={{color: '#9CA3AF', marginTop: 15, fontSize: 16}}>{t('nobody_nearby')}</Text>
                    <Text style={{color: '#6B7280', marginTop: 5, fontSize: 12}}>{t('try_adjust_filter')}</Text>
                    <TouchableOpacity onPress={() => refetchQueue()} style={{marginTop: 20}}><Text style={{color: '#8B5CF6', fontWeight:'bold'}}>{t('try_again')}</Text></TouchableOpacity>
                 </View>
              )}
              {!isLoading && !isSearching && currentProfile && (
                <DiscoveryCard 
                    key={currentProfile.userId} profile={currentProfile} 
                    onSwipeRight={handleSwipeAction} onSwipeLeft={handleSwipeAction} 
                    onSearchTap={handleOpenSearch} onConnectPress={handleConnectPress} 
                    isConnected={isConnectedCurrent} onNamePress={handleGoToProfile} 
                    isKeyboardVisible={isKeyboardVisible} activeInput={activeInput}
                />
              )}
            </View>
        </TouchableWithoutFeedback>

        {!isQueueEmpty && (
          <ActionFooter onSkip={handleSwipeAction} onLike={handleLikePress} onSendMessage={handleSendMessage} isProcessing={isProcessing} onFocusMsg={() => setActiveInput('message')} isLiked={isLikedCurrent} />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  searchWrapper: { zIndex: 999, elevation: 999, backgroundColor: '#111827' },
  headerContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 10, alignItems: 'center' },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 25, paddingHorizontal: 12, height: 45, marginRight: 10, borderWidth: 1, borderColor: '#374151' },
  input: { flex: 1, color: 'white' },
  searchButton: { backgroundColor: '#5B21B6', paddingHorizontal: 16, height: 45, borderRadius: 25, justifyContent: 'center' },
  searchButtonText: { color: 'white', fontWeight: 'bold' },
  suggestionsList: { position: 'absolute', left: 16, right: 90, backgroundColor: '#1F2937', borderRadius: 10, zIndex: 1000, borderWidth: 1, borderColor:'#374151', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  suggestionItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#374151' },
  contentContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', zIndex: 1, paddingBottom: 20 },
  card: { width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 24, backgroundColor: '#1F2937', overflow: 'hidden', position: 'absolute', elevation: 10, shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 10 },
  image: { width: '100%', height: '100%' },
  gradient: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  topContainer: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, width: '100%', position: 'absolute', top: 0 },
  affinityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 20, 50, 0.85)', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.4)' },
  affinityLabel: { color: '#E9D5FF', fontSize: 12, marginHorizontal: 4 },
  affinityScore: { color: '#C084FC', fontWeight: 'bold' },
  searchIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  bottomContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20 },
  nameText: { color: 'white', fontSize: 28, fontWeight: 'bold', marginBottom: 4, flexDirection: 'row', alignItems: 'center' },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  locationText: { color: '#E5E7EB', fontSize: 15, marginLeft: 6 },
  connectButton: { backgroundColor: '#6366F1', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 14, width: '100%', shadowColor: "#6366F1", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 5 },
  likedButton: { backgroundColor: '#374151', borderWidth: 1, borderColor: '#A855F7', shadowColor: "transparent" },
  connectButtonText: { color: 'white', fontSize: 17, fontWeight: 'bold' },
  footerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 10, height: 80, zIndex: 100, elevation: 100, backgroundColor: '#111827' },
  circleButton: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(31, 41, 55, 0.5)', borderWidth: 1, borderColor: '#374151' },
  messageInputPill: { flex: 1, marginHorizontal: 12, height: 50, borderRadius: 25, backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, justifyContent: 'space-between' },
  inputMessage: { flex: 1, color: 'white', marginLeft: 10, height: '100%' },
  sendIconBubble: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#8B5CF6', justifyContent: 'center', alignItems: 'center' },
  infoTitle: { color: 'white', fontSize: 20, marginTop: 10 },
  actionButton: { marginTop: 20, backgroundColor: '#8B5CF6', padding: 12, borderRadius: 20 },
  actionButtonText: { color: 'white', fontWeight: 'bold' },
  toastContainer: { position: 'absolute', top: 60, alignSelf: 'center', backgroundColor: '#A855F7', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 9999, elevation: 9999, shadowColor: "#000", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 4.65 },
  toastText: { color: 'white', fontWeight: 'bold', fontSize: 14 }
});