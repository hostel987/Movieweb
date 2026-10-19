'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Play, Info, Sparkles, ChevronLeft, ChevronRight, Clock, Pause } from 'lucide-react';
import { Movie } from '@/types';

interface HeroBannerProps {
  movies?: Movie[];
  movie?: Movie;
  onOpenDetails: (movie: Movie) => void;
  intervalMs?: number;
}

export default function HeroBanner({
  movies,
  movie,
  onOpenDetails,
  intervalMs = 6500,
}: HeroBannerProps) {
  // Normalize movies list: if multiple are passed use them, otherwise wrap single movie
  const bannerMovies = (movies && movies.length > 0) ? movies : (movie ? [movie] : []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [animatingKey, setAnimatingKey] = useState(0);

  // Keep index within bounds if movies list changes
  useEffect(() => {
    if (bannerMovies.length > 0 && currentIndex >= bannerMovies.length) {
      setCurrentIndex(0);
    }
  }, [bannerMovies.length, currentIndex]);

  // Auto-advance carousel every intervalMs
  useEffect(() => {
    if (bannerMovies.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % bannerMovies.length);
      setAnimatingKey((k) => k + 1);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [bannerMovies.length, isPaused, intervalMs, currentIndex]);

  if (bannerMovies.length === 0) return null;

  const currentMovie = bannerMovies[currentIndex] || bannerMovies[0];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % bannerMovies.length);
    setAnimatingKey((k) => k + 1);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + bannerMovies.length) % bannerMovies.length);
    setAnimatingKey((k) => k + 1);
  };

  const handleSelectSlide = (idx: number) => {
    setCurrentIndex(idx);
    setAnimatingKey((k) => k + 1);
  };

  return (
    <div
      className="relative w-full h-[76vh] sm:h-[86vh] min-h-[580px] max-h-[920px] overflow-hidden select-none bg-[#07080b] group/banner"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-roledescription="carousel"
      aria-label="Recent Movies Banner Carousel"
    >
      {/* Background Backdrop Images with Crossfade Transitions */}
      {bannerMovies.map((m, idx) => {
        const bgImage = m.backdropUrl || m.posterUrl;
        const isActive = idx === currentIndex;
        return (
          <div
            key={m.id || idx}
            aria-hidden={!isActive}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${
              isActive
                ? 'opacity-100 scale-100 z-0'
                : 'opacity-0 scale-105 pointer-events-none z-[-1]'
            }`}
            style={{ backgroundImage: `url(${bgImage})` }}
          >
            {/* Cinematic Vignette Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#07080b] via-[#07080b]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#07080b] via-[#07080b]/80 to-transparent w-full md:w-3/4" />
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[0.5px]" />
          </div>
        );
      })}

      {/* Content Container - Animated per slide */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-16 sm:pb-24 pt-24 z-10 pointer-events-none">
        <div
          key={currentMovie.id || animatingKey}
          className="max-w-2xl space-y-4 pointer-events-auto transition-all duration-500 animate-fadeIn"
        >
          {/* Top Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            {currentMovie.featured ? (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40 uppercase tracking-wider text-[11px] font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                Featured Premiere
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-red-600/30 uppercase tracking-wider text-[11px] font-bold">
                <Clock className="w-3.5 h-3.5" />
                Latest Upload
              </span>
            )}
            <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-neutral-200 border border-white/15 text-[11px]">
              4K Ultra HD
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-neutral-200 border border-white/15 text-[11px]">
              Dolby Atmos
            </span>
            {currentMovie.rating && (
              <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px]">
                {currentMovie.rating}
              </span>
            )}
            <span className="text-neutral-400 font-normal text-xs ml-1">
              {currentMovie.releaseYear} &bull; {currentMovie.duration}m &bull; {currentMovie.language}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none drop-shadow-xl line-clamp-2">
            {currentMovie.title}
          </h1>

          {/* Description */}
          <p className="text-neutral-300 text-sm sm:text-base leading-relaxed line-clamp-3 max-w-xl drop-shadow">
            {currentMovie.description}
          </p>

          {/* Genre Chips */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {currentMovie.genre && currentMovie.genre.map((g) => (
              <span
                key={g}
                className="text-[11px] font-medium px-3 py-1 rounded-md bg-white/5 border border-white/10 text-neutral-300 backdrop-blur-sm"
              >
                {g}
              </span>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-4 pt-3">
            <Link
              href={`/watch/${currentMovie.id}`}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm tracking-wide shadow-xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Play Movie</span>
            </Link>

            <button
              onClick={() => onOpenDetails(currentMovie)}
              className="flex items-center gap-2 px-5 py-3.5 rounded-xl glass-panel text-white font-semibold text-sm hover:bg-white/15 active:scale-95 transition-all"
            >
              <Info className="w-5 h-5 text-neutral-300" />
              <span>More Details</span>
            </button>

            {isPaused && bannerMovies.length > 1 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-neutral-400 px-2.5 py-1 rounded-md bg-black/40 border border-white/5 backdrop-blur-sm">
                <Pause className="w-3 h-3 text-amber-400" />
                Paused
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Arrow Controls (if more than 1 movie) */}
      {bannerMovies.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Previous movie banner"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full glass-panel border border-white/15 items-center justify-center text-white/80 hover:text-white hover:bg-white/25 hover:scale-110 active:scale-95 transition-all shadow-2xl opacity-0 group-hover/banner:opacity-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={handleNext}
            aria-label="Next movie banner"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full glass-panel border border-white/15 items-center justify-center text-white/80 hover:text-white hover:bg-white/25 hover:scale-110 active:scale-95 transition-all shadow-2xl opacity-0 group-hover/banner:opacity-100"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Carousel Slide Indicators with Animated Progress Fill */}
          <div className="absolute right-4 sm:right-8 bottom-6 sm:bottom-10 z-20 flex items-center gap-2 max-w-[85vw] overflow-x-auto no-scrollbar py-1">
            <span className="text-[11px] font-mono text-neutral-400 px-2 py-0.5 rounded bg-black/50 border border-white/10 hidden sm:inline-block">
              {String(currentIndex + 1).padStart(2, '0')} / {String(bannerMovies.length).padStart(2, '0')}
            </span>

            {bannerMovies.map((m, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={m.id || idx}
                  onClick={() => handleSelectSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}: ${m.title}`}
                  className={`relative group h-2.5 rounded-full transition-all duration-300 overflow-hidden ${
                    isActive
                      ? 'w-10 sm:w-14 bg-white/25 ring-1 ring-red-500/50'
                      : 'w-2.5 sm:w-3 bg-white/20 hover:bg-white/40'
                  }`}
                  title={m.title}
                >
                  {isActive && (
                    <div
                      key={`progress-${currentIndex}-${animatingKey}`}
                      className="absolute inset-0 bg-gradient-to-r from-red-600 to-amber-500 h-full"
                      style={{
                        animation: !isPaused
                          ? `heroProgress ${intervalMs}ms linear forwards`
                          : 'none',
                        width: isPaused ? '100%' : undefined,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
