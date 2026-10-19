export type UserRole = 'admin' | 'user';

export type PublicationStatus = 'draft' | 'published' | 'archived';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  phoneVerified: boolean;
  emailVerified?: boolean;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  posterStorageKey: string;
  videoStorageKey: string;
  posterUrl: string;
  videoUrl: string;
  backdropUrl?: string;
  genre: string[];
  releaseYear: number;
  language: string;
  duration: number; // in minutes
  rating?: string;
  featured?: boolean;
  cast: string[];
  director: string;
  publicationStatus: PublicationStatus;
  uploadedBy: string;
  viewsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phoneVerified: boolean;
  phoneNumber: string;
}

export interface MovieFilterOptions {
  search?: string;
  genre?: string;
  releaseYear?: number;
  language?: string;
  publicationStatus?: PublicationStatus;
}
