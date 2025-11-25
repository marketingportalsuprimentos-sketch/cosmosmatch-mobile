// mobile/src/components/ProfileGalleryGrid.tsx
import React, { useCallback, useMemo } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    TouchableOpacity, 
    Image,
    Dimensions,
    Alert
} from 'react-native';
// Ícones do Expo para substituir os Heroicons
import { Ionicons } from '@expo/vector-icons'; 

// Obter a largura da tela para calcular o tamanho dos itens da grelha
const { width: screenWidth } = Dimensions.get('window');

// --- TIPOS E MOCKS (Substitua pelos seus tipos e hooks reais) ---

// Tipo de Foto (Baseado no seu profile.types.ts)
interface ProfilePhoto {
    id: string;
    url: string;
    likesCount: number;
    commentsCount: number;
    isLikedByMe: boolean;
}

// MOCK: Hook para dar Like
const useLikeGalleryPhoto = () => ({
    mutate: (photoId: string, options: any) => {
        console.log('Mock: Liking photo:', photoId);
        // Simulação de sucesso
        options.onSuccess(); 
    },
    isPending: false,
});

// MOCK: Hook para remover Like (Unlike)
const useUnlikeGalleryPhoto = () => ({
    mutate: (photoId: string, options: any) => {
        console.log('Mock: Unliking photo:', photoId);
        // Simulação de sucesso
        options.onSuccess(); 
    },
    isPending: false,
});

// Funções de formatação e URLs (Copie do seu Web App, se diferente)
const defaultAvatar = 'https://i.pravatar.cc/300?img=1'; 
const toPublicUrl = (path?: string | null) => path || defaultAvatar;

// --- COMPONENTE PRINCIPAL ---

interface ProfileGalleryGridProps {
    photos: ProfilePhoto[]; 
    isOwner: boolean; 
    profileUserId: string;
    onAddPhotoClick: () => void; 
    onPhotoClick: (photo: ProfilePhoto, index: number) => void; 
}

