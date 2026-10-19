'use client';

import React from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle,
  Calendar,
  LogOut,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function AccountPage() {
  const { user, isAdmin, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#07080b] text-[#f3f4f6]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-[#07080b] text-[#f3f4f6]">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto px-4 flex flex-col items-center justify-center text-center pt-28 pb-16">
          <User className="w-16 h-16 text-neutral-600 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
          <p className="text-xs text-neutral-400 mb-6">
            Please log in to view your profile settings and membership status.
          </p>
          <Link
            href="/auth/login"
            className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs"
          >
            Sign In Now
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#07080b] text-[#f3f4f6]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-16 w-full">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">My Account</h1>
            <p className="text-xs text-neutral-400 mt-1">
              Manage your personal streaming profile and security credentials
            </p>
          </div>

          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Profile Card */}
        <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-8 shadow-2xl border border-white/10">
          {/* Avatar and Main Info */}
          <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-white/5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center font-black text-2xl text-white shadow-xl">
              {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>

            <div className="text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl font-bold text-white">{user.fullName}</h2>
                <span
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    user.role === 'admin'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {user.role}
                </span>
                {(user.emailVerified || user.phoneVerified) && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {user.emailVerified ? 'Verified Email' : 'Verified Mobile'}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400">{user.email}</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-red-500" />
                Email Address
              </span>
              <p className="text-sm font-medium text-white">{user.email}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-red-500" />
                Mobile Number
              </span>
              <p className="text-sm font-medium text-white">{user.phoneNumber || 'Not provided'}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-red-500" />
                Account Role
              </span>
              <p className="text-sm font-medium text-white capitalize">{user.role}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-red-500" />
                Member Since
              </span>
              <p className="text-sm font-medium text-white">
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
              </p>
            </div>
          </div>

          {/* Admin Banner if Admin */}
          {isAdmin && (
            <div className="p-5 rounded-xl bg-red-600/10 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  Administrator Privileges Active
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  You are verified as the system administrator (<span className="text-red-400">hostelform31@gmail.com</span>). Access the dashboard to manage movies, files, and users.
                </p>
              </div>

              <Link
                href="/admin"
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs whitespace-nowrap shadow-md shadow-red-950 flex items-center gap-1.5"
              >
                <span>Open Admin Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
