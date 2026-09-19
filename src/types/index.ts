export interface Wish {
  id: string;
  name: string;
  relationship: string;
  message: string;
  createdAt: any; // Date, string, or Firestore Timestamp
  approved: boolean;
  reactionsCount?: number;
  badge?: string;
}

export interface Memory {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string; // e.g. 'Milestone', 'Counsel', 'Celebration', 'Grandpa', 'Generations', 'Serenity'
  location: string;
  badge: string;
  alt: string;
}

export interface DirectGiftAccount {
  bankName: 'OPay' | 'EcoBank' | string;
  accountName: string;
  accountNumber: string;
  qrCodeUrl?: string;
  brandColor?: string;
}

export interface AudioTrack {
  id: string;
  title: string;
  subtitle?: string;
  audioUrl: string;
  durationSeconds: number;
}

export interface DadPhoto {
  id: string;
  name: string;
  fullPath: string;
  url: string;
  title: string;
  description: string;
  category: string;
  location: string;
  badge: string;
  alt: string;
  isHero: boolean;
  timeCreated?: string;
  size?: number;
}

export interface DadMusicTrack {
  id: string;
  name: string;
  fullPath: string;
  url: string;
  title: string;
  subtitle?: string;
  timeCreated?: string;
  size?: number;
  isActive?: boolean;
  isVideo?: boolean;
  mimeType?: string;
  blob?: Blob | File;
}