// Configuração da grelha: 3 colunas, 1 pixel de espaço
const NUM_COLUMNS = 3;
const GRID_GAP = 1;
// O paddingHorizontal é 20, vindo do ProfileScreen, mas o componente é genérico
// Vamos assumir que a largura total é a largura do ecrã.
const PADDING_HORIZONTAL = 0; 
const ITEM_WIDTH = Math.floor(
    (screenWidth - PADDING_HORIZONTAL * 2 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS
);
const ITEM_HEIGHT = ITEM_WIDTH; // Quadrado perfeito

export const ProfileGalleryGrid = ({
    photos,
    isOwner,
    profileUserId,
    onAddPhotoClick,
    onPhotoClick,
}: ProfileGalleryGridProps) => {

    const { mutate: likePhoto } = useLikeGalleryPhoto();
    const { mutate: unlikePhoto } = useUnlikeGalleryPhoto();

    // Adiciona o slot "Adicionar Foto" se for o proprietário
    const galleryItems = useMemo(() => {
        if (isOwner) {
            // Cria um placeholder para o botão de adicionar foto (sem ID)
            const addPhotoPlaceholder = {
                id: 'add-photo-button', 
                url: '',
                likesCount: 0,
                commentsCount: 0,
                isLikedByMe: false,
            } as ProfilePhoto;
            return [addPhotoPlaceholder, ...photos];
        }
        return photos;
    }, [isOwner, photos]);

    // Handler para o Like/Unlike
    const handleLikeToggle = useCallback((photo: ProfilePhoto) => {
        if (isOwner) {
             Alert.alert('Ação Inválida', 'Não pode dar like nas suas próprias fotos.');
             return;
        }

        const mutationOptions = {
            onSuccess: () => {
                // Notificação de sucesso
                console.log(`Sucesso! ${photo.isLikedByMe ? 'Unlike' : 'Like'} na foto ${photo.id}`);
                // Numa aplicação real, o React Query invalidaria o cache aqui (e o profileUserId seria usado)
            },
            onError: (error: any) => {
                 Alert.alert('Erro', `Não foi possível processar o like/unlike. ${error.message || ''}`);
            }
        };

        if (photo.isLikedByMe) {
            unlikePhoto(photo.id, mutationOptions);
        } else {
            likePhoto(photo.id, mutationOptions);
        }
    }, [isOwner, likePhoto, unlikePhoto]);

    // Handler de clique no item
    const handleItemClick = useCallback((item: ProfilePhoto, index: number) => {
        if (isOwner && item.id === 'add-photo-button') {
            onAddPhotoClick();
        } else {
            onPhotoClick(item, index);
        }
    }, [isOwner, onAddPhotoClick, onPhotoClick]);

    if (galleryItems.length === 0 && !isOwner) {
        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyText}>Este utilizador ainda não adicionou fotos à galeria.</Text>
            </View>
        );
    }

    return (
        <View style={styles.gridContainer}>
            {galleryItems.map((item, index) => {
                
                // Renderizar o botão 'Adicionar Foto'
                if (isOwner && item.id === 'add-photo-button') {
                    return (
                        <TouchableOpacity
                            key="add-photo"
                            style={[styles.gridItem, styles.addPhotoItem]}
                            onPress={() => handleItemClick(item, index)}
                        >
                            <Ionicons name="add" size={36} color="#A855F7" />
                            <Text style={styles.addPhotoText}>Adicionar Foto</Text>
                        </TouchableOpacity>
                    );
                }

                // Renderizar uma foto normal
                const photo = item;
                const publicUrl = toPublicUrl(photo.url);

                return (
                    <TouchableOpacity
                        key={photo.id}
                        style={styles.gridItem}
                        onPress={() => handleItemClick(photo, index)}
                    >
                        <Image source={{ uri: publicUrl }} style={styles.image} />
                        
                        {/* Botão de Like/Unlike (Apenas para outros utilizadores) */}
                        {!isOwner && (
                            <TouchableOpacity
                                style={styles.likeButton}
                                onPress={() => handleLikeToggle(photo)}
                            >
                                <Ionicons 
                                    name={photo.isLikedByMe ? "heart" : "heart-outline"} 
                                    size={20} 
                                    color={photo.isLikedByMe ? "#EF4444" : "#FFFFFF"} 
                                />
                            </TouchableOpacity>
                        )}
                        
                        {/* Contadores (Likes e Comentários) */}
                        <View style={styles.counterGroup}>
                            <View style={styles.counterItem}>
                                <Ionicons name="heart" size={14} color="white" />
                                <Text style={styles.counterText}>{photo.likesCount}</Text>
                            </View>
                            <View style={styles.counterItem}>
                                <Ionicons name="chatbubble-ellipses" size={14} color="white" />
                                <Text style={styles.counterText}>{photo.commentsCount}</Text>
                            </View>
                        </View>

                    </TouchableOpacity>
                );
            })}
        </View>
    );
};


// --- ESTILOS ---
const styles = StyleSheet.create({
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: -GRID_GAP / 2, // Compensa a margem dos itens
    },
    gridItem: {
        width: ITEM_WIDTH,
        height: ITEM_HEIGHT,
        margin: GRID_GAP / 2,
        borderRadius: 8,
        overflow: 'hidden', // Importante para o Image
        backgroundColor: '#374151', // Gray 700
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    // Adicionar Foto
    addPhotoItem: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#A855F7',
        borderStyle: 'dashed',
        backgroundColor: '#1F2937', // Gray 800
    },
    addPhotoText: {
        color: '#D1D5DB', // Gray 300
        marginTop: 5,
        fontSize: 12,
        textAlign: 'center',
    },
    // Botão Like
    likeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        padding: 6,
        borderRadius: 18,
        backgroundColor: 'rgba(17, 24, 32, 0.6)', // Gray 900 com transparência
    },
    // Contadores
    counterGroup: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(17, 24, 32, 0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    counterItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    counterText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    // Empty State
    emptyState: {
        padding: 20,
        backgroundColor: '#1F2937',
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    emptyText: {
        color: '#9CA3AF',
        textAlign: 'center',
    }
});