// src/hooks/useTimeAgo.ts

import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const useTimeAgo = () => {
  /**
   * Converte uma data ISO ou objeto Date em texto relativo (ex: "há 5 minutos")
   */
  const timeAgo = (date: string | Date) => {
    if (!date) return '';
    
    try {
      return formatDistanceToNow(new Date(date), {
        addSuffix: true, // Adiciona "há..." ou "...atrás"
        locale: ptBR,    // Português do Brasil
      });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return 'recentemente';
    }
  };

  return { timeAgo };
};