// mobile/src/navigation/EditProfileScreen.tsx
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker'; 

// --- TIPOS E MOCKS (Substitua pelos seus hooks reais) ---

// Tipos de dados (simplificados do seu auth.types.ts e baseados no ProfilePage)
interface ProfileData {
  userId: string;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  birthDate: Date | null;
  birthTime: string | null;
  birthCity: string | null;
  currentCity: string | null;
  imageUrl: string | null;
}

// MOCK: Dados do Perfil (Completos para edição)
const mockProfile: ProfileData = {
    userId: 'myId',
    name: 'Astronauta Cósmico',
    username: 'cosmo_astro',
    email: 'astro@cosmosmatch.com',
    bio: 'Sou um explorador das estrelas, sempre em busca de novas sinastrias. Ascendente em Aquário.',
    birthDate: new Date('1990-03-21'),
    birthTime: '18:30',
    birthCity: 'Rio de Janeiro, RJ, Brasil',
    currentCity: 'São Paulo, SP, Brasil',
    imageUrl: 'https://i.pravatar.cc/300?img=15', // Mock Avatar
};

// MOCK: Hook para buscar dados do perfil (simula o useGetMyProfile)
const useGetMyProfile = () => {
    // Simulação de carregamento
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);
    
    return { 
        data: isLoading ? null : mockProfile, 
        isLoading, 
        isError: false, 
        refetch: () => {}
    };
};

// MOCK: Hook para atualizar dados do perfil (simula o useUpdateMyProfile)
const useUpdateMyProfile = () => ({ 
    mutate: (data: Partial<ProfileData>, options: any) => {
        // Simulação de atualização bem-sucedida
        console.log('Dados a atualizar:', data);
        Alert.alert('Sucesso!', 'Perfil atualizado com sucesso.');
        options.onSuccess();
    }, 
    isPending: false 
});

// Funções de formatação e URLs
const defaultAvatar = 'https://i.pravatar.cc/300?img=1'; 
const toPublicUrl = (path?: string | null) => path || defaultAvatar;

// --- COMPONENTE: Avatar e Upload ---

interface AvatarUploadProps {
  currentUrl: string;
  onSelectImage: (uri: string) => void;
}

const AvatarUpload = ({ currentUrl, onSelectImage }: AvatarUploadProps) => {
  const [image, setImage] = useState(currentUrl);

  const pickImage = useCallback(async () => {
    // Requisitar permissões (obrigatório no Expo)
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permissão necessária', 'É preciso permitir o acesso à galeria para fazer upload de fotos.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImage(uri);
      onSelectImage(uri);
    }
  }, [onSelectImage]);

  return (
    <View style={styles.avatarContainer}>
      <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
        <Image
          source={{ uri: image }}
          style={styles.avatar}
        />
        <View style={styles.cameraIcon}>
          <Ionicons name="camera" size={24} color="white" />
        </View>
      </TouchableOpacity>
      <Text style={styles.uploadText}>Clique para alterar a foto de perfil</Text>
    </View>
  );
};


// --- COMPONENTE PRINCIPAL (EditProfileScreen) ---

