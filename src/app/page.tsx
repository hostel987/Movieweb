'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroBanner from '@/components/movie/HeroBanner';
import MovieRow from '@/components/movie/MovieRow';
import MovieCard from '@/components/movie/MovieCard';
import MovieDetailsModal from '@/components/movie/MovieDetailsModal';
import MovieFilterBar from '@/components/movie/MovieFilterBar';
import { Movie } from '@/types';
import { Film, AlertTriangle, Sparkles, Flame, Clock, Compass } from 'lucide-react';

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('All');

  // Fetch Published Movies
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
        console.error('Failed to load published movies:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMovies();
  }, []);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedGenre('All');
    setSelectedYear('All');
    setSelectedLanguage('All');
  };

  const isFiltering =
    Boolean(searchTerm) ||
    selectedGenre !== 'All' ||
    selectedYear !== 'All' ||
    selectedLanguage !== 'All';

  // Apply Client Filtering
  const filteredMovies = movies.filter((movie) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchTitle = movie.title.toLowerCase().includes(q);
      const matchDesc = movie.description.toLowerCase().includes(q);
      const matchGenre = movie.genre.some((g) => g.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchGenre) return false;
    }

    if (selectedGenre !== 'All') {
      const match = movie.genre.some(
        (g) => g.toLowerCase() === selectedGenre.toLowerCase()
      );
      if (!match) return false;
    }

    if (selectedYear !== 'All') {
      if (movie.releaseYear.toString() !== selectedYear) return false;
    }

    if (selectedLanguage !== 'All') {
      if (movie.language.toLowerCase() !== selectedLanguage.toLowerCase()) return false;
    }

    return true;
  });

  // Recent Uploaded Movies for Hero Banner Carousel (Newest uploaded first)
  const recentHeroMovies = [...movies].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Movie Row Splits
  const trendingMovies = [...movies].sort((a, b) => (b.viewsCount || 0) - (a.viewsCount || 0));
  const recentlyAdded = [...movies].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const actionSciFi = movies.filter((m) =>
    m.genre.some((g) => ['action', 'sci-fi'].includes(g.toLowerCase()))
  );
  const animationFamily = movies.filter((m) =>
    m.genre.some((g) => ['animation', 'family', 'comedy'].includes(g.toLowerCase()))
  );
  const fantasyDrama = movies.filter((m) =>
    m.genre.some((g) => ['fantasy', 'drama', 'thriller', 'mystery'].includes(g.toLowerCase()))
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#07080b] text-[#f3f4f6]">
      <Navbar />

      <main className="flex-1 pb-16">
        {/* Loading Skeleton */}
        {loading ? (
          <div className="w-full">
            <div className="w-full h-[70vh] bg-neutral-900 animate-pulse flex items-center justify-center">
              <Film className="w-12 h-12 text-neutral-800 animate-bounce" />
            </div>
            <div className="max-w-7xl mx-auto px-4 mt-8 space-y-6">
              <div className="h-6 w-48 bg-neutral-800 rounded animate-pulse" />
              <div className="flex gap-4 overflow-hidden">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="w-48 aspect-[2/3] bg-neutral-900 rounded-xl animate-pulse flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Recent Uploaded Movies Hero Carousel */}
            {!isFiltering && recentHeroMovies.length > 0 && (
              <HeroBanner
                movies={recentHeroMovies}
                onOpenDetails={(movie) => setSelectedMovie(movie)}
              />
            )}

            {/* Main Interactive Browser Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              {/* Filter and Live Search Bar */}
              <MovieFilterBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedGenre={selectedGenre}
                onGenreChange={setSelectedGenre}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
                selectedLanguage={selectedLanguage}
                onLanguageChange={setSelectedLanguage}
                onReset={handleResetFilters}
                totalResults={filteredMovies.length}
              />

              {/* If User is Actively Filtering/Searching: Show Grid View */}
              {isFiltering ? (
                <div className="my-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Compass className="w-5 h-5 text-red-500" />
                    <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      Search & Filter Results
                    </h2>
                  </div>

                  {filteredMovies.length === 0 ? (
                    <div className="glass-panel rounded-2xl p-12 text-center my-6 max-w-lg mx-auto">
                      <Film className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-white mb-1">No Movies Found</h3>
                      <p className="text-xs text-neutral-400 mb-4">
                        We couldn&apos;t find any published films matching your current filter criteria.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                      >
                        Clear Filters
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
                </div>
              ) : (
                /* Default Cinematic Categorized Rows */
                <div className="space-y-4">
                  <MovieRow
                    title="Trending Now"
                    subtitle="Most popular cinematic hits streamed by CinePulse members"
                    movies={trendingMovies}
                    onOpenDetails={(m) => setSelectedMovie(m)}
                  />

                  <MovieRow
                    title="Recently Added"
                    subtitle="Fresh releases, trailers, and remastered classics"
                    movies={recentlyAdded}
                    onOpenDetails={(m) => setSelectedMovie(m)}
                  />

                  {actionSciFi.length > 0 && (
                    <MovieRow
                      title="Action & Sci-Fi"
                      subtitle="Futuristic thrillers, space epics, and high velocity adventures"
                      movies={actionSciFi}
                      onOpenDetails={(m) => setSelectedMovie(m)}
                    />
                  )}

                  {animationFamily.length > 0 && (
                    <MovieRow
                      title="Animation & Family"
                      subtitle="Award-winning animated films and uplifting stories"
                      movies={animationFamily}
                      onOpenDetails={(m) => setSelectedMovie(m)}
                    />
                  )}

                  {fantasyDrama.length > 0 && (
                    <MovieRow
                      title="Fantasy & Drama"
                      subtitle="Immersive storytelling, dragons, and psychological mysteries"
                      movies={fantasyDrama}
                      onOpenDetails={(m) => setSelectedMovie(m)}
                    />
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* Movie Details Modal */}
      <MovieDetailsModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
      />

      <Footer />
    </div>
  );
}
