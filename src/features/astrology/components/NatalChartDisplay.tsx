// src/features/astrology/components/NatalChartDisplay.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, G, Text as SvgText, Line, Circle } from 'react-native-svg';
import { X } from 'lucide-react-native';

// Tipos
interface PlanetPosition {
  name: string;
  sign: string;
  degree: number;
  longitude: number;
  meaning: string;
}

interface HouseCusp {
  name: string;
  longitude: number;
}

interface FullNatalChart {
  planets: PlanetPosition[];
  houses: HouseCusp[];
}

interface Props {
  chart: FullNatalChart | null | undefined;
}

// --- CONSTANTES ---
const ZODIAC_SIGNS = [
  { name: 'Aries', symbol: '♈︎', color: '#FF4136' },
  { name: 'Taurus', symbol: '♉︎', color: '#2ECC40' },
  { name: 'Gemini', symbol: '♊︎', color: '#FFDC00' },
  { name: 'Cancer', symbol: '♋︎', color: '#0074D9' },
  { name: 'Leo', symbol: '♌︎', color: '#FF4136' },
  { name: 'Virgo', symbol: '♍︎', color: '#2ECC40' },
  { name: 'Libra', symbol: '♎︎', color: '#FFDC00' },
  { name: 'Scorpio', symbol: '♏︎', color: '#0074D9' },
  { name: 'Sagittarius', symbol: '♐︎', color: '#FF4136' },
  { name: 'Capricorn', symbol: '♑︎', color: '#2ECC40' },
  { name: 'Aquarius', symbol: '♒︎', color: '#FFDC00' },
  { name: 'Pisces', symbol: '♓︎', color: '#0074D9' },
];

const PLANET_SYMBOLS: Record<string, { symbol: string; color: string }> = {
  'Sol': { symbol: '☉', color: '#FFDC00' },
  'Lua': { symbol: '☽', color: '#AAAAAA' },
  'Mercúrio': { symbol: '☿', color: '#FF851B' },
  'Vénus': { symbol: '♀', color: '#2ECC40' },
  'Marte': { symbol: '♂', color: '#FF4136' },
  'Júpiter': { symbol: '♃', color: '#0074D9' },
  'Saturno': { symbol: '♄', color: '#85144b' },
  'Urano': { symbol: '♅', color: '#7FDBFF' },
  'Neptuno': { symbol: '♆', color: '#B10DC9' },
  'Plutão': { symbol: '♇', color: '#F012BE' },
};

// Ajuste de Tamanho
const SCREEN_WIDTH = Dimensions.get('window').width;
const SIZE = SCREEN_WIDTH - 40; 
const SVG_CENTER = SIZE / 2;
const WHEEL_RADIUS = (SIZE / 2) - 10;
const TEXT_RADIUS = WHEEL_RADIUS - 15;
const PLANET_RADIUS = WHEEL_RADIUS - 50;

// --- FUNÇÕES HELPER ---
function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}

function astroLongitudeToSvgAngle(longitude: number): number {
  return (longitude + 90) % 360;
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  const d = [ "M", x, y, "L", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y, "Z" ].join(" ");
  return d;
}

