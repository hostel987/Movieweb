'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Film, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '';

  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error || 'Invalid credentials');
        setLoading(false);
        return;
      }

      if (redirectTarget) {
        router.push(redirectTarget);
      } else if (result.redirectTo) {
        router.push(result.redirectTo);
      } else {
        router.push('/');
      }
    } catch {
      setError('An error occurred during login. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md glass-panel rounded-2xl p-8 sm:p-10 shadow-2xl border border-white/10 relative">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2 mb-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
            <Film className="w-5 h-5 text-white" />
          </div>
          <span className="text-2xl font-black tracking-wider text-white">
            CINE<span className="text-red-500">PULSE</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold text-white tracking-tight">Welcome Back</h2>
        <p className="text-xs text-neutral-400 mt-1">
          Sign in to stream 4K movies and manage your watchlist
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-3 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-neutral-300">Password</label>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-xl shadow-red-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer Link */}
      <div className="mt-6 text-center text-xs text-neutral-400">
        Don&apos;t have an account?{' '}
        <Link
          href={`/auth/register${redirectTarget ? `?redirect=${redirectTarget}` : ''}`}
          className="text-red-500 hover:text-red-400 font-semibold"
        >
          Create an Account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#07080b] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}
