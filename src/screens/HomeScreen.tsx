// src/screens/HomeScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../contexts/AuthContext'; 

export const HomeScreen = () => {
  const { logout } = useAuth(); // Assume que o AuthContext tem a função logout

  return (
    <View style={styles.container}>
      <Text style={styles.title}>✨ Bem-vindo(a) ao CosmosMatch! ✨</Text>
      <Text style={styles.subtitle}>Você logou com sucesso no Mobile App.</Text>
      
      {/* Botão de Logout para testar o fluxo reverso */}
      <TouchableOpacity 
        style={styles.button} 
        onPress={logout}
      >
        <Text style={styles.buttonText}>Sair / Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827', // Gray-900 (Fundo Padrão)
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6366F1', // Indigo-500 (Cor Principal - Título)
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF', // Gray-400
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#6366F1', // Indigo-500 (Cor Principal - Botão)
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});