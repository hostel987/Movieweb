'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import MovieCard from '@/components/movie/MovieCard';
import MovieFilterBar from '@/components/movie/MovieFilterBar';
import MovieDetailsModal from '@/components/movie/MovieDetailsModal';
import { Movie } from '@/types';
import { Film, Clapperboard } from 'lucide-react';

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');

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

  const handleReset = () => {
    setSearchTerm('');
    setSelectedGenre('All');
    setSelectedYear('All');
    setSelectedLanguage('All');
  };

  const filteredMovies = movies.filter((movie) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        movie.title.toLowerCase().includes(q) ||
        movie.description.toLowerCase().includes(q) ||
        movie.genre.some((g) => g.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (selectedGenre !== 'All') {
      if (!movie.genre.some((g) => g.toLowerCase() === selectedGenre.toLowerCase())) return false;
    }
    if (selectedYear !== 'All') {
      if (movie.releaseYear.toString() !== selectedYear) return false;
    }
    if (selectedLanguage !== 'All') {
      if (movie.language.toLowerCase() !== selectedLanguage.toLowerCase()) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#07080b] text-[#f3f4f6]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <Clapperboard className="w-6 h-6 text-red-500" />
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              All Movies
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400">
            Browse our entire curated catalogue of 4K cinematic movies and original releases.
          </p>
        </div>

        {/* Filter Bar */}
        <MovieFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedGenre={selectedGenre}
          onGenreChange={setSelectedGenre}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          selectedLanguage={selectedLanguage}
          onLanguageChange={setSelectedLanguage}
          onReset={handleReset}
          totalResults={filteredMovies.length}
        />

        {/* Movie Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div
                key={i}
                className="aspect-[2/3] bg-neutral-900 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 text-center my-12 max-w-md mx-auto">
            <Film className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">No Movies Matching Filter</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Try adjusting your genre, release year, or language parameters.
            </p>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredMovies.map((movie) => (
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
