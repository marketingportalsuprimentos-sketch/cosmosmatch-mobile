import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { Plus, Heart, MessageCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next'; // <--- I18N
import { ProfilePhoto } from '../../../types/profile.types';

interface ProfileGalleryGridProps {
    photos: ProfilePhoto[];
    isOwner: boolean;
    onAddPhoto: () => void;
    onPhotoClick: (photo: ProfilePhoto) => void;
    profileUserId?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCREEN_PADDING = 16 * 2; 
const CARD_PADDING = 16 * 2;   
const TOTAL_SPACING_REMOVED = SCREEN_PADDING + CARD_PADDING; 
const GAP = 6; 
const AVAILABLE_WIDTH = SCREEN_WIDTH - TOTAL_SPACING_REMOVED;
const IMAGE_SIZE = (AVAILABLE_WIDTH - (GAP * 2)) / 3;
const MAX_GRID_HEIGHT = (IMAGE_SIZE * 2) + GAP;

export const ProfileGalleryGrid = ({ 
    photos, isOwner, onAddPhoto, onPhotoClick 
}: ProfileGalleryGridProps) => {
    const { t } = useTranslation(); // <--- HOOK

    if (!isOwner && photos.length === 0) {
        return (
            <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('gallery_title')}</Text>
                <Text style={styles.emptyText}>{t('gallery_empty')}</Text>
            </View>
        );
    }

    return (
        <View style={styles.card}>
            <View style={styles.header}>
                <Text style={styles.cardTitle}>{t('gallery_title')}</Text>
                {isOwner && (
                    <TouchableOpacity onPress={onAddPhoto} style={styles.addBtn}>
                        <Plus size={20} color="#FFF" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={{ height: photos.length > 6 ? MAX_GRID_HEIGHT : 'auto' }}>
                <ScrollView nestedScrollEnabled={true} showsVerticalScrollIndicator={true} indicatorStyle="white" contentContainerStyle={{ paddingBottom: 4 }}>
                    <View style={styles.grid}>
                        {photos.map((photo) => (
                            <TouchableOpacity key={photo.id} onPress={() => onPhotoClick(photo)} activeOpacity={0.8} style={styles.photoContainer}>
                                <Image source={{ uri: photo.url }} style={styles.photo} resizeMode="cover" />
                                <View style={styles.overlay}>
                                    <View style={styles.stat}>
                                        <Heart size={10} color={photo.isLikedByMe ? "#EF4444" : "#FFF"} fill={photo.isLikedByMe ? "#EF4444" : "none"} />
                                        <Text style={styles.statText}>{photo.likesCount}</Text>
                                    </View>
                                    <View style={styles.stat}>
                                        <MessageCircle size={10} color="#FFF" />
                                        <Text style={styles.statText}>{photo.commentsCount}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </View>
            
             {isOwner && photos.length === 0 && (
                 <Text style={styles.emptyTextHint}>{t('gallery_add_hint')}</Text>
             )}
        </View>
    );
};

const styles = StyleSheet.create({
    card: { backgroundColor: '#1F2937', borderRadius: 12, padding: 16, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    cardTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
    addBtn: { backgroundColor: '#6366F1', padding: 8, borderRadius: 8 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
    photoContainer: { width: IMAGE_SIZE, height: IMAGE_SIZE, borderRadius: 8, overflow: 'hidden', position: 'relative', backgroundColor: '#374151' },
    photo: { width: '100%', height: '100%' },
    overlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 6, gap: 8, justifyContent: 'space-between' },
    stat: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    statText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
    emptyText: { color: '#6B7280', fontStyle: 'italic', textAlign: 'center', marginTop: 8 },
    emptyTextHint: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', marginTop: 16 }
});