// src/features/astrology/components/NatalChartDisplay.tsx

import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, G, Text as SvgText, Line, Circle } from 'react-native-svg';
import { X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next'; // <--- Importante

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
  'Sun': { symbol: '☉', color: '#FFDC00' }, // Suporte caso venha em inglês
  'Lua': { symbol: '☽', color: '#AAAAAA' },
  'Moon': { symbol: '☽', color: '#AAAAAA' },
  'Mercúrio': { symbol: '☿', color: '#FF851B' },
  'Mercury': { symbol: '☿', color: '#FF851B' },
  'Vénus': { symbol: '♀', color: '#2ECC40' },
  'Venus': { symbol: '♀', color: '#2ECC40' },
  'Marte': { symbol: '♂', color: '#FF4136' },
  'Mars': { symbol: '♂', color: '#FF4136' },
  'Júpiter': { symbol: '♃', color: '#0074D9' },
  'Jupiter': { symbol: '♃', color: '#0074D9' },
  'Saturno': { symbol: '♄', color: '#85144b' },
  'Saturn': { symbol: '♄', color: '#85144b' },
  'Urano': { symbol: '♅', color: '#7FDBFF' },
  'Uranus': { symbol: '♅', color: '#7FDBFF' },
  'Neptuno': { symbol: '♆', color: '#B10DC9' },
  'Neptune': { symbol: '♆', color: '#B10DC9' },
  'Plutão': { symbol: '♇', color: '#F012BE' },
  'Pluto': { symbol: '♇', color: '#F012BE' },
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
  const { t } = useTranslation(); // Inicializando tradução
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetPosition | null>(null);

  // Helper para traduzir nome do planeta vindo do backend
  const getTranslatedPlanet = (rawName: string) => {
    const map: Record<string, string> = {
        'Sol': 'planet_sun', 'Sun': 'planet_sun',
        'Lua': 'planet_moon', 'Moon': 'planet_moon',
        'Mercúrio': 'planet_mercury', 'Mercury': 'planet_mercury',
        'Vénus': 'planet_venus', 'Venus': 'planet_venus',
        'Marte': 'planet_mars', 'Mars': 'planet_mars',
        'Júpiter': 'planet_jupiter', 'Jupiter': 'planet_jupiter',
        'Saturno': 'planet_saturn', 'Saturn': 'planet_saturn',
        'Urano': 'planet_uranus', 'Uranus': 'planet_uranus',
        'Neptuno': 'planet_neptune', 'Neptune': 'planet_neptune',
        'Plutão': 'planet_pluto', 'Pluto': 'planet_pluto',
    };
    const key = map[rawName];
    return key ? t(key) : rawName;
  };

  // Helper para traduzir nome do signo vindo do backend
  const getTranslatedSign = (rawSign: string) => {
      // Normaliza removendo acentos e deixando minusculo para busca
      const normalized = rawSign.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      
      const map: Record<string, string> = {
          'aries': 'sign_aries',
          'taurus': 'sign_taurus', 'touro': 'sign_taurus',
          'gemini': 'sign_gemini', 'gemeos': 'sign_gemini',
          'cancer': 'sign_cancer',
          'leo': 'sign_leo', 'leao': 'sign_leo',
          'virgo': 'sign_virgo', 'virgem': 'sign_virgo',
          'libra': 'sign_libra',
          'scorpio': 'sign_scorpio', 'escorpiao': 'sign_scorpio',
          'sagittarius': 'sign_sagittarius', 'sagitario': 'sign_sagittarius',
          'capricorn': 'sign_capricorn', 'capricornio': 'sign_capricorn',
          'aquarius': 'sign_aquarius', 'aquario': 'sign_aquarius',
          'pisces': 'sign_pisces', 'peixes': 'sign_pisces'
      };
      
      // Tenta achar pelo normalizado, senão retorna o original
      const key = map[normalized];
      return key ? t(key) : rawSign;
  };

  if (!chart) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('chart_data_unavailable')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* CAMADA 1: O DESENHO (SVG) */}
      <View style={{ width: SIZE, height: SIZE }}>
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
        </Svg>

        {/* CAMADA 2: OS BOTÕES DOS PLANETAS (Híbrido) */}
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
           {chart.planets.map((planet) => {
              const displayInfo = PLANET_SYMBOLS[planet.name] || { symbol: '?', color: '#FFF' };
              const angle = astroLongitudeToSvgAngle(planet.longitude);
              const pos = polarToCartesian(SVG_CENTER, SVG_CENTER, PLANET_RADIUS, angle);
              
              const BTN_SIZE = 44; 

              return (
                <TouchableOpacity
                  key={planet.name}
                  onPress={() => setSelectedPlanet(planet)}
                  activeOpacity={0.7}
                  style={[
                    styles.planetButton,
                    {
                      left: pos.x - (BTN_SIZE / 2),
                      top: pos.y - (BTN_SIZE / 2),
                      width: BTN_SIZE,
                      height: BTN_SIZE,
                    }
                  ]}
                >
                  <Text style={[styles.planetSymbolText, { color: displayInfo.color }]}>
                    {displayInfo.symbol}
                  </Text>
                </TouchableOpacity>
              );
           })}
        </View>
      </View>

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
                    {/* TRADUZ O NOME DO PLANETA AQUI */}
                    <Text style={styles.planetName}>{getTranslatedPlanet(selectedPlanet.name)}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedPlanet(null)} style={{padding: 4}}>
                    <X size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.planetPosition}>
                  {/* TRADUZ SIGNOS E PREPOSIÇÃO */}
                  {getTranslatedSign(selectedPlanet.sign)} {t('at_degree')} {selectedPlanet.degree.toFixed(2)}°
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
  planetButton: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20, 
  },
  planetSymbolText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 2
  },
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
    color: '#818CF8', 
    fontWeight: '600',
    marginBottom: 12,
  },
  planetMeaning: {
    fontSize: 14,
    color: '#D1D5DB', 
    lineHeight: 20,
  },
});