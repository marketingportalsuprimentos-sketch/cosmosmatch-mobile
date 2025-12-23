// src/types/feed.types.ts

export enum MediaType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
}

// Se você tiver o enum ReportReason aqui, mantenha-o. Se não, pode apagar este bloco.
export enum ReportReason {
  SPAM_SCAM = 'SPAM_SCAM',
  NUDITY = 'NUDITY',
  VIOLENCE = 'VIOLENCE',
  BULLYING = 'BULLYING',
  FALSE_INFO = 'FALSE_INFO',
  DISLIKE = 'DISLIKE',
  SELF_HARM = 'SELF_HARM',
  RESTRICTED_ITEMS = 'RESTRICTED_ITEMS',
}

export interface FeedAuthor {
  id: string;
  name: string;
  profile?: {
    imageUrl?: string | null;
  };
  // O campo novo que adicionamos:
  isFollowedByMe?: boolean; 
}

export interface FeedPost {
  id: string;
  content?: string;
  imageUrl: string;
  mediaType: MediaType;
  videoDuration?: number;
  createdAt: string;
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
  isHidden?: boolean;
}

export interface FeedDeck {
  id?: string;
  author: FeedAuthor;
  posts: FeedPost[];
}