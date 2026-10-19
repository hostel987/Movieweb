'use client';

import React from 'react';
import { Search, X, Filter, RotateCcw } from 'lucide-react';

interface MovieFilterBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedGenre: string;
  onGenreChange: (value: string) => void;
  selectedYear: string;
  onYearChange: (value: string) => void;
  selectedLanguage: string;
  onLanguageChange: (value: string) => void;
  onReset: () => void;
  totalResults?: number;
}

const GENRES = [
  'All',
  'Action',
  'Sci-Fi',
  'Fantasy',
  'Animation',
  'Thriller',
  'Comedy',
  'Drama',
  'Family',
  'Mystery',
];

const YEARS = ['All', '2026', '2025', '2024', '2023', '2022'];

const LANGUAGES = ['All', 'English', 'Japanese', 'Spanish', 'French'];

export default function MovieFilterBar({
  searchTerm,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  selectedYear,
  onYearChange,
  selectedLanguage,
  onLanguageChange,
  onReset,
  totalResults,
}: MovieFilterBarProps) {
  const hasActiveFilters =
    Boolean(searchTerm) ||
    selectedGenre !== 'All' ||
    selectedYear !== 'All' ||
    selectedLanguage !== 'All';

  return (
    <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 mb-8 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search movies by title, cast, or synopsis..."
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-red-500 transition-colors"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Genre */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-[11px] text-neutral-400 font-medium">Genre:</span>
            <select
              value={selectedGenre}
              onChange={(e) => onGenreChange(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
            >
              {GENRES.map((g) => (
                <option key={g} value={g} className="bg-neutral-900 text-white">
                  {g}
                </option>
              ))}
            </select>
          </div>

          {/* Release Year */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-[11px] text-neutral-400 font-medium">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => onYearChange(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
            >
              {YEARS.map((y) => (
                <option key={y} value={y} className="bg-neutral-900 text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-[11px] text-neutral-400 font-medium">Lang:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l} className="bg-neutral-900 text-white">
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Button */}
          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Count indicator */}
      {totalResults !== undefined && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-neutral-400">
          <span>
            Showing <strong className="text-white">{totalResults}</strong> movie
            {totalResults === 1 ? '' : 's'}
          </span>
          {hasActiveFilters && (
            <span className="text-red-400 text-[11px] font-medium">Filtered results</span>
          )}
        </div>
      )}
    </div>
  );
}
