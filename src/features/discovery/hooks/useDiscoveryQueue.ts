import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getDiscoveryQueue } from '../services/discoveryApi';
import type { DiscoveryProfile } from '../services/discoveryApi';
import { useGetMyProfile } from '../../profile/hooks/useProfile'; 

const REFETCH_THRESHOLD = 5;

type LocationFilter = { lat: number; lng: number } | null;

function isComplete(p?: any): boolean {
  if (!p) return false;
  const okName = !!(p.name || p.user?.name);
  const okGender = !!p.gender;
  const okPhoto = !!(p.imageUrl || p.profile?.imageUrl || (p.photos && p.photos.length > 0)); 
  const okBirthDate = !!p.birthDate;
  return !!(okName && okGender && okPhoto && okBirthDate);
}

// ADICIONADO: Parâmetro 'cityName' opcional
export function useDiscoveryQueue({ locationFilter, cityName }: { locationFilter: LocationFilter, cityName?: string }) {
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<DiscoveryProfile[]>([]);
  const [requiresProfile, setRequiresProfile] = useState(false);

  const profileQ = useGetMyProfile(); 

  useEffect(() => {
    if (!profileQ.isLoading && profileQ.data) {
      if (!isComplete(profileQ.data)) {
        setRequiresProfile(true);
      } else {
        setRequiresProfile(false);
      }
    }
  }, [profileQ.data, profileQ.isLoading]);

  const discoveryQ = useQuery<DiscoveryProfile[]>({
    queryKey: ['discoveryQueue', locationFilter], 
    queryFn: async () => {
      console.log(`🚀 [Queue] Buscando no servidor: ${JSON.stringify(locationFilter)}`);
      try {
        const data = await getDiscoveryQueue(locationFilter);
        return data || [];
      } catch (err: any) {
        const status = err?.response?.status;
        const msg = (err?.response?.data?.message ?? '').toString().toLowerCase();
        if (status === 400 && msg.includes('incomplete profile')) {
          setRequiresProfile(true);
          queryClient.setQueryData(['discoveryQueue', locationFilter], []);
          throw new Error('INCOMPLETE_PROFILE');
        }
        throw err;
      }
    },
    enabled: !!profileQ.data && !requiresProfile,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  // --- FILTRAGEM INTELIGENTE NO FRONTEND ---
  useEffect(() => {
    if (discoveryQ.data && discoveryQ.data.length > 0) {
        
        // 1. Pega tudo que veio do servidor
        let incomingProfiles = discoveryQ.data;

        // 2. SE tiver nome de cidade, filtra rigorosamente
        if (cityName && cityName.length > 2) {
            const cityClean = cityName.split(',')[0].trim().toLowerCase(); // Pega só "Barra do Ribeiro" antes da vírgula
            console.log(`🔎 [Filtro Front] Mantendo apenas usuários de: "${cityClean}"`);
            
            incomingProfiles = incomingProfiles.filter(p => {
                const userCity = (p.profile?.currentCity || '').toLowerCase();
                const match = userCity.includes(cityClean);
                if (!match) console.log(`🗑️ Descartando vizinho: ${p.name} (${p.profile?.currentCity})`);
                return match;
            });
        }

        console.log(`📦 [Queue] ${incomingProfiles.length} perfis aprovados para exibição.`);

        setQueue((prev) => {
            if (prev.length === 0) return incomingProfiles;
            const ids = new Set(prev.map((p) => p.userId));
            const fresh = incomingProfiles.filter((p: any) => !ids.has(p.userId));
            return [...prev, ...fresh];
        });
    }
  }, [discoveryQ.data, cityName]); // Recalcula se a cidade mudar

  useEffect(() => {
    if (locationFilter) {
        setQueue([]); 
    }
  }, [locationFilter]);

  const removeCurrentProfile = () => {
    setQueue((prev) => {
      const next = prev.slice(1);
      if (next.length < REFETCH_THRESHOLD && !discoveryQ.isFetching && discoveryQ.isSuccess) {
        discoveryQ.refetch();
      }
      return next;
    });
  };

  const currentProfile = queue.length > 0 ? queue[0] : null;
  const isLoading = profileQ.isLoading || (discoveryQ.isFetching && queue.length === 0);

  return useMemo(
    () => ({
      currentProfile,
      isQueueEmpty: queue.length === 0,
      removeCurrentProfile,
      isFetching: discoveryQ.isFetching,
      isLoading, 
      isError: profileQ.isError || (discoveryQ.isError && (discoveryQ.error as any)?.code !== 'INCOMPLETE_PROFILE'),
      requiresProfile,
      refetchQueue: discoveryQ.refetch,
      queueLength: queue.length
    }),
    [currentProfile, queue.length, discoveryQ.isFetching, isLoading, profileQ.isError, discoveryQ.isError, requiresProfile, discoveryQ.refetch]
  );
}