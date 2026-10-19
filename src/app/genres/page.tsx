'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MovieCard from '@/components/movie/MovieCard';
import MovieDetailsModal from '@/components/movie/MovieDetailsModal';
import { Movie } from '@/types';
import { Layers, Film } from 'lucide-react';

const GENRE_LIST = [
  'All',
  'Action',
  'Sci-Fi',
  'Fantasy',
  'Animation',
  'Thriller',
  'Comedy',
  'Drama',
  'Family',
];

export default function GenresPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [activeGenre, setActiveGenre] = useState<string>('All');
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadMovies() {
      try {
        setLoading(true);
        const res = await fetch('/api/movies');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.movies)) {
            setMovies(data.movies);
          }
        }
      } catch (err) {
        console.error('Failed to load movies:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMovies();
  }, []);

  const filtered =
    activeGenre === 'All'
      ? movies
      : movies.filter((m) =>
          m.genre.some((g) => g.toLowerCase() === activeGenre.toLowerCase())
        );

  return (
    <div className="min-h-screen flex flex-col bg-[#07080b] text-[#f3f4f6]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <Layers className="w-6 h-6 text-red-500" />
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Movie Genres
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400">
            Browse movies by cinematic style, mood, and genre.
          </p>
        </div>

        {/* Genre Pill Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-6 mb-4">
          {GENRE_LIST.map((genre) => {
            const count =
              genre === 'All'
                ? movies.length
                : movies.filter((m) =>
                    m.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
                  ).length;
            const isActive = activeGenre === genre;

            return (
              <button
                key={genre}
                onClick={() => setActiveGenre(genre)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 scale-105'
                    : 'bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/5'
                }`}
              >
                <span>{genre}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-neutral-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="aspect-[2/3] bg-neutral-900 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center my-12 max-w-md mx-auto">
            <Film className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Movies in {activeGenre}</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Check back soon for new additions in this genre.
            </p>
            <button
              onClick={() => setActiveGenre('All')}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
            >
              View All Genres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filtered.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onOpenDetails={(m) => setSelectedMovie(m)}
              />
            ))}
          </div>
        )}
      </main>

      <MovieDetailsModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />

      <Footer />
    </div>
  );
}
