// mobile/src/features/feed/services/reportApi.ts

import { api } from '@/services/api';

// Motivos iguais ao do Backend (Enum)
export enum ReportReason {
  SPAM = 'SPAM',
  HATE_SPEECH = 'HATE_SPEECH',
  HARASSMENT = 'HARASSMENT',
  NUDITY = 'NUDITY',
  VIOLENCE = 'VIOLENCE',
  FAKE_NEWS = 'FAKE_NEWS',
  OTHER = 'OTHER',
}

export interface ReportPayload {
  targetId: string; // ID do Post
  type: 'POST' | 'USER' | 'COMMENT';
  reason: ReportReason;
  description?: string;
}

export const sendReport = async (payload: ReportPayload) => {
  // Envia para o endpoint de denúncias que criamos no NestJS
  const { data } = await api.post('/reports', payload);
  return data;
};