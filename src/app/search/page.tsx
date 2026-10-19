'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MovieCard from '@/components/movie/MovieCard';
import MovieDetailsModal from '@/components/movie/MovieDetailsModal';
import { Movie } from '@/types';
import { Search, X, Film, Sparkles } from 'lucide-react';

export default function SearchPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [query, setQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

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

  const searchResults = movies.filter((m) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.description.toLowerCase().includes(q) ||
      m.genre.some((g) => g.toLowerCase().includes(q)) ||
      (m.director && m.director.toLowerCase().includes(q)) ||
      (m.cast && m.cast.some((c) => c.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#07080b] text-[#f3f4f6]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full">
        {/* Large Cinematic Search Input Header */}
        <div className="max-w-3xl mx-auto mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
            Search CinePulse
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mb-6">
            Find movies by title, actors, directors, or storylines.
          </p>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type movie name (e.g. Sintel, Tears of Steel, Bunny)..."
              autoFocus
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl glass-panel text-white text-base placeholder-neutral-500 focus:outline-none focus:border-red-500 shadow-2xl transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Quick Suggested Keywords */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-neutral-400">
            <span className="text-[11px] text-neutral-500 font-semibold">Popular:</span>
            {['Sci-Fi', 'Animation', 'Action', 'Sintel', 'Steel', '2024'].map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/5 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="mb-4 flex items-center justify-between text-xs text-neutral-400 border-b border-white/5 pb-3">
          <span>
            {query.trim() ? (
              <>
                Results for &ldquo;<strong className="text-white">{query}</strong>&rdquo;
              </>
            ) : (
              'All Available Movies'
            )}
          </span>
          <span>{searchResults.length} movie(s) found</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="aspect-[2/3] bg-neutral-900 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : searchResults.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center my-12 max-w-md mx-auto">
            <Film className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Matches Found</h3>
            <p className="text-xs text-neutral-400 mb-4">
              We couldn&apos;t find any movies matching &ldquo;{query}&rdquo;.
            </p>
            <button
              onClick={() => setQuery('')}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
            >
              Show All Movies
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {searchResults.map((movie) => (
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
