// src/features/feed/components/ReportPostModal.tsx

import React from 'react';
import { 
  View, Text, Modal, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { reportPost } from '../services/feedApi';
import { ReportReason } from '@/types/feed.types'; // Certifique-se que o Enum está aqui

interface ReportPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string | null;
}

// Mapeamento visual das opções conforme sua imagem
const REPORT_OPTIONS = [
  { label: 'Simplesmente não gostei', value: ReportReason.DISLIKE },
  { label: 'Bullying ou contato indesejado', value: ReportReason.BULLYING },
  { label: 'Suicídio, automutilação ou distúrbios', value: ReportReason.SELF_HARM },
  { label: 'Violência, ódio ou exploração', value: ReportReason.VIOLENCE },
  { label: 'Venda ou promoção de itens restritos', value: ReportReason.RESTRICTED_ITEMS },
  { label: 'Nudez ou atividade sexual', value: ReportReason.NUDITY },
  { label: 'Golpe, fraude ou spam', value: ReportReason.SPAM_SCAM },
  { label: 'Informação falsa', value: ReportReason.FALSE_INFO },
];

export const ReportPostModal: React.FC<ReportPostModalProps> = ({ isOpen, onClose, postId }) => {
  
  const { mutate, isPending } = useMutation({
    mutationFn: ({ pid, reason }: { pid: string; reason: ReportReason }) => 
      reportPost(pid, { reason }),
    onSuccess: () => {
      Alert.alert('Recebemos sua denúncia', 'Obrigado por ajudar a manter nossa comunidade segura.');
      onClose();
    },
    onError: () => {
      Alert.alert('Erro', 'Não foi possível enviar a denúncia. Tente novamente.');
    }
  });

  const handleSelectReason = (reason: ReportReason) => {
    if (postId) {
      mutate({ pid: postId, reason });
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Denunciar</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#ccc" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>Por que você está denunciando esse post?</Text>

          {/* Lista de Opções */}
          {isPending ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.loadingText}>Enviando...</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 20 }}>
              {REPORT_OPTIONS.map((option, index) => (
                <TouchableOpacity 
                  key={option.value} 
                  style={styles.optionItem}
                  onPress={() => handleSelectReason(option.value)}
                >
                  <Text style={styles.optionText}>{option.label}</Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Footer */}
          <Text style={styles.footerText}>
            Seu reporte é anônimo, exceto se estiver reportando uma infração de propriedade intelectual.
          </Text>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end', // Modal sobe de baixo
  },
  container: {
    backgroundColor: '#121214', // Cor escura igual da imagem
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    maxHeight: '90%', // Ocupa quase a tela toda
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    padding: 5,
  },
  subtitle: {
    color: '#E1E1E6',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  list: {
    maxHeight: 500,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#29292E',
  },
  optionText: {
    color: '#E1E1E6',
    fontSize: 15,
  },
  footerText: {
    color: '#7C7C8A',
    fontSize: 12,
    marginTop: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    marginTop: 10,
  }
});