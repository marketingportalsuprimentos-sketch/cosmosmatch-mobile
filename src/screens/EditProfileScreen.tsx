// src/screens/EditProfileScreen.tsx

import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, 
  Image, ActivityIndicator, Alert, Platform, KeyboardAvoidingView, Modal, LogBox 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, Info, Lock, Camera, ChevronDown, Check, X } from 'lucide-react-native';

import { useGetMyProfile, useUpdateProfile, useUpdateAvatar } from '../features/profile/hooks/useProfile';
import { UpdateProfileDto } from '../types/profile.types';
import { CityAutocomplete } from '../components/ui/CityAutocomplete';

// --- CORREÇÃO: Silenciar o aviso de listas aninhadas ---
// O Google Autocomplete usa uma FlatList interna. Dentro de um ScrollView, o React Native
// gera um aviso. Como desativamos o scroll da lista interna (scrollEnabled={false}),
// podemos ignorar este aviso com segurança para limpar a tela.
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

const GENDER_OPTIONS = [
  { label: 'Masculino', value: 'MALE' },
  { label: 'Feminino', value: 'FEMALE' },
  { label: 'Não-Binário', value: 'NON_BINARY' },
  { label: 'Outro', value: 'OTHER' },
];

export const EditProfileScreen = () => {
  const navigation = useNavigation();
  
  // Hooks de Dados
  const { data: profile, isLoading: isLoadingData } = useGetMyProfile();
  const { mutateAsync: updateProfile, isPending: isSavingProfile } = useUpdateProfile(); 
  const { mutateAsync: updateAvatar, isPending: isSavingAvatar } = useUpdateAvatar(); 

  // Estados do Formulário
  const [birthDate, setBirthDate] = useState(new Date());
  const [birthCity, setBirthCity] = useState('');
  const [birthTime, setBirthTime] = useState(new Date());
  const [fullNameBirth, setFullNameBirth] = useState('');
  const [currentCity, setCurrentCity] = useState('');
  const [gender, setGender] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [bio, setBio] = useState('');
  
  // Estado da Foto
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isAvatarChanged, setIsAvatarChanged] = useState(false);

  // Estados de Controle de UI (Modais)
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    if (profile) {
      if (profile.birthDate) setBirthDate(new Date(profile.birthDate));
      
      if (profile.birthTime) {
          const [h, m] = profile.birthTime.split(':');
          const timeDate = new Date();
          timeDate.setHours(parseInt(h || '0'), parseInt(m || '0'));
          setBirthTime(timeDate);
      }
      
      setBirthCity(profile.birthCity || '');
      setFullNameBirth(profile.fullNameBirth || '');
      setCurrentCity(profile.currentCity || '');
      setGender(profile.gender || '');
      setCpfCnpj(profile.cpfCnpj || '');
      setBio(profile.bio || '');
      setAvatarUri(profile.imageUrl);
    }
  }, [profile]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
      setIsAvatarChanged(true);
    }
  };

  const handleSubmit = async () => {
    try {
        // 1. Validação
        if (!birthCity || !currentCity || !gender || !cpfCnpj) {
            Alert.alert("Campos Obrigatórios", "Por favor preencha cidade, gênero e CPF.");
            return;
        }

        // 2. Prepara o Objeto
        const payload: UpdateProfileDto = {
            birthDate: birthDate.toISOString(),
            birthTime: `${birthTime.getHours().toString().padStart(2, '0')}:${birthTime.getMinutes().toString().padStart(2, '0')}`,
            birthCity,
            fullNameBirth: fullNameBirth || undefined,
            currentCity,
            gender: gender as any,
            bio: bio || undefined,
            cpfCnpj
        };

        // 3. Envia Texto
        await updateProfile(payload);

        // 4. Envia Foto (se mudou)
        if (isAvatarChanged && avatarUri) {
            await updateAvatar(avatarUri);
        }

        // Sucesso
        navigation.goBack();
        
    } catch (error) {
        console.error("Erro ao salvar perfil:", error);
    }
  };

  const showInfo = (title: string, msg: string) => Alert.alert(title, msg);

  if (isLoadingData) {
      return <View style={styles.center}><ActivityIndicator size="large" color="#7C3AED" /></View>;
  }

  const isSaving = isSavingProfile || isSavingAvatar;
  const genderLabel = GENDER_OPTIONS.find(g => g.value === gender)?.label || 'Selecione...';

  // Renderizador do Calendário (Compatível com iOS/Android)
  const renderDateTimePicker = (
    show: boolean, 
    setShow: (v: boolean) => void, 
    value: Date, 
    mode: 'date' | 'time',
    onChange: (date: Date) => void
  ) => {
    if (!show) return null;

    // iOS: Modal Branco Centralizado
    if (Platform.OS === 'ios') {
        return (
            <Modal visible={show} transparent animationType="fade">
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShow(false)}
                >
                    <View style={styles.iosPickerModalContent}>
                         <View style={styles.iosPickerHeader}>
                            <Text style={styles.iosPickerTitle}>{mode === 'date' ? 'Data de Nascimento' : 'Hora de Nascimento'}</Text>
                            <TouchableOpacity onPress={() => setShow(false)} style={styles.iosConfirmBtn}>
                                <Text style={styles.iosConfirmText}>Pronto</Text>
                            </TouchableOpacity>
                         </View>
                         <DateTimePicker 
                            value={value} 
                            mode={mode} 
                            display="spinner"
                            themeVariant="light" // Texto preto em fundo branco
                            textColor="black"
                            onChange={(e, date) => {
                                if (date) onChange(date);
                            }}
                            style={{ height: 200, width: '100%', backgroundColor: 'white' }}
                         />
                    </View>
                </TouchableOpacity>
            </Modal>
        );
    }

    // Android: Modal Nativo
    return (
        <DateTimePicker 
            value={value} 
            mode={mode} 
            display="default"
            onChange={(e, date) => {
                setShow(false);
                if (date) onChange(date);
            }}
        />
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <ArrowLeft size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Editar Perfil</Text>
            <View style={{width: 24}} />
        </View>

        <ScrollView 
            contentContainerStyle={styles.scroll}
            // --- IMPORTANTE: Permite o clique na lista de cidades ---
            keyboardShouldPersistTaps='always'
        >
            
            {/* Avatar */}
            <View style={styles.avatarSection}>
                <View style={styles.avatarWrapper}>
                    <Image source={{ uri: avatarUri || 'https://via.placeholder.com/150' }} style={styles.avatar} />
                    <TouchableOpacity style={styles.cameraBtn} onPress={handlePickImage} disabled={isSaving}>
                        <Camera size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handlePickImage} disabled={isSaving}>
                    <Text style={styles.changePhotoText}>
                        {isSavingAvatar ? 'Enviando...' : 'Mudar Foto'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.form}>
                
                {/* Linha 1: Data e Hora */}
                <View style={[styles.row, { zIndex: 1 }]}>
                    <View style={styles.col}>
                        <Text style={styles.label}>Data Nasc. *</Text>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.inputBtn}>
                            <Text style={styles.inputText}>{birthDate.toLocaleDateString('pt-BR')}</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.col}>
                        <Text style={styles.label}>Hora Nasc. *</Text>
                        <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.inputBtn}>
                            <Text style={styles.inputText}>
                                {`${birthTime.getHours().toString().padStart(2, '0')}:${birthTime.getMinutes().toString().padStart(2, '0')}`}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Cidade Nascimento (Com Autocomplete) */}
                {/* Z-Index alto para a lista flutuar sobre o resto */}
                <View style={[styles.inputGroup, { zIndex: 20 }]}>
                    <Text style={styles.label}>Cidade de Nascimento *</Text>
                    <CityAutocomplete 
                        placeholder="Ex: São Paulo, SP"
                        value={birthCity}
                        onSelect={(city) => setBirthCity(city)}
                    />
                </View>

                {/* Nome Nascimento */}
                <View style={[styles.inputGroup, { zIndex: 10 }]}>
                    <View style={styles.labelRow}>
                        <Text style={styles.label}>Nome Completo (Certidão) *</Text>
                        <TouchableOpacity onPress={() => showInfo('Nome de Nascimento', 'Usado apenas para cálculos de numerologia. Não será exibido publicamente.')}>
                            <Info size={16} color="#9CA3AF" style={{marginLeft: 6}} />
                        </TouchableOpacity>
                    </View>
                    <TextInput 
                        style={styles.input} 
                        value={fullNameBirth} 
                        onChangeText={setFullNameBirth}
                        placeholder="Nome exato do nascimento"
                        placeholderTextColor="#6B7280"
                    />
                </View>

                {/* Linha 2: Cidade Atual e Gênero */}
                {/* Z-Index ajustado para a lista desta cidade flutuar sobre o Gênero/CPF */}
                <View style={[styles.row, { zIndex: 15 }]}>
                     <View style={[styles.col, {flex: 1.5, zIndex: 20}]}>
                        <Text style={styles.label}>Cidade Atual *</Text>
                        <CityAutocomplete 
                            placeholder="Sua cidade"
                            value={currentCity}
                            onSelect={(city) => setCurrentCity(city)}
                        />
                    </View>

                    <View style={[styles.col, {flex: 1}]}>
                        <Text style={styles.label}>Gênero *</Text>
                        <TouchableOpacity 
                            style={styles.inputBtn} 
                            onPress={() => setShowGenderPicker(true)}
                        >
                            <Text style={styles.inputText} numberOfLines={1}>{genderLabel}</Text>
                            <ChevronDown size={16} color="#9CA3AF" style={{marginLeft: 4}} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* CPF */}
                <View style={[styles.inputGroup, styles.borderTop, { zIndex: 1 }]}>
                     <View style={styles.labelRow}>
                        <Lock size={16} color="#FACC15" style={{marginRight: 6}} />
                        <Text style={styles.label}>CPF / CNPJ (Pagamentos) *</Text>
                        <TouchableOpacity onPress={() => showInfo('Privacidade', 'Necessário para gerar PIX via Asaas. Totalmente privado.')}>
                            <Info size={16} color="#9CA3AF" style={{marginLeft: 6}} />
                        </TouchableOpacity>
                    </View>
                    <TextInput 
                        style={styles.input} 
                        value={cpfCnpj} 
                        onChangeText={setCpfCnpj} 
                        placeholder="Apenas números"
                        keyboardType="numeric"
                        placeholderTextColor="#6B7280"
                    />
                </View>

                {/* Bio */}
                <View style={[styles.inputGroup, { zIndex: 1 }]}>
                    <Text style={styles.label}>Bio (Sobre mim)</Text>
                    <TextInput 
                        style={[styles.input, styles.textArea]} 
                        value={bio} 
                        onChangeText={setBio} 
                        placeholder="Conte um pouco sobre você..."
                        placeholderTextColor="#6B7280"
                        multiline
                        numberOfLines={3}
                    />
                </View>

            </View>

            {/* Botão Salvar */}
            <TouchableOpacity 
                style={[styles.saveButton, isSaving && styles.disabledBtn, { zIndex: 0 }]} 
                onPress={handleSubmit}
                disabled={isSaving}
            >
                {isSaving ? (
                    <View style={{flexDirection: 'row', gap: 8, alignItems: 'center'}}>
                        <ActivityIndicator color="#FFF" />
                        <Text style={styles.saveText}>Salvando...</Text>
                    </View>
                ) : (
                    <Text style={styles.saveText}>Salvar Perfil</Text>
                )}
            </TouchableOpacity>

        </ScrollView>

        {/* Componentes Modais (Renderizados fora do fluxo principal) */}
        {renderDateTimePicker(showDatePicker, setShowDatePicker, birthDate, 'date', setBirthDate)}
        {renderDateTimePicker(showTimePicker, setShowTimePicker, birthTime, 'time', setBirthTime)}

        <Modal visible={showGenderPicker} transparent animationType="fade">
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowGenderPicker(false)}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Selecione seu Gênero</Text>
                        <TouchableOpacity onPress={() => setShowGenderPicker(false)}><X size={24} color="#9CA3AF" /></TouchableOpacity>
                    </View>
                    {GENDER_OPTIONS.map((opt) => (
                        <TouchableOpacity key={opt.value} style={styles.modalOption} onPress={() => { setGender(opt.value); setShowGenderPicker(false); }}>
                            <Text style={[styles.modalOptionText, gender === opt.value && styles.activeOptionText]}>{opt.label}</Text>
                            {gender === opt.value && <Check size={20} color="#6366F1" />}
                        </TouchableOpacity>
                    ))}
                </View>
            </TouchableOpacity>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111827' },
  
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#374151', zIndex: 50 },
  backBtn: { padding: 4 },
  headerTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  
  scroll: { padding: 20, paddingBottom: 50 },
  
  avatarSection: { alignItems: 'center', marginBottom: 24, zIndex: 1 },
  avatarWrapper: { position: 'relative', marginBottom: 8 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#6366F1', backgroundColor: '#374151' },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#6366F1', padding: 8, borderRadius: 20, borderWidth: 2, borderColor: '#1F2937', shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity:0.3, shadowRadius:2 },
  changePhotoText: { color: '#6366F1', fontSize: 14, fontWeight: '600' },
  
  form: { gap: 16 },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  inputGroup: { gap: 6 },
  borderTop: { borderTopWidth: 1, borderTopColor: '#374151', paddingTop: 16, marginTop: 8 },
  
  label: { color: '#D1D5DB', fontSize: 14, fontWeight: '500' },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  
  input: { backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151', borderRadius: 8, padding: 12, color: '#FFF', fontSize: 16, minHeight: 50 },
  inputBtn: { backgroundColor: '#1F2937', borderWidth: 1, borderColor: '#374151', borderRadius: 8, paddingHorizontal: 12, height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inputText: { color: '#FFF', fontSize: 16 },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  
  saveButton: { backgroundColor: '#16A34A', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 30, shadowColor: "#16A34A", shadowOffset: {width:0, height:4}, shadowOpacity:0.2, shadowRadius:4 },
  saveText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  disabledBtn: { opacity: 0.7 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1F2937', width: '100%', maxWidth: 340, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#374151' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  modalOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#374151' },
  modalOptionText: { color: '#D1D5DB', fontSize: 16 },
  activeOptionText: { color: '#6366F1', fontWeight: 'bold' },
  
  iosPickerModalContent: { width: '100%', backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', paddingBottom: 20 },
  iosPickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#F3F4F6', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  iosPickerTitle: { color: '#111827', fontSize: 16, fontWeight: 'bold' },
  iosConfirmBtn: { backgroundColor: '#6366F1', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 6 },
  iosConfirmText: { color: 'white', fontWeight: 'bold', fontSize: 14 }
});