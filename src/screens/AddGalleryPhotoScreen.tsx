// mobile/src/screens/AddGalleryPhotoScreen.tsx
import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Image, 
    Alert, 
    ActivityIndicator 
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { api } from '../services/api'; // Certifique-se que o seu axios `api` está importado
import { useQueryClient } from '@tanstack/react-query'; // Para invalidar o cache

// --- TIPOS E MOCKS (Substitua pelo seu hook real de mutation) ---

// MOCK: Hook para Adicionar Foto (A SUA IMPLEMENTAÇÃO REAL)
// Este mock simula o uso do `api` para enviar FormData no React Native.
const useAddPhotoToGallery = () => {
    const queryClient = useQueryClient();
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mutate = async (fileUri: string, onSuccess: () => void, onError: (e: Error) => void) => {
        setIsPending(true);
        setError(null);

        try {
            // CRUCIAL: Construção do FormData para React Native
            const formData = new FormData();
            const uriParts = fileUri.split('.');
            const fileType = uriParts[uriParts.length - 1];
            const mimeType = fileType === 'jpg' ? 'image/jpeg' : `image/${fileType}`;

            // O nome do campo no backend deve ser 'file' (conforme o seu Web App)
            formData.append('file', {
                uri: fileUri,
                name: `photo.${fileType}`,
                type: mimeType,
            } as any); // 'as any' é necessário para a tipagem do FormData no RN

            // A chamada real para a API
            await api.post('/profile/gallery', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            // Invalida o cache da galeria para o ecrã atualizar automaticamente
            queryClient.invalidateQueries({ queryKey: ['galleryPhotos'] });
            
            onSuccess();
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.message || 'Erro desconhecido ao carregar a foto.';
            setError(new Error(errorMessage));
            onError(new Error(errorMessage));
        } finally {
            setIsPending(false);
        }
    };

    return { 
        mutate: (fileUri: string, options: { onSuccess: () => void, onError: (e: Error) => void }) => {
            mutate(fileUri, options.onSuccess, options.onError);
        },
        isPending, 
        error
    };
};

// --- COMPONENTE PRINCIPAL ---

export const AddGalleryPhotoScreen = () => {
    const navigation = useNavigation();
    const { mutate: addPhotoMutate, isPending, error: mutationError } = useAddPhotoToGallery();

    // No Mobile, usamos o URI do asset selecionado em vez do objeto File
    const [selectedUri, setSelectedUri] = useState<string | null>(null); 
    const [error, setError] = useState<string | null>(null);

    // Lida com a permissão da galeria e a seleção da imagem
    const handlePickImage = async () => {
        // Pedir permissão
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Permissão Necessária',
                'Precisamos da sua permissão para aceder à sua galeria de fotos.'
            );
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false, // Pode adicionar corte depois, se necessário
            aspect: [1, 1], // Fotos quadradas (opcional)
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const asset = result.assets[0];
            
            // Validação de tamanho (Se necessário, como no seu Web App)
            // No RN, o ImagePicker não dá o tamanho fácil. Terá de ser no backend.
            
            setSelectedUri(asset.uri);
            setError(null);
        }
    };

    const handleSubmit = () => {
        if (!selectedUri) {
            setError('Por favor, selecione uma imagem para carregar.');
            return;
        }

        addPhotoMutate(selectedUri, {
            onSuccess: () => {
                Alert.alert('Sucesso!', 'Foto adicionada à galeria.');
                // Navega de volta para o ecrã anterior (Perfil)
                navigation.goBack(); 
            },
            onError: (err) => {
                // O hook trata do estado de erro, apenas exibimos um alerta
                Alert.alert('Erro ao carregar', err.message);
            },
        });
    };

    // Reseta o estado ao entrar no ecrã (se estiver a ser usado como modal/screen)
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            setSelectedUri(null);
            setError(null);
        });
        return unsubscribe;
    }, [navigation]);


    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Adicionar Foto à Galeria</Text>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color="#D1D5DB" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                
                {/* Área de Visualização e Seleção */}
                <TouchableOpacity
                    style={styles.uploadArea}
                    onPress={handlePickImage}
                    disabled={isPending}
                >
                    {selectedUri ? (
                        <Image source={{ uri: selectedUri }} style={styles.imagePreview} />
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="image-outline" size={48} color="#A855F7" />
                            <Text style={styles.placeholderText}>
                                Tocar para selecionar foto
                            </Text>
                            <Text style={styles.placeholderSubText}>
                                (Formatos: JPG, PNG)
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Erros */}
                {(error || mutationError) && (
                    <View style={styles.errorBox}>
                        <Text style={styles.errorText}>
                            {error || mutationError?.message}
                        </Text>
                    </View>
                )}

                {/* Botão de Envio */}
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={!selectedUri || isPending || !!error}
                    style={[
                        styles.submitButton, 
                        (!selectedUri || isPending || !!error) && styles.disabledButton
                    ]}
                >
                    {isPending ? (
                        <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>
                            Adicionar à Galeria
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};


// --- ESTILOS ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827', // Gray 900
    },
    header: {
        paddingTop: 50, // Espaço para a barra de status
        paddingHorizontal: 16,
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#1F2937', // Gray 800
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
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
    // Área de upload
    uploadArea: {
        width: '100%',
        aspectRatio: 1, // Quadrado
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#374151', // Gray 700
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1F2937', // Gray 800
        marginBottom: 20,
        overflow: 'hidden',
    },
    placeholder: {
        alignItems: 'center',
        gap: 5,
    },
    placeholderText: {
        color: '#D1D5DB', // Gray 300
        fontSize: 16,
        fontWeight: '500',
        marginTop: 10,
    },
    placeholderSubText: {
        color: '#6B7280', // Gray 500
        fontSize: 12,
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    // Botão de Envio
    submitButton: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 10,
        backgroundColor: '#4F46E5', // Indigo 600
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
    // Erros
    errorBox: {
        width: '100%',
        backgroundColor: '#991B1B', // Red 800
        padding: 12,
        borderRadius: 8,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#F87171',
    },
    errorText: {
        color: '#FEE2E2', // Red 100
        fontSize: 14,
        textAlign: 'center',
    }
});