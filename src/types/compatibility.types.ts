// src/types/compatibility.types.ts

import { FullNatalChart } from './profile.types';

export interface Aspect {
  planetAName: string;
  planetBName: string;
  type: string; // "Conjunção", "Quadratura", etc.
  angle: number;
  orb: number;
  summary: string;
  quality: string; // "Harmônico", "Neutro", "Tenso"
}

export interface SynastryReport {
  positiveAspects: Aspect[];
  challengingAspects: Aspect[];
  totalScore: number;
}

export interface FullSynastryPayload {
  report: SynastryReport;
  chartA: FullNatalChart;
  chartB: FullNatalChart;
  nameA: string;
  nameB: string;
}

// Tipos de Numerologia
export type NumerologyReportItem = {
  name: string; 
  numberA: number; 
  numberB: number; 
  quality: 'Harmônico' | 'Neutro' | 'Desafiador';
  summary: string; 
};

export interface FullNumerologyReport {
  reportItems: NumerologyReportItem[];
  nameA: string; 
  nameB: string; 
}