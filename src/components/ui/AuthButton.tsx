import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

interface AuthButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const AuthButton = ({ title, onPress, isLoading, variant = 'primary' }: AuthButtonProps) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'outline': return styles.btnOutline;
      case 'secondary': return styles.btnSecondary;
      default: return styles.btnPrimary;
    }
  };

  const getTextStyle = () => {
    if (variant === 'outline') return styles.textOutline;
    if (variant === 'secondary') return styles.textSecondary;
    return styles.textPrimary;
  };

  return (
    <TouchableOpacity 
      style={[styles.baseBtn, getButtonStyle(), isLoading && styles.disabled]} 
      onPress={onPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFF' : '#A78BFA'} />
      ) : (
        <Text style={[styles.baseText, getTextStyle()]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  baseBtn: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center', width: '100%', marginBottom: 12 },
  disabled: { opacity: 0.7 },
  baseText: { fontSize: 16, fontWeight: 'bold' },
  
  // Primary (Roxo Sólido)
  btnPrimary: { backgroundColor: '#7C3AED' },
  textPrimary: { color: '#FFF' },

  // Outline (Borda Roxa)
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#7C3AED' },
  textOutline: { color: '#A78BFA' },

  // Secondary (Texto simples)
  btnSecondary: { backgroundColor: 'transparent' },
  textSecondary: { color: '#9CA3AF', fontSize: 14, fontWeight: 'normal' },
});