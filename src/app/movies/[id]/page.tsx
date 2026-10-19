'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MovieCard from '@/components/movie/MovieCard';
import { Movie } from '@/types';
import {
  Play,
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  Film,
  Sparkles,
  Share2,
  AlertCircle
} from 'lucide-react';

function MovieDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const movieId = params?.id as string;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [relatedMovies, setRelatedMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMovieData() {
      if (!movieId) return;
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/movies/${movieId}`);
        if (!res.ok) {
          setError('Movie not found or not currently available for streaming.');
          setLoading(false);
          return;
        }

        const data = await res.json();
        if (data.success && data.movie) {
          setMovie(data.movie);

          // Fetch related movies
          const allRes = await fetch('/api/movies');
          if (allRes.ok) {
            const allData = await allRes.json();
            if (allData.success && Array.isArray(allData.movies)) {
              const currentGenre = data.movie.genre[0];
              const related = allData.movies.filter(
                (m: Movie) => m.id !== data.movie.id && m.genre.includes(currentGenre)
              );
              setRelatedMovies(related.slice(0, 5));
            }
          }
        } else {
          setError('Unable to load movie details.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Network error loading movie.');
      } finally {
        setLoading(false);
      }
    }

    fetchMovieData();
  }, [movieId]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#07080b] text-[#f3f4f6]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-24">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex flex-col bg-[#07080b] text-[#f3f4f6]">
        <Navbar />
        <div className="flex-1 max-w-lg mx-auto px-4 flex flex-col items-center justify-center text-center pt-28 pb-16">
          <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Movie Unavailable</h1>
          <p className="text-xs text-neutral-400 mb-6">{error || 'Movie could not be loaded.'}</p>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors"
          >
            Back to Home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#07080b] text-[#f3f4f6]">
      <Navbar />

      <main className="flex-1">
        {/* Full Backdrop Header */}
        <div className="relative w-full h-[60vh] sm:h-[70vh] min-h-[450px] overflow-hidden">
          <img
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07080b] via-[#07080b]/80 to-transparent w-full md:w-2/3" />

          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="absolute top-24 left-4 sm:left-8 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel text-white text-xs font-semibold hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {/* Header Title info */}
          <div className="absolute bottom-10 left-4 sm:left-8 lg:left-12 max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="px-2.5 py-0.5 rounded bg-red-600 text-white shadow uppercase tracking-wider text-[11px]">
                4K Ultra HD
              </span>
              {movie.rating && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {movie.rating}
                </span>
              )}
              <span className="text-neutral-300">
                {movie.releaseYear} &bull; {movie.duration}m &bull; {movie.language}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-lg">
              {movie.title}
            </h1>

            <div className="pt-2 flex items-center gap-3">
              <Link
                href={`/watch/${movie.id}`}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-all"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Play Movie</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Left 2 Cols: Synopsis, Details, Cast */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Storyline
                </h2>
                <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
                  {movie.description}
                </p>
              </div>

              {/* Movie Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 glass-panel rounded-2xl p-5">
                <div>
                  <span className="text-[11px] text-neutral-500 uppercase font-semibold block">
                    Release Year
                  </span>
                  <span className="text-sm font-bold text-white mt-0.5 block">
                    {movie.releaseYear}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-500 uppercase font-semibold block">
                    Duration
                  </span>
                  <span className="text-sm font-bold text-white mt-0.5 block">
                    {movie.duration} min
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-500 uppercase font-semibold block">
                    Audio / Lang
                  </span>
                  <span className="text-sm font-bold text-white mt-0.5 block">
                    {movie.language}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-neutral-500 uppercase font-semibold block">
                    Status
                  </span>
                  <span className="text-sm font-bold text-emerald-400 mt-0.5 block capitalize">
                    {movie.publicationStatus}
                  </span>
                </div>
              </div>

              {/* Cast and Director */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Director
                  </h3>
                  <p className="text-sm text-white font-medium">{movie.director || 'N/A'}</p>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Cast Members
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.cast && movie.cast.length > 0 ? (
                      movie.cast.map((actor) => (
                        <span
                          key={actor}
                          className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-neutral-200"
                        >
                          {actor}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-neutral-500">Not specified</span>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                    Genres
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.genre.map((g) => (
                      <span
                        key={g}
                        className="text-xs px-3 py-1 rounded-lg bg-red-600/20 border border-red-500/30 text-red-300 font-medium"
                      >
                        {g}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Poster Card */}
            <div>
              <div className="aspect-[2/3] w-full max-w-sm rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-2xl mx-auto">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* More Like This */}
          {relatedMovies.length > 0 && (
            <div className="mt-16 pt-10 border-t border-white/10">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
                More Like This
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {relatedMovies.map((rel) => (
                  <MovieCard key={rel.id} movie={rel} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function MovieDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#07080b] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <MovieDetailPageContent />
    </Suspense>
  );
}
