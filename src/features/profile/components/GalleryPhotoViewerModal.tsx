// mobile/src/features/profile/components/GalleryPhotoViewerModal.tsx

import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Image, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { X, Heart, MessageCircle, Trash2 } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import { ProfilePhoto } from '../../../types/profile.types';
import { useDeletePhotoFromGallery, useLikeGalleryPhoto, useUnlikeGalleryPhoto } from '../hooks/useProfile';
import { GalleryCommentSheet } from './GalleryCommentSheet';

interface GalleryPhotoViewerModalProps {
  photo: ProfilePhoto | null;
  onClose: () => void;
  isOwner: boolean;
  profileUserId?: string;
}

const { width } = Dimensions.get('window');

export const GalleryPhotoViewerModal = ({ 
    photo, onClose, isOwner, profileUserId 
}: GalleryPhotoViewerModalProps) => {
  
  const isFocused = useIsFocused();
  const [showComments, setShowComments] = useState(false);

  const { mutate: deletePhoto } = useDeletePhotoFromGallery();
  const { mutate: likePhoto } = useLikeGalleryPhoto(profileUserId);
  const { mutate: unlikePhoto } = useUnlikeGalleryPhoto(profileUserId);

  useEffect(() => {
      if (!isFocused) {
          setShowComments(false);
          onClose();
      }
  }, [isFocused]);

  if (!photo) return null;

  const handleDelete = () => {
    Alert.alert(
        "Excluir Foto",
        "Tem certeza? Essa ação não pode ser desfeita.",
        [
            { text: "Cancelar", style: "cancel" },
            { 
                text: "Excluir", 
                style: "destructive", 
                onPress: () => {
                    deletePhoto(photo.id);
                    onClose(); 
                } 
            }
        ]
    );
  };

  const handleLike = () => {
      if (photo.isLikedByMe) {
          unlikePhoto(photo.id);
      } else {
          likePhoto(photo.id);
      }
  };

  return (
    <Modal visible={!!photo} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        
        {/* Header */}
        <View style={styles.header}>
            <Text style={styles.title}>Visualizar Foto</Text>
            <TouchableOpacity onPress={onClose}>
                <X size={24} color="#FFF" />
            </TouchableOpacity>
        </View>

        {/* Imagem */}
        <View style={styles.imageContainer}>
            <Image 
                source={{ uri: photo.url }} 
                style={styles.image} 
                resizeMode="contain" 
            />
        </View>

        {/* Footer: Ações */}
        <View style={styles.footer}>
            <View style={styles.actionsLeft}>
                <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
                    <Heart 
                        size={28} 
                        color={photo.isLikedByMe ? "#EF4444" : "#FFF"} 
                        fill={photo.isLikedByMe ? "#EF4444" : "none"} 
                    />
                    <Text style={styles.actionText}>{photo.likesCount}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => setShowComments(true)}>
                    <MessageCircle size={28} color="#FFF" />
                    <Text style={styles.actionText}>{photo.commentsCount}</Text>
                </TouchableOpacity>
            </View>

            {isOwner && (
                <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                    <Trash2 size={24} color="#9CA3AF" />
                </TouchableOpacity>
            )}
        </View>

        {/* Comentários */}
        {showComments && (
            <GalleryCommentSheet
                photoId={photo.id}
                isOpen={showComments}
                onClose={() => setShowComments(false)}
                targetUserId={profileUserId}
                isPhotoOwner={isOwner} // <--- ADICIONADO AQUI
            />
        )}

      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'space-between' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, marginTop: 40 },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  imageContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: width, height: '80%' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingBottom: 40 },
  actionsLeft: { flexDirection: 'row', gap: 24 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
  deleteBtn: { padding: 8 }
});