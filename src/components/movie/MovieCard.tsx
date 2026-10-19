'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Info, Clock, Calendar } from 'lucide-react';
import { Movie } from '@/types';

interface MovieCardProps {
  movie: Movie;
  onOpenDetails?: (movie: Movie) => void;
}

export default function MovieCard({ movie, onOpenDetails }: MovieCardProps) {
  return (
    <div className="group relative flex-shrink-0 w-44 sm:w-52 md:w-56 cursor-pointer select-none">
      {/* Poster Image Container */}
      <div
        onClick={() => onOpenDetails?.(movie)}
        className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-neutral-900 border border-white/10 shadow-lg transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-2xl group-hover:shadow-red-950 group-hover:border-red-500/50"
      >
        <img
          src={movie.posterUrl}
          alt={movie.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Gradient Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3.5">
          {/* Quick Play Button */}
          <div className="flex items-center justify-between mb-2">
            <Link
              href={`/watch/${movie.id}`}
              onClick={(e) => e.stopPropagation()}
              className="w-10 h-10 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/50 hover:scale-110 transition-transform"
              title="Play Now"
            >
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </Link>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails?.(movie);
              }}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
              title="More Info"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <p className="text-white font-bold text-sm leading-tight truncate">{movie.title}</p>
            <div className="flex items-center gap-2 text-[11px] text-neutral-300 font-medium">
              <span>{movie.releaseYear}</span>
              <span>&bull;</span>
              <span>{movie.duration}m</span>
              {movie.rating && (
                <span className="px-1.5 py-0.2 rounded bg-white/15 text-[10px] text-neutral-200">
                  {movie.rating}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {movie.genre.slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="text-[9px] px-1.5 py-0.5 rounded bg-red-600/30 text-red-200 font-medium"
                >
                  {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Top Badges */}
        {movie.featured && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-red-600/90 text-white text-[10px] font-bold tracking-wider uppercase shadow">
            Featured
          </div>
        )}
      </div>

      {/* Title Below Poster (visible always on small screens/browsing) */}
      <div className="mt-2.5 px-0.5">
        <h3
          onClick={() => onOpenDetails?.(movie)}
          className="text-white text-xs sm:text-sm font-semibold truncate group-hover:text-red-400 transition-colors"
        >
          {movie.title}
        </h3>
        <p className="text-neutral-400 text-[11px] flex items-center gap-2 mt-0.5">
          <span>{movie.releaseYear}</span>
          <span>&bull;</span>
          <span>{movie.genre[0] || 'Movie'}</span>
        </p>
      </div>
    </div>
  );
}
