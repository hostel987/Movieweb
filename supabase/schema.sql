-- ====================================================================
-- CinePulse Streaming Platform - Production PostgreSQL Schema
-- Compatible with Supabase PostgreSQL & Standard PostgreSQL
-- ====================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Drop existing tables if re-running migration
DROP TABLE IF EXISTS public.movies CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 3. Profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT NOT NULL,
    phone_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    avatar_url TEXT,
    password_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for email lookups
CREATE INDEX idx_profiles_email ON public.profiles (email);
CREATE INDEX idx_profiles_phone ON public.profiles (phone_number);

-- 4. Movies table
CREATE TABLE public.movies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    poster_storage_key TEXT NOT NULL,
    video_storage_key TEXT NOT NULL,
    poster_url TEXT NOT NULL,
    video_url TEXT NOT NULL,
    backdrop_url TEXT,
    genre TEXT[] NOT NULL DEFAULT '{}',
    release_year INTEGER NOT NULL CHECK (release_year >= 1900 AND release_year <= 2100),
    language TEXT NOT NULL DEFAULT 'English',
    duration INTEGER NOT NULL CHECK (duration > 0), -- duration in minutes
    rating TEXT DEFAULT 'PG-13',
    featured BOOLEAN DEFAULT FALSE,
    cast_members TEXT[] DEFAULT '{}',
    director TEXT,
    publication_status TEXT NOT NULL DEFAULT 'draft' CHECK (publication_status IN ('draft', 'published', 'archived')),
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast browsing and searching
CREATE INDEX idx_movies_publication ON public.movies (publication_status);
CREATE INDEX idx_movies_release_year ON public.movies (release_year);
CREATE INDEX idx_movies_language ON public.movies (language);
CREATE INDEX idx_movies_title ON public.movies USING gin (to_tsvector('english', title));

-- 5. (Email OTP codes are short-lived and are tracked in the application's
-- local verification store; no database table is required for them.)

-- 6. Trigger to automatically update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movies_updated_at
BEFORE UPDATE ON public.movies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 7. Admin role bootstrap function and trigger
-- Automatically assign the 'admin' role if the email matches hostelform31@gmail.com
CREATE OR REPLACE FUNCTION assign_admin_role_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF LOWER(NEW.email) = 'hostelform31@gmail.com' THEN
        NEW.role = 'admin';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_admin_email_role
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION assign_admin_role_on_insert();

-- 8. Row Level Security (RLS) Policies
-- NOTE: policies must never subquery the table they protect - that causes
-- "infinite recursion detected in policy" errors. The is_admin() helper is
-- SECURITY DEFINER so it can read profiles without re-triggering the policy.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Public users can view their own profile; admins can view all profiles
CREATE POLICY "Users can read own profile or admin can read all"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

-- Movies policies
-- Anyone can view published movies
CREATE POLICY "Public can view published movies"
ON public.movies FOR SELECT
USING (publication_status = 'published');

-- Only admins can view unpublished/draft movies
CREATE POLICY "Admins can view all movies"
ON public.movies FOR SELECT
USING (public.is_admin());

-- Only admins can insert movies
CREATE POLICY "Admins can insert movies"
ON public.movies FOR INSERT
WITH CHECK (public.is_admin());

-- Only admins can update movies
CREATE POLICY "Admins can update movies"
ON public.movies FOR UPDATE
USING (public.is_admin());

-- Only admins can delete movies
CREATE POLICY "Admins can delete movies"
ON public.movies FOR DELETE
USING (public.is_admin());

-- ====================================================================
-- Initial Seed: Designated Administrator (hostelform31@gmail.com)
-- Password for initial seed: 1234princ@
-- Salted bcrypt hash of '1234princ@'
-- ====================================================================
INSERT INTO public.profiles (
    id,
    full_name,
    email,
    phone_number,
    phone_verified,
    email_verified,
    role,
    password_hash
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Lead Administrator',
    'hostelform31@gmail.com',
    '+15550192834',
    TRUE,
    TRUE,
    'admin',
    '$2b$10$mL7zpXhYUii9FMrC4o8ehOqix4TDid0aRZ3t0s0WmSg0WkEZ4oc/2'
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    phone_verified = TRUE,
    email_verified = TRUE,
    password_hash = EXCLUDED.password_hash;

