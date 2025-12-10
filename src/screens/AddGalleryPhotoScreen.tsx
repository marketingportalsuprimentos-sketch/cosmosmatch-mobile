// mobile/src/screens/AddGalleryPhotoScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Image, 
    Alert, 
    ActivityIndicator,
    Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAddGalleryPhoto } from '../hooks/useGalleryHooks'; // Importando do arquivo correto

export const AddGalleryPhotoScreen = () => {
    const navigation = useNavigation();
    
    // Usando o hook real agora
    const { mutate: addPhoto, isPending, error: mutationError } = useAddGalleryPhoto();

    const [selectedUri, setSelectedUri] = useState<string | null>(null); 
    const [localError, setLocalError] = useState<string | null>(null);
    const [showOptions, setShowOptions] = useState(false); // Modal para escolher camera ou galeria

    // Configuração OTIMIZADA para evitar Crash (Out of Memory)
    const imagePickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Permite cortar quadrado
        aspect: [1, 1],
        quality: 0.5, // CRUCIAL: 0.5 reduz drasticamente o uso de RAM sem perder muita qualidade visual no celular
    };

    // Opção 1: Abrir Câmera
    const handleCamera = async () => {
        setShowOptions(false);
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão', 'Precisamos de acesso à câmera.');
            return;
        }

        try {
            const result = await ImagePicker.launchCameraAsync(imagePickerOptions);
            if (!result.canceled && result.assets?.[0]) {
                setSelectedUri(result.assets[0].uri);
                setLocalError(null);
            }
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível abrir a câmera.');
        }
    };

    // Opção 2: Abrir Galeria
    const handleGallery = async () => {
        setShowOptions(false);
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permissão', 'Precisamos de acesso à galeria.');
            return;
        }

        try {
            const result = await ImagePicker.launchImageLibraryAsync(imagePickerOptions);
            if (!result.canceled && result.assets?.[0]) {
                setSelectedUri(result.assets[0].uri);
                setLocalError(null);
            }
        } catch (e) {
            Alert.alert('Erro', 'Não foi possível abrir a galeria.');
        }
    };

    const handleSubmit = () => {
        if (!selectedUri) {
            setLocalError('Por favor, tire uma foto ou selecione uma imagem.');
            return;
        }

        addPhoto(selectedUri, {
            onSuccess: () => {
                Alert.alert('Sucesso!', 'Foto adicionada à galeria.');
                navigation.goBack(); 
            },
            onError: (err: any) => {
                const msg = err.response?.data?.message || err.message || 'Erro ao enviar foto.';
                setLocalError(msg);
            },
        });
    };

    // Limpa estado ao focar
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setSelectedUri(null);
            setLocalError(null);
        });
        return unsubscribe;
    }, [navigation]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Nova Foto</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#D1D5DB" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                
                {/* Área de Visualização e Seleção */}
                <TouchableOpacity
                    style={styles.uploadArea}
                    onPress={() => setShowOptions(true)}
                    disabled={isPending}
                >
                    {selectedUri ? (
                        <Image source={{ uri: selectedUri }} style={styles.imagePreview} />
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="camera" size={48} color="#A855F7" />
                            <Text style={styles.placeholderText}>
                                Tocar para adicionar
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Erros */}
                {(localError || mutationError) && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>
                            {localError || (mutationError as any)?.message}
                        </Text>
                    </View>
                )}

                {/* Botão de Envio */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={!selectedUri || isPending}
                    style={[
                        styles.submitButton, 
                        (!selectedUri || isPending) && styles.disabledButton
                    ]}
                >
                    {isPending ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            Salvar na Galeria
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* Modal de Seleção (Câmera ou Galeria) */}
            <Modal
                visible={showOptions}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowOptions(false)}
            >
                <TouchableOpacity 
                    style={styles.modalOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShowOptions(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Escolher origem</Text>
                        
                        <TouchableOpacity style={styles.modalOption} onPress={handleCamera}>
                            <Ionicons name="camera-outline" size={24} color="#FFF" />
                            <Text style={styles.modalOptionText}>Tirar Foto</Text>
                        </TouchableOpacity>
                        
                        <View style={styles.separator} />

                        <TouchableOpacity style={styles.modalOption} onPress={handleGallery}>
                            <Ionicons name="images-outline" size={24} color="#FFF" />
                            <Text style={styles.modalOptionText}>Abrir Galeria</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827',
    },
    header: {
        paddingTop: 50,
        paddingHorizontal: 16,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    closeButton: {
        position: 'absolute',
        right: 16,
        top: 50,
        padding: 5,
    },
    content: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    uploadArea: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#374151',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1F2937',
        marginBottom: 20,
        overflow: 'hidden',
    },
    placeholder: {
        alignItems: 'center',
        gap: 5,
    },
    placeholderText: {
        color: '#D1D5DB',
        fontSize: 16,
        fontWeight: '500',
        marginTop: 10,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    submitButton: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#4F46E5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    disabledButton: {
        opacity: 0.5,
    },
    errorBox: {
        width: '100%',
        backgroundColor: '#991B1B',
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F87171',
    },
    errorText: {
        color: '#FEE2E2',
        fontSize: 14,
        textAlign: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: '80%',
        backgroundColor: '#1F2937',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#374151',
    },
    modalTitle: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        gap: 12,
    },
    modalOptionText: {
        color: '#FFF',
        fontSize: 16,
    },
    separator: {
        height: 1,
        backgroundColor: '#374151',
        marginVertical: 4,
    }
});