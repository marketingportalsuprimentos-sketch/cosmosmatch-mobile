import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DiscoveryActionsProps {
  onSkip: () => void;
  onLike: () => void;
  onSendMessage: (msg: string) => void;
  isProcessing: boolean;
}

export function DiscoveryActions({ onSkip, onLike, onSendMessage, isProcessing }: DiscoveryActionsProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      
      {/* Botão X (Pass) */}
      <TouchableOpacity 
        style={styles.circleButton} 
        onPress={onSkip}
        disabled={isProcessing}
      >
        <Ionicons name="close" size={24} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Input de Mensagem (Pílula) */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Envie uma mensagem..."
          placeholderTextColor="#6B7280"
          value={message}
          onChangeText={setMessage}
          editable={!isProcessing}
        />
        {/* Botão Enviar dentro do input (Roxo) */}
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
           <Ionicons name="paper-plane" size={14} color="white" />
        </TouchableOpacity>
      </View>

      {/* Botão Like (Coração Roxo) */}
      <TouchableOpacity 
        style={[styles.circleButton, styles.likeButtonBorder]} 
        onPress={onLike}
        disabled={isProcessing}
      >
        <Ionicons name="heart" size={24} color="#A78BFA" />
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 10, width: '100%',
  },
  circleButton: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(31, 41, 55, 0.5)', // Fundo escuro leve
    borderWidth: 1, borderColor: '#374151'
  },
  likeButtonBorder: { borderColor: '#A78BFA' }, // Borda roxa para o like
  
  inputContainer: {
    flex: 1, height: 50, marginHorizontal: 12,
    backgroundColor: '#1F2937', borderRadius: 25,
    flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 6,
    borderWidth: 1, borderColor: '#374151'
  },
  input: { flex: 1, color: 'white', fontSize: 14 },
  
  sendButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#8B5CF6', // Roxo
    justifyContent: 'center', alignItems: 'center'
  }
});