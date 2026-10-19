'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { X, Play, Clock, Calendar, Globe, Film, Award, UserCheck } from 'lucide-react';
import { Movie } from '@/types';

interface MovieDetailsModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export default function MovieDetailsModal({ movie, onClose }: MovieDetailsModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (movie) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [movie, onClose]);

  if (!movie) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden glass-panel border border-white/10 shadow-2xl my-8 text-neutral-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-colors"
          aria-label="Close details"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Backdrop in Modal */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-neutral-900">
          <img
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0e111a] via-[#0e111a]/40 to-transparent" />

          {/* Quick Play Action over Backdrop */}
          <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {movie.rating && (
                  <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                    {movie.rating}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded bg-white/15 text-neutral-200 font-semibold">
                  4K Ultra HD
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow">
                {movie.title}
              </h2>
            </div>

            <Link
              href={`/watch/${movie.id}`}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-xl shadow-red-600/40 hover:scale-105 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play</span>
            </Link>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-400 border-b border-white/5 pb-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-red-500" />
              <span>{movie.releaseYear}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-red-500" />
              <span>{movie.duration} Minutes</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-red-500" />
              <span>{movie.language}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Film className="w-4 h-4 text-red-500" />
              <span>{movie.genre.join(', ')}</span>
            </span>
          </div>

          {/* Synopsis */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Synopsis
            </h3>
            <p className="text-neutral-300 text-sm sm:text-base leading-relaxed">
              {movie.description}
            </p>
          </div>

          {/* Cast and Crew */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Director
              </h4>
              <p className="text-sm text-white font-medium">{movie.director || 'N/A'}</p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Starring Cast
              </h4>
              <p className="text-sm text-neutral-300">
                {movie.cast && movie.cast.length > 0 ? movie.cast.join(', ') : 'Not specified'}
              </p>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              ID: {movie.id} &bull; Published: {new Date(movie.createdAt).toLocaleDateString()}
            </span>
            <Link
              href={`/watch/${movie.id}`}
              className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-all"
            >
              Start Streaming
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
