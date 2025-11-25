import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useGetBlockedUsers, useUnblockUser } from '../features/profile/hooks/useProfile';

export default function BlockedProfilesScreen() {
  const navigation = useNavigation();
  const { data: blockedUsers, isLoading } = useGetBlockedUsers();
  const { mutate: unblock, isPending } = useUnblockUser();

  const handleUnblock = (userId: string) => {
    unblock(userId);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8B5CF6" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.title}>Perfis Bloqueados</Text>
      </View>

      {/* Lista */}
      <FlatList
        data={blockedUsers || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Você não bloqueou ninguém.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.userInfo}>
              <Image 
                source={{ uri: item.profile?.imageUrl || 'https://via.placeholder.com/150' }} 
                style={styles.avatar} 
              />
              <Text style={styles.name}>{item.name}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.unblockBtn} 
              onPress={() => handleUnblock(item.id)}
              disabled={isPending}
            >
              <Text style={styles.unblockText}>Desbloquear</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#374151' },
  backBtn: { marginRight: 15 },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold' },
  list: { padding: 20 },
  emptyText: { color: '#9CA3AF', textAlign: 'center', marginTop: 50 },
  
  // Card
  card: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#1F2937', padding: 12, borderRadius: 12, marginBottom: 12,
    borderWidth: 1, borderColor: '#374151'
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  name: { color: 'white', fontSize: 16, fontWeight: '600' },
  
  unblockBtn: { backgroundColor: '#4F46E5', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  unblockText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
});