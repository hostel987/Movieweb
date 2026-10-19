import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { UserProfile, UserRole } from '@/types';
import { supabaseAdmin, isSupabaseAdminConfigured } from './supabase';
import {
  getLocalUsers,
  findLocalUserByEmail,
  findLocalUserById,
  createLocalUser,
  updateLocalUser,
  StoredUser,
} from './local-db';

export const DESIGNATED_ADMIN_EMAIL = 'hostelform31@gmail.com';

/**
 * Find user by email address (case-insensitive)
 */
export async function getUserByEmail(email: string): Promise<StoredUser | null> {
  const normalized = email.trim().toLowerCase();

  if (isSupabaseAdminConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .ilike('email', normalized)
        .single();

      if (!error && data) {
        return mapSupabaseProfile(data);
      }
    } catch {
      // fallback
    }
  }

  return findLocalUserByEmail(normalized);
}

/**
 * Find user by ID
 */
export async function getUserById(id: string): Promise<UserProfile | null> {
  if (isSupabaseAdminConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, phone_number, phone_verified, email_verified, role, avatar_url, created_at, updated_at')
        .eq('id', id)
        .single();

      if (!error && data) {
        // Never expose the stored password hash to API consumers
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { passwordHash: _hash, ...profile } = mapSupabaseProfile(data);
        return profile;
      }
    } catch {
      // fallback
    }
  }

  const local = findLocalUserById(id);
  if (!local) return null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash, ...profile } = local;
  return profile;
}

/**
 * Register or create a new user profile securely
 * Server-side rule: ONLY hostelform31@gmail.com is granted 'admin' role.
 * Public users NEVER get admin role.
 */
export async function createUser(data: {
  fullName: string;
  email: string;
  phoneNumber: string;
  password?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
}): Promise<UserProfile> {
  const normalizedEmail = data.email.trim().toLowerCase();

  // Strict server-side role assignment
  const role: UserRole =
    normalizedEmail === DESIGNATED_ADMIN_EMAIL.toLowerCase() ? 'admin' : 'user';

  const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : undefined;
  // UUID primary key: the Supabase profiles table uses a UUID id column, so a
  // local-style id ("u-...") would be rejected with invalid input syntax.
  const newId = crypto.randomUUID();
  const now = new Date().toISOString();

  const userPayload: StoredUser = {
    id: newId,
    fullName: data.fullName.trim(),
    email: normalizedEmail,
    phoneNumber: data.phoneNumber.trim(),
    phoneVerified: Boolean(data.phoneVerified),
    emailVerified: Boolean(data.emailVerified),
    role,
    avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.fullName)}&backgroundColor=1f2937`,
    passwordHash,
    createdAt: now,
    updatedAt: now,
  };

  if (isSupabaseAdminConfigured && supabaseAdmin) {
    try {
      const { data: inserted, error } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userPayload.id,
          full_name: userPayload.fullName,
          email: userPayload.email,
          phone_number: userPayload.phoneNumber,
          phone_verified: userPayload.phoneVerified,
          email_verified: userPayload.emailVerified,
          role: userPayload.role,
          avatar_url: userPayload.avatarUrl,
          password_hash: userPayload.passwordHash,
        })
        .select()
        .single();

      if (!error && inserted) {
        return mapSupabaseProfile(inserted);
      }
    } catch {
      // fallback
    }
  }

  const created = createLocalUser(userPayload);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...profile } = created;
  return profile;
}

/**
 * Mark phone number as verified for user
 */
export async function markPhoneVerified(userId: string): Promise<boolean> {
  if (isSupabaseAdminConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ phone_verified: true, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (!error) return true;
    } catch {
      // fallback
    }
  }

  const updated = updateLocalUser(userId, { phoneVerified: true });
  return Boolean(updated);
}

/**
 * Get all users (Admin Only)
 */
export async function getAllUsersAdmin(): Promise<UserProfile[]> {
  if (isSupabaseAdminConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Never expose stored password hashes to API consumers
        return data.map((row) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { passwordHash: _hash, ...profile } = mapSupabaseProfile(row);
          return profile;
        });
      }
    } catch {
      // fallback
    }
  }

  const local = getLocalUsers();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return local.map(({ passwordHash, ...rest }) => rest);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabaseProfile(row: any): StoredUser {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phoneNumber: row.phone_number,
    phoneVerified: Boolean(row.phone_verified),
    emailVerified: Boolean(row.email_verified),
    role: row.role as UserRole,
    avatarUrl: row.avatar_url,
    passwordHash: row.password_hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
