import { api } from '../../../services/api';

export type DiscoveryProfile = {
  userId: string;
  name: string;
  profile: {
    imageUrl: string | null;
    currentCity: string | null;
    age: number;
    sunSign: string | null;
  };
  compatibility: {
    score: number;
  };
};

type LocationFilter = { lat: number; lng: number } | null;

export async function getDiscoveryQueue(locationFilter: LocationFilter) {
  // Lógica idêntica à web: undefined se não houver filtro
  const params = locationFilter
    ? { lat: locationFilter.lat, lng: locationFilter.lng }
    : undefined;

  const { data } = await api.get<DiscoveryProfile[]>(
    '/discovery',
    { params: params }
  );

  return data;
}

// ---- Ações ----

export type LikeResponse = {
  matched: boolean;
  matchId?: string;
};

export async function likeProfile(targetUserId: string) {
  const { data } = await api.post<LikeResponse>(
    `/discovery/like/${targetUserId}`
  );
  return data;
}

// Mantemos a função caso precise no futuro, mas o hook usa a de Chat
export async function sendIcebreaker(targetUserId: string, content: string) {
  const { data } = await api.post<{ matched: boolean }>(
    `/discovery/icebreaker/${targetUserId}`,
    {
      content: content,
    }
  );
  return data;
}