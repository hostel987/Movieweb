import { Movie, PublicationStatus, MovieFilterOptions } from '@/types';
import { supabase, supabaseAdmin, isSupabaseConfigured, isSupabaseAdminConfigured } from './supabase';
import {
  getLocalMovies,
  findLocalMovieById,
  createLocalMovie,
  updateLocalMovie,
  deleteLocalMovie,
} from './local-db';

/**
 * Retrieve movies with filtering, search, and publication status controls.
 * Normal visitors and users are restricted to 'published' status only.
 */
export async function getMovies(options: MovieFilterOptions = {}): Promise<Movie[]> {
  const { search, genre, releaseYear, language, publicationStatus } = options;

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('movies').select('*');

      if (publicationStatus) {
        query = query.eq('publication_status', publicationStatus);
      } else {
        // Default safe behaviour: published only
        query = query.eq('publication_status', 'published');
      }

      if (releaseYear) {
        query = query.eq('release_year', releaseYear);
      }

      if (language) {
        query = query.ilike('language', language);
      }

      if (search && search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (!error && data) {
        let movies = data.map(mapSupabaseMovie);
        if (genre && genre !== 'All') {
          movies = movies.filter((m) =>
            m.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
          );
        }
        return movies;
      }
    } catch {
      // Fallback to local DB if Supabase query encounters network error
    }
  }

  // Local persistent database fallback
  let movies = getLocalMovies();

  if (publicationStatus) {
    movies = movies.filter((m) => m.publicationStatus === publicationStatus);
  } else {
    // Normal users only see published movies
    movies = movies.filter((m) => m.publicationStatus === 'published');
  }

  if (genre && genre !== 'All') {
    movies = movies.filter((m) =>
      m.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    );
  }

  if (releaseYear) {
    movies = movies.filter((m) => m.releaseYear === releaseYear);
  }

  if (language && language !== 'All') {
    movies = movies.filter((m) => m.language.toLowerCase() === language.toLowerCase());
  }

  if (search && search.trim()) {
    const term = search.trim().toLowerCase();
    movies = movies.filter(
      (m) =>
        m.title.toLowerCase().includes(term) ||
        m.description.toLowerCase().includes(term) ||
        m.genre.some((g) => g.toLowerCase().includes(term))
    );
  }

  return movies.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Retrieve all movies for Admin Dashboard (includes drafts & published)
 */
export async function getAllMoviesAdmin(): Promise<Movie[]> {
  if (isSupabaseAdminConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('movies')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(mapSupabaseMovie);
      }
    } catch {
      // fallback
    }
  }

  return getLocalMovies().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Get a single movie by ID
 */
export async function getMovieById(id: string, allowDraft = false): Promise<Movie | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const client = allowDraft && supabaseAdmin ? supabaseAdmin : supabase;
      let query = client.from('movies').select('*').eq('id', id);

      if (!allowDraft) {
        query = query.eq('publication_status', 'published');
      }

      const { data, error } = await query.single();
      if (!error && data) {
        return mapSupabaseMovie(data);
      }
    } catch {
      // fallback
    }
  }

  const movie = findLocalMovieById(id);
  if (!movie) return null;
  if (!allowDraft && movie.publicationStatus !== 'published') return null;
  return movie;
}

/**
 * Create a new movie (Admin Only)
 */
