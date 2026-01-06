import React from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, FlatList, SafeAreaView 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useReportPost } from '../hooks/useFeed';
import { toast } from '../../../lib/toast';

// Mapeamento exato dos motivos da Web
const REPORT_OPTIONS = [
  { label: 'Simplesmente não gostei', value: 'DISLIKE' },
  { label: 'Bullying ou contato indesejado', value: 'BULLYING' },
  { label: 'Suicídio ou automutilação', value: 'SELF_HARM' },
  { label: 'Violência, ódio ou exploração', value: 'VIOLENCE' },
  { label: 'Venda de itens restritos', value: 'RESTRICTED_ITEMS' },
  { label: 'Nudez ou atividade sexual', value: 'NUDITY' },
  { label: 'Golpe, fraude ou spam', value: 'SPAM_SCAM' },
  { label: 'Informação falsa', value: 'FALSE_INFO' },
];

export function ReportPostModal({ isOpen, onClose, postId }: any) {
  const { mutate: report, isPending } = useReportPost();

  const handleReport = (reason: string) => {
    if (!postId || isPending) return;

    report({ postId, reason }, {
      onSuccess: () => {
        // Alinhado com o feedback da Web
        toast.success('Denúncia enviada. Iremos analisar.');
        onClose();
      },
      onError: () => {
        toast.error('Erro ao enviar denúncia.');
      }
    });
  };

  return (
    <Modal visible={isOpen} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalContainer}>
          {/* Cabeçalho do Modal */}
          <View style={styles.header}>
            <View style={{ width: 28 }} /> 
            <Text style={styles.title}>Denunciar</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
          </View>

          <View style={styles.instructionBox}>
            <Text style={styles.subtitle}>Por que você está denunciando esse post?</Text>
          </View>

          <FlatList
            data={REPORT_OPTIONS}
            keyExtractor={(item) => item.value}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.option} 
                onPress={() => handleReport(item.value)}
                disabled={isPending}
              >
                <Text style={styles.optionText}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={20} color="#444" />
              </TouchableOpacity>
            )}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Seu reporte é anônimo, exceto em casos de propriedade intelectual.
            </Text>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  modalContainer: { backgroundColor: '#111', borderTopLeftRadius: 25, borderTopRightRadius: 25, height: '75%' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#222' 
  },
  title: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  instructionBox: { padding: 20, backgroundColor: '#1a1a1a' },
  subtitle: { color: '#ccc', fontSize: 15, fontWeight: '500' },
  option: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    padding: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#222',
    alignItems: 'center'
  },
  optionText: { color: 'white', fontSize: 16 },
  footer: { padding: 20, alignItems: 'center' },
  footerText: { color: '#555', fontSize: 12, textAlign: 'center' }
});