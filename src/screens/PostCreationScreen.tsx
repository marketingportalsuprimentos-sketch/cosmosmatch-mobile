import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, Image, TextInput, 
  ActivityIndicator, Alert, Dimensions, KeyboardAvoidingView, Platform, LogBox, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useCreatePost } from '../features/feed/hooks/useFeed';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';

// Ignora aviso de deprecated
LogBox.ignoreLogs(['Video component from `expo-av` is deprecated']);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function PostCreationScreen() {
  const navigation = useNavigation<any>();
  const { mutate: createPost, isPending } = useCreatePost();

  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [caption, setCaption] = useState('');
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const processMedia = (asset: ImagePicker.ImagePickerAsset) => {
    if (asset.type === 'video') {
      const durationSec = (asset.duration || 0) / 1000; 
      // Validação de 3 a 7 segundos
      if (durationSec > 0 && (durationSec < 3 || durationSec > 7)) { 
         Alert.alert("Vídeo inválido", "O vídeo deve ter entre 3 e 6 segundos.");
         return;
      }
      setVideoDuration(durationSec);
      setMediaType('video');
    } else {
      setMediaType('image');
      setVideoDuration(null);
    }
    setMediaUri(asset.uri);
  };

  const openGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
      videoMaxDuration: 6,
    });
    if (!result.canceled) processMedia(result.assets[0]);
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permissão", "Você precisa permitir o acesso à câmera.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [9, 16],
      quality: 0.8,
      videoMaxDuration: 6,
    });
    if (!result.canceled) processMedia(result.assets[0]);
  };

  const handlePost = () => {
    if (!mediaUri) return;

    const formData = new FormData();
    const filename = mediaUri.split('/').pop() || 'upload.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `${mediaType}/${match[1]}` : (mediaType === 'video' ? 'video/mp4' : 'image/jpeg');

    // @ts-ignore
    formData.append('file', { uri: mediaUri, name: filename, type });
    formData.append('mediaType', mediaType === 'video' ? 'VIDEO' : 'PHOTO');
    if (caption) formData.append('content', caption);
    if (videoDuration) formData.append('videoDuration', Math.round(videoDuration).toString());

    createPost(formData, {
      onSuccess: () => {
        Alert.alert("Sucesso", "Post publicado! 🚀");
        setMediaUri(null);
        setCaption('');
        setMediaType(null);
        navigation.navigate('FeedTab');
      },
      onError: () => {
        Alert.alert("Erro", "Falha ao publicar. Tente novamente.");
      }
    });
  };

  const handleCancel = () => {
    setMediaUri(null);
    setCaption('');
    setMediaType(null);
    navigation.goBack();
  };

  // --- ESTADO 1: SELEÇÃO DE MÍDIA ---
  if (!mediaUri) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
           <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={30} color="white" />
           </TouchableOpacity>
           <Text style={styles.headerTitle}>Novo Post</Text>
           <View style={{width: 30}} />
        </View>

        <View style={styles.actionsContainer}>
           <Text style={styles.instructionText}>Compartilhe seu momento ✨</Text>
           <TouchableOpacity style={styles.bigButton} onPress={openCamera}>
              <LinearGradient colors={['#EC4899', '#8B5CF6']} style={styles.gradientButton}>
                 <Ionicons name="camera-outline" size={32} color="white" />
                 <Text style={styles.bigButtonText}>Abrir Câmera</Text>
              </LinearGradient>
           </TouchableOpacity>
           <TouchableOpacity style={styles.bigButton} onPress={openGallery}>
              <LinearGradient colors={['#374151', '#1F2937']} style={styles.gradientButton}>
                 <Ionicons name="images-outline" size={32} color="white" />
                 <Text style={styles.bigButtonText}>Galeria</Text>
              </LinearGradient>
           </TouchableOpacity>
           <Text style={styles.hintText}>Vídeos curtos (3-6s)</Text>
        </View>
      </View>
    );
  }

  // --- ESTADO 2: PREVIEW E LEGENDA ---
  return (
    <View style={styles.container}>
        <StatusBar hidden />
        
        {/* CAMADA 1: MÍDIA (Fica no fundo) */}
        <View style={styles.mediaLayer}>
            {mediaType === 'video' ? (
                <Video
                    source={{ uri: mediaUri }}
                    style={styles.fullScreenMedia}
                    resizeMode={ResizeMode.COVER}
                    shouldPlay={true}
                    isLooping={true}
                    isMuted={false}
                />
            ) : (
                <Image 
                    source={{ uri: mediaUri }} 
                    style={styles.fullScreenMedia} 
                    resizeMode="cover" 
                />
            )}
        </View>

        {/* CAMADA 2: INTERFACE (Fica por cima) */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.interfaceLayer}
        >
            <LinearGradient
               colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.8)']}
               style={styles.gradientOverlay}
            >
               {/* Botão Fechar */}
               <View style={styles.topBar}>
                   <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
                      <Ionicons name="close-circle" size={40} color="white" />
                   </TouchableOpacity>
               </View>

               {/* Área Inferior */}
               <View style={styles.bottomArea}>
                  <Text style={styles.label}>Legenda</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Escreva algo..."
                    placeholderTextColor="#ccc"
                    multiline
                    maxLength={200}
                    value={caption}
                    onChangeText={setCaption}
                  />

                  <TouchableOpacity 
                    style={[styles.postButton, isPending && styles.disabledButton]} 
                    onPress={handlePost}
                    disabled={isPending}
                  >
                     {isPending ? (
                        <ActivityIndicator color="white" />
                     ) : (
                        <Text style={styles.postButtonText}>Publicar ✨</Text>
                     )}
                  </TouchableOpacity>
               </View>
            </LinearGradient>
        </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  
  // Seleção
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 60, alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  actionsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20, paddingBottom: 100 },
  instructionText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  bigButton: { width: 250, height: 60, borderRadius: 30, overflow: 'hidden' },
  gradientButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  bigButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  hintText: { color: '#6B7280', marginTop: 10 },

  // Preview Layout
  mediaLayer: {
    ...StyleSheet.absoluteFillObject, // Ocupa tela toda
    zIndex: 0,
  },
  fullScreenMedia: {
    width: '100%',
    height: '100%',
  },
  
  interfaceLayer: {
    flex: 1,
    zIndex: 1, // Fica acima da mídia
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  
  topBar: { paddingTop: 40, alignSelf: 'flex-start' },
  closeButton: { padding: 5, shadowColor: 'black', shadowOpacity: 0.5, shadowRadius: 5 },
  
  bottomArea: { width: '100%', paddingBottom: 20 },
  label: { color: 'white', fontWeight: 'bold', marginBottom: 10, textShadowColor:'black', textShadowRadius: 5 },
  input: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 15, padding: 15, color: 'white', fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  
  postButton: { backgroundColor: '#8B5CF6', padding: 15, borderRadius: 30, alignItems: 'center', shadowColor: "#8B5CF6", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.5, shadowRadius: 5 },
  disabledButton: { opacity: 0.7 },
  postButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});