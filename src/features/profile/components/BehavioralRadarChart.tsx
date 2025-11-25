// src/features/profile/components/BehavioralRadarChart.tsx

import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ActivityIndicator, Alert } from 'react-native';
import Svg, { Polygon, Line, Circle } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { captureRef } from 'react-native-view-shot'; // 📸 Câmera
import * as Sharing from 'expo-sharing'; // 📤 Envio

interface BehavioralRadarChartProps {
  answers: number[] | null;
  sign: string;
  userId: string;
  isOwner: boolean;
}

export const BehavioralRadarChart = ({ answers, sign, isOwner }: BehavioralRadarChartProps) => {
  
  // Referência para capturar a imagem
  const viewShotRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);

  // Configurações do Gráfico
  const size = 260;
  const center = size / 2;
  const radius = 90; 
  
  const chartData = useMemo(() => {
    if (!answers || answers.length < 20) return null;

    const personalityAvg = answers.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    const lifestyleAvg = answers.slice(10, 15).reduce((a, b) => a + b, 0) / 5;
    const tastesAvg = answers.slice(15, 20).reduce((a, b) => a + b, 0) / 5;

    return [personalityAvg, lifestyleAvg, tastesAvg]; 
  }, [answers]);

  if (!chartData) return null;

  // Função para converter valor em coordenadas
  const getPoint = (value: number, index: number, maxVal = 10) => {
    const angle = (Math.PI * 2 * index) / 3 - Math.PI / 2;
    const r = (value / maxVal) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  };

  const dataPoints = chartData.map((val, i) => getPoint(val, i)).join(' ');
  const bgPoints = [10, 10, 10].map((val, i) => getPoint(val, i)).join(' ');
  const midPoints = [5, 5, 5].map((val, i) => getPoint(val, i)).join(' ');

  // --- LÓGICA DE COMPARTILHAMENTO ---
  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      // 1. Verifica se pode compartilhar
      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Indisponível", "O compartilhamento não está disponível neste dispositivo.");
        setIsSharing(false);
        return;
      }

      // 2. Tira o print do Card
      const uri = await captureRef(viewShotRef, {
        format: 'png',
        quality: 1, // Qualidade máxima
        result: 'tmpfile',
      });

      // 3. Abre menu nativo
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `Minha Vibração ${sign}`,
        UTI: 'public.png',
      });

    } catch (error) {
      console.error("Erro ao compartilhar gráfico:", error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <View style={styles.container}>
      
      {/* --- ÁREA CAPTURÁVEL (O CARD) --- */}
      <View 
        ref={viewShotRef} 
        collapsable={false} // Importante para Android
        style={styles.card}
      >
        <View style={styles.gradientBar} />
        <Text style={styles.title}>Vibração {sign}</Text>
        <Text style={styles.subtitle}>SINTONIA CÓSMICA</Text>

        <View style={styles.chartContainer}>
          
          <Text style={[styles.label, { top: 10, alignSelf: 'center' }]}>PERSONALIDADE</Text>
          <Text style={[styles.label, { bottom: 50, right: 0 }]}>GOSTOS</Text>
          <Text style={[styles.label, { bottom: 50, left: 0 }]}>ESTILO</Text>

          <Svg height={size} width={size}>
            {/* Triângulos de Fundo */}
            <Polygon points={bgPoints} stroke="#374151" strokeWidth="1" fill="none" />
            <Polygon points={midPoints} stroke="#374151" strokeWidth="1" strokeDasharray="4, 4" fill="none" />

            {/* Eixos */}
            {[0, 1, 2].map(i => {
               const p = getPoint(10, i);
               const [x, y] = p.split(',');
               return <Line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#374151" strokeWidth="1" />;
            })}

            {/* Gráfico Preenchido */}
            <Polygon
              points={dataPoints}
              fill="rgba(139, 92, 246, 0.5)" 
              stroke="#8b5cf6"
              strokeWidth="3"
            />

            {/* Bolinhas nos Vértices */}
            {chartData.map((val, i) => {
               const p = getPoint(val, i);
               const [x, y] = p.split(',');
               return <Circle key={i} cx={x} cy={y} r="4" fill="#8b5cf6" stroke="#fff" strokeWidth="1" />;
            })}
          </Svg>
        </View>

        <View style={styles.footer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>CM</Text>
          </View>
          <Text style={styles.footerText}>Gerado por CosmosMatch App</Text>
        </View>
      </View>
      {/* --- FIM DA ÁREA CAPTURÁVEL --- */}

      {isOwner && (
        <TouchableOpacity 
            onPress={handleShare} 
            style={[styles.shareButton, isSharing && styles.btnDisabled]}
            disabled={isSharing}
        >
          {isSharing ? (
              <ActivityIndicator size="small" color="#FFF" />
          ) : (
              <Feather name="share-2" size={20} color="#FFF" />
          )}
          <Text style={styles.shareButtonText}>
              {isSharing ? "Gerando..." : "Compartilhar Card"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    alignItems: 'center',
    width: '100%',
  },
  card: { 
    backgroundColor: '#1f2937', 
    borderRadius: 12, 
    padding: 24, 
    alignItems: 'center', 
    width: '100%', 
    position: 'relative', 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: '#374151', 
    elevation: 10, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  gradientBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 8, backgroundColor: '#8b5cf6' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginTop: 12, marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 2, fontWeight: '600', marginBottom: 12 },
  
  chartContainer: { 
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative',
    marginTop: 8, 
    marginBottom: 8
  },
  label: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D1D5DB',
    backgroundColor: 'rgba(31, 41, 55, 0.9)', 
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
    overflow: 'hidden' 
  },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, opacity: 0.7, gap: 8 },
  badge: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 10, color: '#FFF', fontWeight: 'bold' },
  footerText: { fontSize: 10, color: '#9ca3af', fontWeight: '500' },
  
  shareButton: { marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#7c3aed', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 999, elevation: 8 },
  btnDisabled: { opacity: 0.7 },
  shareButtonText: { color: '#FFF', fontWeight: 'bold', fontSize: 14 },
});