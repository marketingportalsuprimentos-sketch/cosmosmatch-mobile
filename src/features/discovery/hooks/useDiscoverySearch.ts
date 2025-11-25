// mobile/src/features/discovery/hooks/useDiscoverySearch.ts
// (Hooks para Autocomplete de Cidade e Busca de Usuário)

import { useQuery } from '@tanstack/react-query';
import * as profileApi from '../../profile/services/profileApi'; // Onde estão as funções de API
import type { BasicUserInfo } from '../../../types/profile.types';

// Hook para buscar sugestões de cidade enquanto o usuário digita
export function useCityAutocomplete(input: string) {
  return useQuery<string[], Error>({
    queryKey: ['cityAutocomplete', input],
    queryFn: () => profileApi.getCityAutocomplete(input),
    // Só habilita a busca se tiver mais de 2 caracteres
    enabled: input.length > 2, 
    staleTime: 1000 * 60 * 5, // Cache de 5 minutos
  });
}

// Hook para buscar usuários pelo nome (Usado pela Lupa)
export function useSearchUserByName(name: string) {
  return useQuery<BasicUserInfo[], Error>({
    queryKey: ['userSearch', name],
    queryFn: () => profileApi.searchUserByName(name),
    enabled: name.length > 2,
    staleTime: Infinity, // Não precisa revalidar a busca
  });
}