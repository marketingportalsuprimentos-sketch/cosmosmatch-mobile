// src/features/compatibility/components/SynastryChartDisplay.tsx

import React from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Path, G, Text as SvgText, Line, Circle } from 'react-native-svg';
import { FullNatalChart, PlanetPosition } from '../../../types/profile.types';
import { SynastryReport, Aspect } from '../../../types/compatibility.types';

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
  'Ascendente': { symbol: 'AC', color: '#FFFFFF' }, 
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIZE = SCREEN_WIDTH - 40; 
const SVG_CENTER = SIZE / 2;
const WHEEL_RADIUS = (SIZE / 2) - 10;
const TEXT_RADIUS = WHEEL_RADIUS - 15;

// Raios dos dois anéis de planetas
const PLANET_RADIUS_A = WHEEL_RADIUS - 40; // Interno (Você)
const PLANET_RADIUS_B = WHEEL_RADIUS - 65; // Externo (Eles)

// --- HELPER FUNCTIONS ---
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

interface Props {
  chartA: FullNatalChart;
  chartB: FullNatalChart;
  report: SynastryReport;
}

export const SynastryChartDisplay = ({ chartA, chartB, report }: Props) => {

  const ZodiacWheel = () => (
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
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {sign.symbol}
            </SvgText>
          </G>
        );
      })}
    </G>
  );

  const PlanetSymbols = () => (
    <G id="planet-symbols">
      {/* Anel A (Você) */}
      {chartA.planets.map((planet) => {
        const displayInfo = PLANET_SYMBOLS[planet.name];
        if (!displayInfo) return null;
        const angle = astroLongitudeToSvgAngle(planet.longitude);
        const pos = polarToCartesian(SVG_CENTER, SVG_CENTER, PLANET_RADIUS_A, angle);
        return (
          <SvgText
            key={`A-${planet.name}`}
            x={pos.x}
            y={pos.y + 4}
            fill={displayInfo.color}
            fontSize="16"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {displayInfo.symbol}
          </SvgText>
        );
      })}
      
      {/* Anel B (Eles) */}
      {chartB.planets.map((planet) => {
        const displayInfo = PLANET_SYMBOLS[planet.name];
        if (!displayInfo) return null;
        const angle = astroLongitudeToSvgAngle(planet.longitude);
        const pos = polarToCartesian(SVG_CENTER, SVG_CENTER, PLANET_RADIUS_B, angle);
        return (
          <SvgText
            key={`B-${planet.name}`}
            x={pos.x}
            y={pos.y + 4}
            fill={displayInfo.color}
            fontSize="14"
            opacity={0.7}
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {displayInfo.symbol}
          </SvgText>
        );
      })}
    </G>
  );

  const AspectLines = () => {
    const findPoint = (chart: FullNatalChart, name: string): PlanetPosition | undefined => {
      if (name === 'Ascendente') {
        const asc = chart.houses.find(h => h.name === 'Casa 1 (ASC)');
        if (!asc) return undefined;
        return { name: 'Ascendente', longitude: asc.longitude } as any;
      }
      return chart.planets.find(p => p.name === name);
    }
    
    const createLine = (aspect: Aspect, key: string, color: string) => {
      const pointA = findPoint(chartA, aspect.planetAName);
      const pointB = findPoint(chartB, aspect.planetBName);

      if (!pointA || !pointB) return null;

      const angleA = astroLongitudeToSvgAngle(pointA.longitude);
      const posA = polarToCartesian(SVG_CENTER, SVG_CENTER, PLANET_RADIUS_A, angleA);

      const angleB = astroLongitudeToSvgAngle(pointB.longitude);
      const posB = polarToCartesian(SVG_CENTER, SVG_CENTER, PLANET_RADIUS_B, angleB);

      return (
        <Line
          key={key}
          x1={posA.x}
          y1={posA.y}
          x2={posB.x}
          y2={posB.y}
          stroke={color}
          strokeWidth={1}
          opacity={0.6}
        />
      );
    }

    return (
      <G id="aspect-lines">
        {report.positiveAspects.map((aspect, idx) => createLine(aspect, `pos-${idx}`, '#2ECC40'))}
        {report.challengingAspects.map((aspect, idx) => createLine(aspect, `neg-${idx}`, '#FF4136'))}
      </G>
    );
  }

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 20 }}>
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <ZodiacWheel />
        <Circle 
          cx={SVG_CENTER} 
          cy={SVG_CENTER} 
          r={WHEEL_RADIUS - 75} 
          fill="#111827"
          stroke="#4A5568"
          strokeWidth={0.5}
        />
        <AspectLines />
        <PlanetSymbols />
      </Svg>
    </View>
  );
};