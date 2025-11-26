import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Keyboard, Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; 
import { useTranslation } from 'react-i18next'; // <--- I18N
import { api } from '../services/api';

type SearchUser = {
  id: string; name: string; username: string; profile?: { imageUrl: string | null; sunSign: string | null; }
};

export function SearchUsersScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets(); 
  const { t } = useTranslation(); // <--- HOOK
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get<SearchUser[]>('/social/search-users', { params: { q: query } });
        setResults(data || []);
      } catch (error) { console.log('Erro busca:', error); } finally { setIsLoading(false); }
    }, 500); 
    return () => clearTimeout(timer);
  }, [query]);

  const renderItem = ({ item }: { item: SearchUser }) => (
    <TouchableOpacity style={styles.userItem} onPress={() => navigation.navigate('PublicProfile', { userId: item.id })}>
      {item.profile?.imageUrl ? ( <Image source={{ uri: item.profile.imageUrl }} style={styles.avatar} /> ) : ( <View style={[styles.avatar, styles.placeholderAvatar]}><Ionicons name="person" size={20} color="#9CA3AF" /></View> )}
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userHandle}>@{item.username || 'usuario'} {item.profile?.sunSign ? ` • ${item.profile.sunSign}` : ''}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#4B5563" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[ styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 10 : 0) } ]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}><Ionicons name="arrow-back" size={24} color="white" /></TouchableOpacity>
        <View style={styles.inputContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput style={styles.input} placeholder={t('search_placeholder')} placeholderTextColor="#6B7280" value={query} onChangeText={setQuery} autoFocus returnKeyType="search" onSubmitEditing={Keyboard.dismiss} />
          {query.length > 0 && ( <TouchableOpacity onPress={() => setQuery('')}><Ionicons name="close-circle" size={20} color="#6B7280" /></TouchableOpacity> )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#8B5CF6" /></View>
      ) : (
        <FlatList
          data={results} keyExtractor={(item) => item.id} renderItem={renderItem} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled" 
          ListEmptyComponent={
            query.length >= 2 ? (
              <View style={styles.center}><Text style={styles.emptyText}>{t('search_no_results')}</Text><Text style={{color: '#4B5563', fontSize: 12, marginTop: 5}}>{t('search_try_another')}</Text></View>
            ) : (
              <View style={styles.center}><Ionicons name="people-outline" size={40} color="#374151" style={{marginBottom: 10}} /><Text style={styles.emptyText}>{t('search_find_users')}</Text><Text style={{color: '#6B7280', fontSize: 14}}>{t('search_find_users_sub')}</Text></View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1F2937', paddingBottom: 15 },
  backButton: { marginRight: 12 },
  inputContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', borderRadius: 20, paddingHorizontal: 12, height: 45, borderWidth: 1, borderColor: '#374151' },
  input: { flex: 1, color: 'white', marginLeft: 8, fontSize: 16 },
  listContent: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#9CA3AF', textAlign: 'center', fontSize: 16, fontWeight: 'bold' },
  userItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1F2937', padding: 12, marginBottom: 10, borderRadius: 12, borderWidth: 1, borderColor: '#374151' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  placeholderAvatar: { backgroundColor: '#374151', justifyContent: 'center', alignItems: 'center' },
  userInfo: { flex: 1 },
  userName: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  userHandle: { color: '#9CA3AF', fontSize: 14 }
});