export async function createMovie(
  movieData: Omit<Movie, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount'>,
  adminUserId: string
): Promise<Movie> {
  const newMovie: Movie = {
    ...movieData,
    id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    uploadedBy: adminUserId,
    viewsCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (isSupabaseAdminConfigured && supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('movies')
        .insert({
          title: newMovie.title,
          description: newMovie.description,
          poster_storage_key: newMovie.posterStorageKey,
          video_storage_key: newMovie.videoStorageKey,
          poster_url: newMovie.posterUrl,
          video_url: newMovie.videoUrl,
          backdrop_url: newMovie.backdropUrl || newMovie.posterUrl,
          genre: newMovie.genre,
          release_year: newMovie.releaseYear,
          language: newMovie.language,
          duration: newMovie.duration,
          rating: newMovie.rating || 'PG-13',
          featured: newMovie.featured || false,
          cast_members: newMovie.cast,
          director: newMovie.director,
          publication_status: newMovie.publicationStatus,
          uploaded_by: adminUserId,
        })
        .select()
        .single();

      if (!error && data) {
        return mapSupabaseMovie(data);
      }
    } catch {
      // fallback
    }
  }

  return createLocalMovie(newMovie);
}

/**
 * Update an existing movie (Admin Only)
 */
export async function updateMovie(id: string, updates: Partial<Movie>): Promise<Movie | null> {
  if (isSupabaseAdminConfigured && supabaseAdmin) {
    try {
      const payload: Record<string, unknown> = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.posterStorageKey !== undefined) payload.poster_storage_key = updates.posterStorageKey;
      if (updates.videoStorageKey !== undefined) payload.video_storage_key = updates.videoStorageKey;
      if (updates.posterUrl !== undefined) payload.poster_url = updates.posterUrl;
      if (updates.videoUrl !== undefined) payload.video_url = updates.videoUrl;
      if (updates.backdropUrl !== undefined) payload.backdrop_url = updates.backdropUrl;
      if (updates.genre !== undefined) payload.genre = updates.genre;
      if (updates.releaseYear !== undefined) payload.release_year = updates.releaseYear;
      if (updates.language !== undefined) payload.language = updates.language;
      if (updates.duration !== undefined) payload.duration = updates.duration;
      if (updates.rating !== undefined) payload.rating = updates.rating;
      if (updates.featured !== undefined) payload.featured = updates.featured;
      if (updates.cast !== undefined) payload.cast_members = updates.cast;
      if (updates.director !== undefined) payload.director = updates.director;
      if (updates.publicationStatus !== undefined) payload.publication_status = updates.publicationStatus;
      payload.updated_at = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from('movies')
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        return mapSupabaseMovie(data);
      }
    } catch {
      // fallback
    }
  }

  return updateLocalMovie(id, updates);
}

/**
 * Delete a movie record securely (Admin Only)
 */
export async function deleteMovie(id: string): Promise<boolean> {
  if (isSupabaseAdminConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from('movies').delete().eq('id', id);
      if (!error) return true;
    } catch {
      // fallback
    }
  }

  return deleteLocalMovie(id);
}

/**
 * Movie Statistics for Admin Dashboard
 */
export async function getMovieStats(): Promise<{
  totalMovies: number;
  publishedMovies: number;
  draftMovies: number;
  totalHours: number;
}> {
  const all = await getAllMoviesAdmin();
  const published = all.filter((m) => m.publicationStatus === 'published');
  const drafts = all.filter((m) => m.publicationStatus === 'draft');
  const totalMinutes = all.reduce((acc, m) => acc + (m.duration || 0), 0);

  return {
    totalMovies: all.length,
    publishedMovies: published.length,
    draftMovies: drafts.length,
    totalHours: Math.round((totalMinutes / 60) * 10) / 10,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSupabaseMovie(row: any): Movie {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    posterStorageKey: row.poster_storage_key,
    videoStorageKey: row.video_storage_key,
    posterUrl: row.poster_url,
    videoUrl: row.video_url,
    backdropUrl: row.backdrop_url || row.poster_url,
    genre: Array.isArray(row.genre) ? row.genre : [],
    releaseYear: Number(row.release_year),
    language: row.language,
    duration: Number(row.duration),
    rating: row.rating,
    featured: Boolean(row.featured),
    cast: Array.isArray(row.cast_members) ? row.cast_members : [],
    director: row.director || 'Unknown',
    publicationStatus: row.publication_status,
    uploadedBy: row.uploaded_by,
    viewsCount: Number(row.views_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
