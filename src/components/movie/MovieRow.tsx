'use client';

import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '@/types';
import MovieCard from './MovieCard';

interface MovieRowProps {
  title: string;
  subtitle?: string;
  movies: Movie[];
  onOpenDetails?: (movie: Movie) => void;
}

export default function MovieRow({ title, subtitle, movies, onOpenDetails }: MovieRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = clientWidth * 0.75;
      rowRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (!movies || movies.length === 0) return null;

  return (
    <section className="relative my-8 sm:my-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Row Header */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span className="w-1.5 h-5 rounded-full bg-red-600 inline-block" />
            {title}
          </h2>
          {subtitle && <p className="text-xs text-neutral-400 mt-1">{subtitle}</p>}
        </div>

        {/* Scroll Nav Buttons (Desktop) */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white flex items-center justify-center transition-colors border border-white/5"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white flex items-center justify-center transition-colors border border-white/5"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Movie Slider */}
      <div
        ref={rowRef}
        className="flex items-start gap-4 sm:gap-6 overflow-x-auto no-scrollbar scroll-smooth pb-4 pt-1"
      >
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onOpenDetails={onOpenDetails} />
        ))}
      </div>
    </section>
  );
}
