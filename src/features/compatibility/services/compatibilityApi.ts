// src/features/compatibility/services/compatibilityApi.ts

import { api } from '../../../services/api';
import { FullSynastryPayload, FullNumerologyReport } from '../../../types/compatibility.types';

/**
 * Busca o relatório de sinastria (ASTROLOGIA) detalhado
 */
export const getSynastryReport = async (targetUserId: string): Promise<FullSynastryPayload> => { 
  const response = await api.get<FullSynastryPayload>(`/compatibility/synastry/${targetUserId}`);
  return response.data;
};

/**
 * Busca o relatório de compatibilidade (NUMEROLOGIA)
 */
export const getNumerologyReport = async (targetUserId: string): Promise<FullNumerologyReport> => {
  const response = await api.get<FullNumerologyReport>(`/compatibility/numerology/${targetUserId}`);
  return response.data;
};