export const NatalChartDisplay = ({ chart }: Props) => {
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetPosition | null>(null);

  if (!chart) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Dados do mapa indisponíveis.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        
        {/* 1. Roda do Zodíaco */}
        <G id="zodiac-wheel">
          {ZODIAC_SIGNS.map((sign, index) => {
            const startAngle = index * 30;
            const endAngle = (index + 1) * 30;
            const textAngle = startAngle + 15;
            const textPos = polarToCartesian(SVG_CENTER, SVG_CENTER, TEXT_RADIUS, textAngle);
            
            return (
              <G key={sign.name}>
                <Path
                  d={describeArc(SVG_CENTER, SVG_CENTER, WHEEL_RADIUS, startAngle, endAngle)}
                  fill={sign.color}
                  fillOpacity={0.2}
                  stroke="#4A5568"
                  strokeWidth={0.5}
                />
                <SvgText
                  x={textPos.x}
                  y={textPos.y + 4}
                  fill="#E2E8F0"
                  fontSize="14"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {sign.symbol}
                </SvgText>
              </G>
            );
          })}
        </G>

        {/* 2. Linhas das Casas */}
        <G id="house-lines">
          {chart.houses.map((house) => {
            const angle = astroLongitudeToSvgAngle(house.longitude);
            const lineEnd = polarToCartesian(SVG_CENTER, SVG_CENTER, WHEEL_RADIUS, angle);
            const textPos = polarToCartesian(SVG_CENTER, SVG_CENTER, WHEEL_RADIUS - 25, angle + 15);

            return (
              <G key={house.name}>
                <Line
                  x1={SVG_CENTER}
                  y1={SVG_CENTER}
                  x2={lineEnd.x}
                  y2={lineEnd.y}
                  stroke="#E2E8F0"
                  strokeWidth={1}
                  strokeOpacity={0.5}
                />
                <SvgText
                  x={textPos.x}
                  y={textPos.y}
                  fill="#E2E8F0"
                  fontSize="8"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  opacity={0.7}
                >
                  {house.name.split(' ')[1]}
                </SvgText>
              </G>
            );
          })}
        </G>

        {/* 3. Círculo Central Escuro */}
        <Circle 
          cx={SVG_CENTER} 
          cy={SVG_CENTER} 
          r={WHEEL_RADIUS - 35}
          fill="#111827" 
          stroke="#4A5568"
          strokeWidth={0.5}
        />

        {/* 4. Símbolos dos Planetas (AGORA GRANDES E CLICÁVEIS) */}
        <G id="planet-symbols">
          {chart.planets.map((planet) => {
            const displayInfo = PLANET_SYMBOLS[planet.name];
            if (!displayInfo) return null;
            
            const angle = astroLongitudeToSvgAngle(planet.longitude);
            const pos = polarToCartesian(SVG_CENTER, SVG_CENTER, PLANET_RADIUS, angle);

            return (
              // Usamos Group (G) para agrupar o alvo invisível e o texto
              <G key={planet.name} onPress={() => setSelectedPlanet(planet)}>
                
                {/* HIT BOX: Círculo invisível grande para facilitar o toque */}
                <Circle 
                    cx={pos.x} 
                    cy={pos.y} 
                    r="20" // Raio de 20 = 40px de área de toque (Ideal para dedos)
                    fill="transparent" 
                />

                {/* Símbolo Visual */}
                <SvgText
                  x={pos.x}
                  y={pos.y + 8} // Ajuste vertical para centralizar
                  fill={displayInfo.color}
                  fontSize="24" // AUMENTADO DE 18 PARA 24
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                >
                  {displayInfo.symbol}
                </SvgText>
              </G>
            );
          })}
        </G>
      </Svg>

      {/* MODAL DE DETALHES DO PLANETA */}
      <Modal
        visible={!!selectedPlanet}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPlanet(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSelectedPlanet(null)}
        >
          <View style={styles.modalContent}>
            {selectedPlanet && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                    <Text style={[styles.planetSymbol, { color: PLANET_SYMBOLS[selectedPlanet.name]?.color || '#FFF' }]}>
                      {PLANET_SYMBOLS[selectedPlanet.name]?.symbol}
                    </Text>
                    <Text style={styles.planetName}>{selectedPlanet.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedPlanet(null)}>
                    <X size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.planetPosition}>
                  {selectedPlanet.sign} a {selectedPlanet.degree.toFixed(2)}°
                </Text>
                
                <Text style={styles.planetMeaning}>
                  {selectedPlanet.meaning}
                </Text>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  center: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#374151',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planetSymbol: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  planetName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  planetPosition: {
    fontSize: 16,
    color: '#818CF8', // indigo-400
    fontWeight: '600',
    marginBottom: 12,
  },
  planetMeaning: {
    fontSize: 14,
    color: '#D1D5DB', // gray-300
    lineHeight: 20,
  },
});