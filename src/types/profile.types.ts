// src/types/profile.types.ts

export interface PlanetPosition {
  name: string;
  sign: string;
  degree: number;
  longitude: number;
  meaning: string;
}

export interface HouseCusp {
  name: string;
  sign: string;
  degree: number;
  longitude: number;
}

export interface FullNatalChart {
  planets: PlanetPosition[];
  houses: HouseCusp[];
}

export interface PowerAspect {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface UpdateProfileDto {
  birthDate?: string;
  birthCity?: string;
  birthTime?: string; 
  fullNameBirth?: string;
  currentCity?: string;
  gender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';
  bio?: string;
  cpfCnpj?: string;
  behavioralAnswers?: number[]; 
}

export interface Connection {
  id: string;
  name: string;
  mainPhotoUrl: string | null;
}

export interface Profile {
  id: string;
  userId: string;
  user?: {
    name: string;
    email?: string;
    _count?: {
      followers: number;
      following: number;
    };
  };
  birthDate: string | null;
  birthCity: string | null;
  birthTime: string | null;
  fullNameBirth: string | null;
  currentCity: string | null;
  gender: string | null;
  bio: string | null;
  imageUrl: string | null;
  cpfCnpj: string | null;

  natalChart: FullNatalChart | null;
  numerologyMap: {
    lifePathNumber: number | null;
    expressionNumber: number | null;
    soulNumber: number | null;
    personalityNumber: number | null;
    birthdayNumber: number | null;
  } | null;
  powerAspects: PowerAspect[] | null;
  
  behavioralAnswers: number[] | null;

  connections?: Connection[]; 
}

export interface CompatibilityResult {
  totalScore: number;
  summary: string;
  details: {
    astrology: { totalScore: number; summary: string };
    numerology: { totalScore: number; summary: string };
    behavior?: { totalScore: number; summary: string }; 
  };
}

export interface ProfilePhotoLike {
  createdAt: string;
  userId: string;
  photoId: string;
}

export interface BasicUserInfo {
  id: string;
  name: string;
  profile: {
    imageUrl: string | null;
  } | null;
}

export interface ProfilePhotoComment {
  id: string;
  content: string;
  createdAt: string;
  userId: string;
  photoId: string;
  user: BasicUserInfo;
}

export interface ProfilePhoto {
  id: string;
  url: string;
  order: number;
  profileId: string;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
  comments?: ProfilePhotoComment[];
}

export interface CreateProfilePhotoCommentDto {
  content: string;
}

// --- NOVO: Interface para o retorno do Mapa Astral ---
export interface NatalChartData {
  natalChart: FullNatalChart | null;
  numerologyMap: {
    lifePathNumber: number | null;
    expressionNumber: number | null;
    soulNumber: number | null;
    personalityNumber: number | null;
    birthdayNumber: number | null;
  } | null;
  powerAspects: PowerAspect[] | null;
}