'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import MoviePlayer from '@/components/movie/MoviePlayer';
import { Lock, ArrowLeft, Film } from 'lucide-react';

function WatchPageContent() {
  const params = useParams();
  const router = useRouter();
  const movieId = params?.id as string;

  const [movieTitle, setMovieTitle] = useState<string>('');
  const [videoSrc, setVideoSrc] = useState<string>('');
  const [posterSrc, setPosterSrc] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [authRequired, setAuthRequired] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function authorizeStream() {
      if (!movieId) return;
      try {
        setLoading(true);
        setErrorMsg(null);

        const res = await fetch(`/api/movies/${movieId}/stream`);
        const data = await res.json();

        if (res.status === 401 || data.requireLogin) {
          setAuthRequired(true);
          setLoading(false);
          return;
        }

        if (!res.ok || !data.success) {
          setErrorMsg(data.error || 'Failed to authorize movie stream.');
          setLoading(false);
          return;
        }

        setMovieTitle(data.title);
        setVideoSrc(data.streamUrl);
        setPosterSrc(data.posterUrl || '');
      } catch (err) {
        console.error('Streaming authorization error:', err);
        setErrorMsg('Network error connecting to stream server.');
      } finally {
        setLoading(false);
      }
    }

    authorizeStream();
  }, [movieId]);

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-neutral-400 font-semibold">
          Authorizing 4K Stream Session...
        </p>
      </div>
    );
  }

  // If user is not authenticated, prompt to sign in
  if (authRequired) {
    return (
      <div className="w-full h-screen bg-[#07080b] flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel rounded-2xl p-8 text-center space-y-6 shadow-2xl border border-white/10">
          <div className="w-16 h-16 rounded-full bg-red-600/20 text-red-500 border border-red-500/30 flex items-center justify-center mx-auto shadow-lg shadow-red-950">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              Streaming Login Required
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              CinePulse full movie streaming is reserved for verified members. Please sign in to your account or register with mobile OTP verification to start watching.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <Link
              href={`/auth/login?redirect=/watch/${movieId}`}
              className="w-full block py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-xl shadow-red-600/40 transition-all"
            >
              Sign In to Watch
            </Link>

            <Link
              href={`/auth/register?redirect=/watch/${movieId}`}
              className="w-full block py-3 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-semibold text-xs border border-white/10 transition-all"
            >
              Create New Account
            </Link>

            <button
              onClick={() => router.back()}
              className="w-full flex items-center justify-center gap-2 py-2 text-neutral-400 hover:text-white text-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Movie Details</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg || !videoSrc) {
    return (
      <div className="w-full h-screen bg-[#07080b] flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel rounded-2xl p-8 text-center space-y-4 shadow-2xl">
          <Film className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-white">Playback Interrupted</h2>
          <p className="text-xs text-neutral-400">{errorMsg || 'Stream could not be found.'}</p>
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-xs font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <MoviePlayer
      movieTitle={movieTitle}
      videoSrc={videoSrc}
      posterSrc={posterSrc}
      onBack={() => router.back()}
    />
  );
}

export default function WatchPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-screen bg-black flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <WatchPageContent />
    </Suspense>
  );
}
