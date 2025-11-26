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
import { useTranslation } from 'react-i18next'; // <--- Import i18n

LogBox.ignoreLogs(['Video component from `expo-av` is deprecated', 'MediaTypeOptions']);

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Limite de tempo (23 segundos)
const MAX_VIDEO_DURATION = 23; 

export default function PostCreationScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { mutate: createPost, isPending } = useCreatePost();

  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [caption, setCaption] = useState('');
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const processMedia = (asset: ImagePicker.ImagePickerAsset) => {
    console.log('Mídia processada:', asset.type, 'Tamanho:', asset.fileSize, 'Duração:', asset.duration);
    
    if (asset.type === 'video') {
      const durationSec = (asset.duration || 0) / 1000; 
      
      if (durationSec > (MAX_VIDEO_DURATION + 3)) { 
         Alert.alert(
             t('video_too_long_title'), // "Vídeo muito longo"
             t('video_too_long_msg', { duration: MAX_VIDEO_DURATION }) // "O limite é de 23 segundos..."
         );
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
    try {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.All,
            allowsEditing: false, 
            quality: 0.6, 
            videoMaxDuration: MAX_VIDEO_DURATION,
        });
        if (!result.canceled) processMedia(result.assets[0]);
    } catch (error) {
        Alert.alert(t('error'), t('error_gallery'));
    }
  };

  const openCamera = async (mode: 'photo' | 'video') => {
    try {
        const cameraPerm = await ImagePicker.requestCameraPermissionsAsync();
        
        if (cameraPerm.status !== 'granted') {
            Alert.alert(t('permission_denied'), t('enable_camera_permission'));
            return;
        }

        console.log(`Abrindo câmera no modo: ${mode}`);
        
        const mediaTypes = mode === 'video' 
            ? ImagePicker.MediaTypeOptions.Videos 
            : ImagePicker.MediaTypeOptions.Images;

        let result;

        if (mode === 'video') {
            result = await ImagePicker.launchCameraAsync({
                mediaTypes: mediaTypes,
                allowsEditing: false,
                // Qualidade média = Arquivos menores que passam no servidor
                videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
                quality: 0.6,
                videoMaxDuration: MAX_VIDEO_DURATION, 
            });
        } else {
            result = await ImagePicker.launchCameraAsync({
                mediaTypes: mediaTypes,
                allowsEditing: false,
                quality: 0.5, 
                exif: false,
            });
        }

        if (!result.canceled) {
            processMedia(result.assets[0]);
        }

    } catch (error) {
        console.error("Erro Câmera:", error);
        const errorMsg = (error as any)?.message || t('unknown_error');
        Alert.alert(t('error'), `${t('error_capture')}: ${errorMsg}`);
    }
  };

  // --- CORREÇÃO PRINCIPAL NO UPLOAD ---
  const handlePost = () => {
    if (!mediaUri) return;

    const formData = new FormData();

    // 1. Força o nome e tipo corretos (Evita erro 400 no Android)
    let filename = mediaUri.split('/').pop() || 'upload';
    let type = '';

    if (mediaType === 'video') {
        // Se não tiver extensão ou for estranha, força .mp4
        if (!filename.toLowerCase().endsWith('.mp4')) {
            filename = `${filename}.mp4`;
        }
        type = 'video/mp4';
    } else {
        if (!filename.toLowerCase().endsWith('.jpg') && !filename.toLowerCase().endsWith('.png')) {
            filename = `${filename}.jpg`;
        }
        type = 'image/jpeg';
    }

    console.log('Enviando:', { uri: mediaUri, name: filename, type });

    // @ts-ignore
    formData.append('file', { uri: mediaUri, name: filename, type });
    formData.append('mediaType', mediaType === 'video' ? 'VIDEO' : 'PHOTO');
    
    if (caption) formData.append('content', caption);
    if (videoDuration) formData.append('videoDuration', Math.round(videoDuration).toString());

    createPost(formData, {
      onSuccess: () => {
        Alert.alert(t('success'), t('post_published'));
        setMediaUri(null);
        setCaption('');
        setMediaType(null);
        navigation.navigate('FeedTab');
      },
      onError: (error: any) => {
        console.log('Erro detalhado upload:', error.response?.data || error.message);
        
        // Se for erro 400, pode ser validação de campo
        if (error.response?.status === 400) {
             const msg = error.response?.data?.message;
             // Verifica se é erro de DTO (array de erros) ou mensagem simples
             const alerta = Array.isArray(msg) ? msg[0] : msg || t('invalid_data');
             Alert.alert(t('upload_error'), `${t('server_refused')}: ${alerta}`);
        } else {
             Alert.alert(t('error'), t('publish_failed'));
        }
      }
    });
  };

  const handleCancel = () => {
    setMediaUri(null);
    setCaption('');
    setMediaType(null);
    navigation.goBack();
  };

  // --- RENDER ---
  if (!mediaUri) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
           <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="close" size={30} color="white" />
           </TouchableOpacity>
           <Text style={styles.headerTitle}>{t('new_post')}</Text>
           <View style={{width: 30}} />
        </View>

        <View style={styles.actionsContainer}>
           <Text style={styles.instructionText}>{t('what_to_post')} ✨</Text>
           
           <TouchableOpacity style={styles.bigButton} onPress={() => openCamera('photo')}>
              <LinearGradient colors={['#EC4899', '#DB2777']} style={styles.gradientButton}>
                 <Ionicons name="camera" size={32} color="white" />
                 <Text style={styles.bigButtonText}>{t('take_photo')}</Text>
              </LinearGradient>
           </TouchableOpacity>

           <TouchableOpacity style={styles.bigButton} onPress={() => openCamera('video')}>
              <LinearGradient colors={['#8B5CF6', '#7C3AED']} style={styles.gradientButton}>
                 <Ionicons name="videocam" size={32} color="white" />
                 <Text style={styles.bigButtonText}>{t('record_video')}</Text>
              </LinearGradient>
           </TouchableOpacity>

           <TouchableOpacity style={styles.bigButton} onPress={openGallery}>
              <LinearGradient colors={['#374151', '#1F2937']} style={styles.gradientButton}>
                 <Ionicons name="images" size={32} color="white" />
                 <Text style={styles.bigButtonText}>{t('open_gallery')}</Text>
              </LinearGradient>
           </TouchableOpacity>
           
           <Text style={styles.hintText}>{t('video_limit_hint', { duration: MAX_VIDEO_DURATION })}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
        <StatusBar hidden />
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
                <Image source={{ uri: mediaUri }} style={styles.fullScreenMedia} resizeMode="cover" />
            )}
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.interfaceLayer}>
            <LinearGradient colors={['rgba(0,0,0,0.3)', 'transparent', 'rgba(0,0,0,0.8)']} style={styles.gradientOverlay}>
               <View style={styles.topBar}>
                   <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
                      <Ionicons name="close-circle" size={40} color="white" />
                   </TouchableOpacity>
               </View>
               <View style={styles.bottomArea}>
                  <Text style={styles.label}>{t('caption')}</Text>
                  <TextInput
                    style={styles.input}
                    placeholder={t('write_something')}
                    placeholderTextColor="#ccc"
                    multiline
                    maxLength={200}
                    value={caption}
                    onChangeText={setCaption}
                  />
                  <TouchableOpacity style={[styles.postButton, isPending && styles.disabledButton]} onPress={handlePost} disabled={isPending}>
                     {isPending ? <ActivityIndicator color="white" /> : <Text style={styles.postButtonText}>{t('publish')} ✨</Text>}
                  </TouchableOpacity>
               </View>
            </LinearGradient>
        </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 60, alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  actionsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20, paddingBottom: 100 },
  instructionText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  bigButton: { width: 280, height: 60, borderRadius: 30, overflow: 'hidden' },
  gradientButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  bigButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  hintText: { color: '#6B7280', marginTop: 10 },
  mediaLayer: { ...StyleSheet.absoluteFillObject, zIndex: 0 },
  fullScreenMedia: { width: '100%', height: '100%' },
  interfaceLayer: { flex: 1, zIndex: 1 },
  gradientOverlay: { flex: 1, justifyContent: 'space-between', padding: 20 },
  topBar: { paddingTop: 40, alignSelf: 'flex-start' },
  closeButton: { padding: 5, shadowColor: 'black', shadowOpacity: 0.5, shadowRadius: 5 },
  bottomArea: { width: '100%', paddingBottom: 20 },
  label: { color: 'white', fontWeight: 'bold', marginBottom: 10, textShadowColor:'black', textShadowRadius: 5 },
  input: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 15, padding: 15, color: 'white', fontSize: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  postButton: { backgroundColor: '#8B5CF6', padding: 15, borderRadius: 30, alignItems: 'center', shadowColor: "#8B5CF6", shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.5, shadowRadius: 5 },
  disabledButton: { opacity: 0.7 },
  postButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18 }
});