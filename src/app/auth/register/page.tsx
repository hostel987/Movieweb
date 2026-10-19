'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Film,
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect') || '';
  const { refreshUser } = useAuth();

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('+1');
  const [password, setPassword] = useState('');

  // Step state: 1 = Details, 2 = Email OTP Verification
  const [step, setStep] = useState<1 | 2>(1);

  // OTP State
  const [otpCode, setOtpCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Countdown timer for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Step 1: Send Email OTP
  const handleInitiateOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);

    // Basic validation
    if (fullName.trim().length < 2) {
      setError('Please provide your full name');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please provide a valid email address');
      return;
    }
    if (!/^\+[1-9]\d{9,14}$/.test(phoneNumber.replace(/[\s\-()]/g, ''))) {
      setError('Phone number must start with country code (e.g. +1234567890 or +919876543210)');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to send verification code to your email.');
        if (data.cooldownSeconds) setCooldown(data.cooldownSeconds);
        setLoading(false);
        return;
      }

      setStatusMessage(
        data.devMode
          ? 'Verification code generated. SMTP is not configured in development — check below for the code.'
          : data.message || 'Verification code sent to your email address.'
      );
      setDevCode(data.devCode || null);
      setCooldown(data.cooldownSeconds || 60);
      setOtpCode('');
      setStep(2);
    } catch {
      setError('Network error while requesting verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Resend Email OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || loading) return;
    setError(null);
    setStatusMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/otp/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to resend verification code.');
        if (data.cooldownSeconds) setCooldown(data.cooldownSeconds);
        setLoading(false);
        return;
      }

      setStatusMessage(
        data.devMode
          ? 'A new verification code was generated.'
          : 'A new verification code was sent to your email address.'
      );
      setDevCode(data.devCode || null);
      setCooldown(data.cooldownSeconds || 60);
    } catch {
      setError('Network error while resending verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Email OTP and Complete Registration
  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatusMessage(null);

    if (otpCode.trim().length !== 6) {
      setError('Please enter the 6-digit code sent to your email address');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify OTP with server
      const verifyRes = await fetch('/api/auth/otp/email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          code: otpCode.trim(),
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        setError(verifyData.error || 'Invalid or expired verification code.');
        setLoading(false);
        return;
      }

      // 2. Complete registration on server (the server derives emailVerified
      // from the consumed OTP record, so it is never sent from the client)
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          phoneNumber,
          password,
        }),
      });

      const regData = await regRes.json();
      if (!regRes.ok || !regData.success) {
        setError(regData.error || 'Failed to complete registration.');
        setLoading(false);
        return;
      }

      // 3. Update auth state and redirect
      await refreshUser();

      if (redirectTarget) {
        router.push(redirectTarget);
      } else if (regData.redirectTo) {
        router.push(regData.redirectTo);
      } else {
        router.push('/');
      }
    } catch {
      setError('An unexpected error occurred during account creation.');
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
        <h2 className="text-xl font-bold text-white tracking-tight">Create Your Account</h2>
        <p className="text-xs text-neutral-400 mt-1">
          {step === 1
            ? 'Join CinePulse to stream 4K movies with verified access'
            : 'Enter the 6-digit verification code sent to your email address'}
        </p>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <div
          className={`h-1.5 rounded-full transition-all ${
            step === 1 ? 'w-8 bg-red-600' : 'w-2 bg-emerald-500'
          }`}
        />
        <div
          className={`h-1.5 rounded-full transition-all ${
            step === 2 ? 'w-8 bg-red-600' : 'w-2 bg-neutral-700'
          }`}
        />
      </div>

      {/* Alert Messages */}
      {error && (
        <div className="mb-6 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-3 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {statusMessage && (
        <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-start gap-3 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Step 1: Details */}
      {step === 1 && (
        <form onSubmit={handleInitiateOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Prince Kumar"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
          </div>

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
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Mobile Number (International E.164)
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+14155552671"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-red-500 transition-colors"
              />
            </div>
            <p className="text-[10px] text-neutral-500 mt-1">
              Include country code e.g. +1 (US), +91 (India), +44 (UK).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
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
                <span>Continue to Email OTP</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Step 2: Email OTP Verification */}
      {step === 2 && (
        <form onSubmit={handleVerifyAndRegister} className="space-y-5">
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Verifying email:</span>
              <span className="font-mono font-semibold text-white truncate max-w-[200px]">{email}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                // Clear any stale code so a re-requested OTP starts clean
                setOtpCode('');
                setStep(1);
              }}
              className="text-red-400 hover:text-red-300 text-[11px] mt-1 underline"
            >
              Change email address
            </button>
          </div>

          {/* Dev Mode Banner with Auto-fill helper */}
          {devCode && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5 text-amber-300">
                  <Sparkles className="w-3.5 h-3.5" /> Dev Mode (SMTP Unconfigured)
                </span>
                <button
                  type="button"
                  onClick={() => setOtpCode(devCode)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-[11px] font-semibold border border-amber-500/30 transition-all hover:scale-105"
                >
                  Autofill Code
                </button>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                No email was sent to <strong className="text-white">{email}</strong> because <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">SMTP_USER</code> and <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">SMTP_PASS</code> are empty in <code className="bg-black/40 px-1 py-0.5 rounded text-amber-300 font-mono">.env.local</code>.
              </p>
              <div className="flex items-center justify-between pt-1 border-t border-amber-500/20">
                <span className="text-[11px] text-neutral-400">Dev Test Code:</span>
                <span className="font-mono text-base font-bold text-white tracking-widest bg-black/40 px-2 py-0.5 rounded border border-white/10">
                  {devCode}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 text-center">
              Enter 6-Digit Email Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              autoFocus
              className="w-full py-3 text-center tracking-[0.5em] font-mono text-2xl font-bold rounded-xl bg-black/50 border border-white/15 text-white placeholder-neutral-600 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-sm tracking-wide shadow-xl shadow-red-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Create Account</span>
              </>
            )}
          </button>

          {/* Resend Cooldown UI */}
          <div className="text-center pt-2">
            {cooldown > 0 ? (
              <p className="text-xs text-neutral-400 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                <span>Resend email in {cooldown}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="text-xs font-semibold text-red-500 hover:text-red-400 flex items-center justify-center gap-1.5 mx-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resend Verification Email</span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* Footer Link */}
      <div className="mt-6 text-center text-xs text-neutral-400">
        Already have an account?{' '}
        <Link
          href={`/auth/login${redirectTarget ? `?redirect=${redirectTarget}` : ''}`}
          className="text-red-500 hover:text-red-400 font-semibold"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#07080b] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <Suspense fallback={<div className="text-white">Loading...</div>}>
        <RegisterFormContent />
      </Suspense>
    </div>
  );
}
