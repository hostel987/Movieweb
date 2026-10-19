'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Film,
  Search,
  User,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  PlayCircle,
  SlidersHorizontal
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Movies', href: '/movies' },
    { label: 'Genres', href: '/genres' },
    { label: 'Search', href: '/search' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass-nav py-3 shadow-2xl' : 'bg-gradient-to-b from-[#07080b]/90 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
                <Film className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-wider text-white font-sans flex items-center">
                  CINE<span className="text-red-500">PULSE</span>
                </span>
                <span className="text-[9px] uppercase tracking-widest text-neutral-400 font-semibold -mt-1">
                  Streaming
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors hover:text-white ${
                      isActive ? 'text-red-500 font-semibold' : 'text-neutral-300'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Action Icons & Auth */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/search"
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
              title="Search movies"
            >
              <Search className="w-5 h-5" />
            </Link>

            {/* Admin Dashboard shortcut button if administrator */}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600 hover:text-white text-xs font-semibold tracking-wide transition-all shadow-md shadow-red-950"
              >
                <ShieldCheck className="w-4 h-4 text-red-400 group-hover:text-white" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-white/5 transition-colors focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center font-bold text-xs text-white shadow-md">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-medium text-neutral-200 max-w-[120px] truncate">
                    {user.fullName}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl glass-panel shadow-2xl py-2 z-50 text-sm">
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="font-semibold text-white truncate">{user.fullName}</p>
                      <p className="text-xs text-neutral-400 truncate">{user.email}</p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            user.role === 'admin'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {user.role}
                        </span>
                        {(user.phoneVerified || user.emailVerified) && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-500/20 text-blue-400">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Admin Console</span>
                      </Link>
                    )}

                    <Link
                      href="/account"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-neutral-300 hover:bg-white/5 transition-colors"
                    >
                      <User className="w-4 h-4 text-neutral-400" />
                      <span>My Account</span>
                    </Link>

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left text-neutral-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="text-xs font-semibold text-neutral-300 hover:text-white px-3 py-1.5 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="text-xs font-semibold px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/30 transition-all hover:scale-105"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-2">
            <Link
              href="/search"
              className="p-2 text-neutral-400 hover:text-white"
            >
              <Search className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-neutral-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-t border-white/10 px-4 pt-3 pb-6 mt-3 space-y-3">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  pathname === link.href ? 'bg-red-600/20 text-red-400' : 'text-neutral-300'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-white/10 pt-3">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-1">
                  <p className="text-sm font-semibold text-white">{user.fullName}</p>
                  <p className="text-xs text-neutral-400">{user.email}</p>
                </div>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 font-medium rounded-lg bg-red-600/10"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 rounded-lg hover:bg-white/5"
                >
                  <User className="w-4 h-4" />
                  <span>My Account</span>
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 rounded-lg hover:bg-red-500/10"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-semibold text-neutral-300 rounded-lg border border-white/10 hover:bg-white/5"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 text-sm font-semibold bg-red-600 text-white rounded-lg shadow-lg"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
