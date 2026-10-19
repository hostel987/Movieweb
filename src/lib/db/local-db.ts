import fs from 'fs';
import path from 'path';
import { Movie, UserProfile, PublicationStatus } from '@/types';
import { initialAdminUser, initialMovies } from './seed-data';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const MOVIES_FILE = path.join(DATA_DIR, 'movies.json');
const OTP_FILE = path.join(DATA_DIR, 'otp.json');

export interface StoredUser extends UserProfile {
  passwordHash?: string;
}

export interface StoredOtp {
  phoneNumber?: string;
  email?: string;
  codeHash: string;
  attempts: number;
  expiresAt: string;
  verified: boolean;
  createdAt: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([initialAdminUser], null, 2), 'utf-8');
  }

  if (!fs.existsSync(MOVIES_FILE)) {
    fs.writeFileSync(MOVIES_FILE, JSON.stringify(initialMovies, null, 2), 'utf-8');
  }

  if (!fs.existsSync(OTP_FILE)) {
    fs.writeFileSync(OTP_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

// ----------------- USERS -----------------

export function getLocalUsers(): StoredUser[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(raw) as StoredUser[];
  } catch {
    return [initialAdminUser];
  }
}

export function saveLocalUsers(users: StoredUser[]): void {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

export function findLocalUserByEmail(email: string): StoredUser | null {
  const users = getLocalUsers();
  const normalized = email.trim().toLowerCase();
  return users.find((u) => u.email.toLowerCase() === normalized) || null;
}

export function findLocalUserById(id: string): StoredUser | null {
  const users = getLocalUsers();
  return users.find((u) => u.id === id) || null;
}

export function createLocalUser(user: StoredUser): StoredUser {
  const users = getLocalUsers();
  users.push(user);
  saveLocalUsers(users);
  return user;
}

export function updateLocalUser(id: string, updates: Partial<StoredUser>): StoredUser | null {
  const users = getLocalUsers();
  const index = users.findIndex((u) => u.id === id);
  if (index === -1) return null;
  users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
  saveLocalUsers(users);
  return users[index];
}

// ----------------- MOVIES -----------------

export function getLocalMovies(): Movie[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(MOVIES_FILE, 'utf-8');
    return JSON.parse(raw) as Movie[];
  } catch {
    return initialMovies;
  }
}

export function saveLocalMovies(movies: Movie[]): void {
  ensureDataDir();
  fs.writeFileSync(MOVIES_FILE, JSON.stringify(movies, null, 2), 'utf-8');
}

export function findLocalMovieById(id: string): Movie | null {
  const movies = getLocalMovies();
  return movies.find((m) => m.id === id) || null;
}

export function createLocalMovie(movie: Movie): Movie {
  const movies = getLocalMovies();
  movies.unshift(movie);
  saveLocalMovies(movies);
  return movie;
}

export function updateLocalMovie(id: string, updates: Partial<Movie>): Movie | null {
  const movies = getLocalMovies();
  const index = movies.findIndex((m) => m.id === id);
  if (index === -1) return null;
  movies[index] = { ...movies[index], ...updates, updatedAt: new Date().toISOString() };
  saveLocalMovies(movies);
  return movies[index];
}

export function deleteLocalMovie(id: string): boolean {
  const movies = getLocalMovies();
  const nextMovies = movies.filter((m) => m.id !== id);
  if (nextMovies.length === movies.length) return false;
  saveLocalMovies(nextMovies);
  return true;
}

// ----------------- OTP RECORDS -----------------

export function getLocalOtps(): StoredOtp[] {
  ensureDataDir();
  try {
    const raw = fs.readFileSync(OTP_FILE, 'utf-8');
    return JSON.parse(raw) as StoredOtp[];
  } catch {
    return [];
  }
}

export function saveLocalOtps(otps: StoredOtp[]): void {
  ensureDataDir();
  fs.writeFileSync(OTP_FILE, JSON.stringify(otps, null, 2), 'utf-8');
}
