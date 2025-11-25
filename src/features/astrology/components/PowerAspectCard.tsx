// src/features/astrology/components/PowerAspectCard.tsx

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Briefcase, Star, Heart, ShieldCheck, Sparkles, Sun, Moon, User 
} from 'lucide-react-native';
import { PowerAspect } from '../../../types/profile.types';

interface PowerAspectCardProps {
  card: PowerAspect;
  onClick: () => void;
}

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, any> = {
    briefcase: Briefcase,
    star: Star,
    heart: Heart,
    shield: ShieldCheck,
    sun: Sun,
    moon: Moon,
    user: User,
  };
  return iconMap[iconName] || Sparkles;
};

export const PowerAspectCard = ({ card, onClick }: PowerAspectCardProps) => {
  const IconComponent = getIconComponent(card.icon);

  return (
    <TouchableOpacity onPress={onClick} activeOpacity={0.9}>
      <LinearGradient
        colors={['#1F2937', '#111827']} // Gradiente Dark (Gray 800 -> 900)
        style={styles.card}
      >
        {/* Marca d'água do Ícone (Fundo) */}
        <View style={styles.watermarkContainer}>
          <IconComponent size={120} color="#FFF" style={{ opacity: 0.05 }} />
        </View>

        {/* Conteúdo */}
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <IconComponent size={20} color="#818CF8" />
            </View>
            <Text style={styles.title} numberOfLines={1}>
              {card.title}
            </Text>
          </View>

          <Text style={styles.description} numberOfLines={3}>
            {card.description}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 260,
    height: 160,
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#374151',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0, right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    zIndex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  iconBadge: {
    padding: 6,
    backgroundColor: 'rgba(17, 24, 39, 0.7)',
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    flex: 1,
  },
  description: {
    fontSize: 13,
    color: '#D1D5DB',
    lineHeight: 18,
  },
});