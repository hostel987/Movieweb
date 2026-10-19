import React from 'react';
import Link from 'next/link';
import { Film, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-[#050608] border-t border-white/5 pt-12 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center">
                <Film className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black tracking-wider text-white">
                CINE<span className="text-red-500">PULSE</span>
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              An original cinematic movie streaming platform built for high-definition streaming, interactive discovery, and creators.
            </p>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Shield className="w-3.5 h-3.5 text-red-500" />
              <span>Verified PostgreSQL & Storage Protection</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3">Explore</h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><Link href="/" className="hover:text-white transition-colors">Featured Movies</Link></li>
              <li><Link href="/movies" className="hover:text-white transition-colors">Trending Now</Link></li>
              <li><Link href="/genres" className="hover:text-white transition-colors">Genres & Categories</Link></li>
              <li><Link href="/search" className="hover:text-white transition-colors">Advanced Search</Link></li>
            </ul>
          </div>

          {/* Platform Tech */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3">Technology</h4>
            <ul className="space-y-2 text-xs text-neutral-400">
              <li><span className="text-neutral-500">Frontend:</span> Next.js 16 (App Router)</li>
              <li><span className="text-neutral-500">Database:</span> Supabase PostgreSQL</li>
              <li><span className="text-neutral-500">OTP Auth:</span> Email Verification (SMTP)</li>
              <li><span className="text-neutral-500">Video CDN:</span> Cloudflare R2 / Storage</li>
            </ul>
          </div>

          {/* Administrator Notice */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 mb-3">Admin Portal</h4>
            <p className="text-xs text-neutral-400 leading-relaxed mb-3">
              Designated administration is bound to <span className="text-red-400 font-mono">hostelform31@gmail.com</span> with server-side authorization.
            </p>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <span>Admin Access</span> &rarr;
            </Link>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>&copy; 2026 CinePulse Streaming. Original brand & UI. Royalty-free demonstration movies.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-neutral-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-neutral-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-neutral-400 cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