export function EditProfileScreen() {
  const navigation = useNavigation();
  
  // 1. Fetch de Dados
  const { data: profileData, isLoading, isError, refetch } = useGetMyProfile();
  
  // 2. State do Formulário
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  // 3. Mutação
  const { mutate: updateProfile, isPending: isSaving } = useUpdateMyProfile();

  // Inicializa o state do formulário quando os dados chegam
  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name,
        username: profileData.username,
        bio: profileData.bio,
        birthDate: profileData.birthDate,
        birthTime: profileData.birthTime,
        birthCity: profileData.birthCity,
        currentCity: profileData.currentCity,
        imageUrl: profileData.imageUrl,
      });
    }
  }, [profileData]);

  // Handle para mudança de texto
  const handleChange = useCallback((key: keyof ProfileData, value: string | Date | null) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  }, []);

  // Handle para mudança de data/hora (Ajustado para React Native Community DateTimePicker)
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedDate) {
        handleChange('birthDate', selectedDate);
    }
  };
  
  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (event.type === 'set' && selectedTime) {
        // Formata a hora para 'HH:mm' como no Web
        const timeString = selectedTime.toTimeString().slice(0, 5); 
        handleChange('birthTime', timeString);
    }
  };
  
  // Handle para salvar
  const handleSave = useCallback(() => {
    if (isSaving || !formData.name || !formData.username) {
        Alert.alert('Erro', 'Nome e nome de utilizador são obrigatórios.');
        return;
    }

    // 1. Limpeza e Validação (Simplificada)
    const dataToSave: Partial<ProfileData> = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        bio: formData.bio?.trim() || null,
        birthDate: formData.birthDate || null,
        birthTime: formData.birthTime || null,
        birthCity: formData.birthCity?.trim() || null,
        currentCity: formData.currentCity?.trim() || null,
        // (A lógica de upload de imagem real faria o upload e salvaria a URL aqui)
        imageUrl: formData.imageUrl,
    };

    updateProfile(dataToSave, {
        onSuccess: () => {
            // Volta para o perfil após salvar
            navigation.goBack(); 
        },
        onError: (error: any) => {
            Alert.alert('Erro ao Salvar', error.message || 'Não foi possível atualizar o perfil. Tente mais tarde.');
        }
    });

  }, [formData, isSaving, updateProfile, navigation]);
  
  // --- Estados de Carregamento e Erro ---
  if (isLoading || !profileData) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#A855F7" />
        <Text style={styles.loadingText}>A carregar dados do perfil...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Erro ao carregar o seu perfil.</Text>
        <TouchableOpacity onPress={refetch} style={styles.retryButton}>
           <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Fixo */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <TouchableOpacity 
            onPress={handleSave} 
            disabled={isSaving}
            style={styles.saveButton}
        >
            {isSaving ? (
                <ActivityIndicator size="small" color="#FFF" />
            ) : (
                <Text style={styles.saveButtonText}>Guardar</Text>
            )}
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* 1. Upload de Imagem de Perfil */}
        <AvatarUpload 
            currentUrl={toPublicUrl(formData.imageUrl)}
            onSelectImage={(uri) => handleChange('imageUrl', uri)}
        />
        
        {/* 2. Informações Básicas */}
        <SectionTitle title="Informações Básicas" />
        <CustomInput
            label="Nome"
            value={formData.name || ''}
            onChangeText={(text) => handleChange('name', text)}
            placeholder="Seu nome"
        />
        <CustomInput
            label="Nome de Utilizador"
            value={formData.username || ''}
            onChangeText={(text) => handleChange('username', text)}
            placeholder="@seuusername"
        />
        <CustomInput
            label="Biografia"
            value={formData.bio || ''}
            onChangeText={(text) => handleChange('bio', text)}
            placeholder="Fale um pouco sobre você..."
            multiline={true}
            numberOfLines={4}
            style={styles.bioInput}
        />

        {/* 3. Detalhes de Nascimento (Astrologia) */}
        <SectionTitle title="Detalhes de Nascimento (Astrologia)" />
        
        {/* Data de Nascimento */}
        <View>
            <Text style={styles.label}>Data de Nascimento</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                <Text style={styles.datePickerText}>
                    {formData.birthDate ? formData.birthDate.toLocaleDateString('pt-BR') : 'Selecione a data'}
                </Text>
            </TouchableOpacity>
            {showDatePicker && (
                <DateTimePicker
                    testID="datePicker"
                    value={formData.birthDate || new Date()}
                    mode="date"
                    display="default"
                    onChange={onDateChange}
                    maximumDate={new Date()}
                />
            )}
        </View>

        {/* Hora de Nascimento */}
        <View>
            <Text style={styles.label}>Hora de Nascimento</Text>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.datePickerButton}>
                <Text style={styles.datePickerText}>
                    {formData.birthTime || 'Selecione a hora (Ex: 18:30)'}
                </Text>
            </TouchableOpacity>
            {showTimePicker && (
                <DateTimePicker
                    testID="timePicker"
                    value={new Date()} // Usa data atual, mas só importa a hora
                    mode="time"
                    display="default"
                    onChange={onTimeChange}
                    is24Hour={true}
                />
            )}
        </View>
        
        {/* Cidade de Nascimento */}
        <CustomInput
            label="Cidade de Nascimento"
            value={formData.birthCity || ''}
            onChangeText={(text) => handleChange('birthCity', text)}
            placeholder="Ex: Rio de Janeiro, RJ, Brasil"
        />
        
        {/* Cidade Atual */}
        <CustomInput
            label="Localização Atual"
            value={formData.currentCity || ''}
            onChangeText={(text) => handleChange('currentCity', text)}
            placeholder="Ex: São Paulo, SP, Brasil"
        />
        
        {/* Espaço no final para evitar que o teclado tape o último input */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

// --- COMPONENTES AUXILIARES ---

interface CustomInputProps {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    multiline?: boolean;
    numberOfLines?: number;
    style?: any;
}

const CustomInput = ({ label, value, onChangeText, placeholder, multiline = false, numberOfLines, style }: CustomInputProps) => (
    <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
            style={[styles.input, multiline && styles.multilineInput, style]}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            value={value}
            onChangeText={onChangeText}
            multiline={multiline}
            numberOfLines={numberOfLines}
        />
    </View>
);

const SectionTitle = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
);

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // Gray 900
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 10,
  },
  errorText: {
    color: '#F87171',
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#A855F7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#1F2937', // Gray 800
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  saveButton: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Scroll Content
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // Avatar
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  avatarWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    resizeMode: 'cover',
    borderWidth: 3,
    borderColor: '#A855F7',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#A855F7',
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#111827',
  },
  uploadText: {
    marginTop: 8,
    color: '#D1D5DB',
    fontSize: 14,
  },
  // Formulário
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#A855F7',
    marginTop: 20,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    paddingBottom: 5,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#1F2937', // Gray 800
    color: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingVertical: 15,
  },
  bioInput: {
    height: 120,
  },
  // Date Picker
  datePickerButton: {
    backgroundColor: '#1F2937',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  datePickerText: {
    color: 'white',
    fontSize: 16,
  }
});