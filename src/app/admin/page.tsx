'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Movie, UserProfile } from '@/types';
import {
  ShieldCheck,
  Film,
  Upload,
  Settings,
  Users,
  BarChart3,
  LogOut,
  Plus,
  Trash2,
  Edit,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  Search,
  Check,
  X,
  Play,
  Image as ImageIcon,
  Video,
  Link2,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { validateVideoUrl } from '@/lib/services/validation';
import { parseVideoSource } from '@/lib/video-source';

type AdminTab = 'overview' | 'upload' | 'manage-movies' | 'manage-users';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Stats State
  const [stats, setStats] = useState({
    totalMovies: 0,
    publishedMovies: 0,
    draftMovies: 0,
    registeredUsers: 0,
    totalHours: 0,
  });

  // Movies & Users lists
  const [adminMovies, setAdminMovies] = useState<Movie[]>([]);
  const [adminUsers, setAdminUsers] = useState<UserProfile[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [movieFilter, setMovieFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [movieSearch, setMovieSearch] = useState<string>('');

  // Notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Upload Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [genreInput, setGenreInput] = useState('Action, Sci-Fi');
  const [releaseYear, setReleaseYear] = useState('2026');
  const [language, setLanguage] = useState('English');
  const [duration, setDuration] = useState('120');
  const [rating, setRating] = useState('PG-13');
  const [cast, setCast] = useState('');
  const [director, setDirector] = useState('');
  const [publicationStatus, setPublicationStatus] = useState<'published' | 'draft'>('published');
  const [featured, setFeatured] = useState(false);

  // File Upload State
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoFileName, setVideoFileName] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [videoUrlManual, setVideoUrlManual] = useState<string>('');
  const [useManualVideoUrl, setUseManualVideoUrl] = useState<boolean>(false);

  // Edit Modal State
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [editPosterFile, setEditPosterFile] = useState<File | null>(null);
  const [editPosterPreview, setEditPosterPreview] = useState<string>('');
  const [editPosterMode, setEditPosterMode] = useState<'url' | 'upload'>('url');
  const [editBackdropUrl, setEditBackdropUrl] = useState<string>('');
  const [editVideoFile, setEditVideoFile] = useState<File | null>(null);
  const [editVideoFileName, setEditVideoFileName] = useState<string>('');
  const [editVideoMode, setEditVideoMode] = useState<'url' | 'upload'>('url');
  const [editVideoUrlManual, setEditVideoUrlManual] = useState<string>('');
  const [editUploadProgress, setEditUploadProgress] = useState<number>(0);
  const [isEditSaving, setIsEditSaving] = useState<boolean>(false);
  const [editGenreInput, setEditGenreInput] = useState<string>('');
  const [editCastInput, setEditCastInput] = useState<string>('');
  const [showTestPlayer, setShowTestPlayer] = useState<boolean>(false);

  const openEditModal = (movie: Movie) => {
    setEditingMovie({ ...movie });
    setEditPosterFile(null);
    setEditPosterPreview(movie.posterUrl || '');
    setEditPosterMode('url');
    setEditBackdropUrl(movie.backdropUrl || movie.posterUrl || '');
    setEditVideoFile(null);
    setEditVideoFileName('');
    setEditVideoMode('url');
    setEditVideoUrlManual(movie.videoUrl || '');
    setEditGenreInput(Array.isArray(movie.genre) ? movie.genre.join(', ') : '');
    setEditCastInput(Array.isArray(movie.cast) ? movie.cast.join(', ') : '');
    setEditUploadProgress(0);
    setIsEditSaving(false);
    setShowTestPlayer(false);
  };

  const handleEditPosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('error', 'Poster image must be smaller than 10MB.');
        e.target.value = '';
        return;
      }
      setEditPosterFile(file);
      const url = URL.createObjectURL(file);
      setEditPosterPreview(url);
    }
  };

  const handleEditVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024 * 1024) {
        showToast('error', 'Video file exceeds the 2GB upload limit. Use a stream URL instead.');
        e.target.value = '';
        return;
      }
      setEditVideoFile(file);
      setEditVideoFileName(file.name);
      if (/\.mkv$/i.test(file.name)) {
        showToast(
          'error',
          'MKV selected: browsers cannot play MKV/x265 (HEVC) files. Please use an MP4 (H.264/AAC) version.'
        );
      }
    }
  };

  // Delete Confirmation Modal State
  const [deletingMovie, setDeletingMovie] = useState<Movie | null>(null);

  // Preview Modal
  const [previewMovie, setPreviewMovie] = useState<Partial<Movie> | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all admin data
  const fetchAdminData = async () => {
    try {
      setDataLoading(true);

      // Stats
      const statsRes = await fetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.success) setStats(statsData.stats);
      }

      // Movies
      const moviesRes = await fetch('/api/admin/movies');
      if (moviesRes.ok) {
        const moviesData = await moviesRes.json();
        if (moviesData.success) setAdminMovies(moviesData.movies);
      }

      // Users
      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData.success) setAdminUsers(usersData.users);
      }
    } catch {
      showToast('error', 'Error fetching administrative data');
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAdminData();
    }
  }, [isAdmin]);

  // Handle Poster selection
  const handlePosterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('error', 'Poster image must be smaller than 10MB.');
        e.target.value = '';
        return;
      }
      setPosterFile(file);
      const url = URL.createObjectURL(file);
      setPosterPreview(url);
    }
  };

  // Handle Video selection
  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024 * 1024) {
        showToast('error', 'Video file exceeds the 2GB upload limit. Use a stream URL instead.');
        e.target.value = '';
        return;
      }
      setVideoFile(file);
      setVideoFileName(file.name);
      if (/\.mkv$/i.test(file.name)) {
        showToast(
          'error',
          'MKV selected: browsers cannot play MKV/x265 (HEVC) files. It will upload, but playback needs an MP4 (H.264/AAC) version.'
        );
      } else if (file.size > 50 * 1024 * 1024) {
        showToast(
          'error',
          `Large file selected (${(file.size / (1024 * 1024)).toFixed(0)}MB). Upload may be rejected by Supabase Storage (50MB limit) — "Enter stream URL directly" is recommended.`
        );
      }
    }
  };

  // Quick preset helper
  const handleSetPresetTrailer = (titleName: string, streamUrl: string, poster: string) => {
    setTitle(titleName);
    setUseManualVideoUrl(true);
    setVideoUrlManual(streamUrl);
    setPosterPreview(poster);
    setDescription(`Official 4K master edition of ${titleName}. High performance cinematic stream with lossless surround sound.`);
  };

  // Stream a file to the upload endpoint with real progress reporting.
  // The raw file is sent as the request body so the server can stream it to
  // storage without buffering (supports very large video files).
  const uploadAsset = (
    file: File,
    folder: 'posters' | 'videos',
    onProgress: (percent: number) => void
  ): Promise<{ publicUrl: string; storageKey: string }> =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/admin/upload?folder=${folder}&filename=${encodeURIComponent(file.name)}`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && event.total > 0) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.success) {
            resolve({ publicUrl: data.publicUrl, storageKey: data.storageKey });
          } else {
            reject(new Error(data.error || `Upload failed (HTTP ${xhr.status})`));
          }
        } catch {
          reject(new Error(`Upload failed (HTTP ${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error during upload. Please check your connection.'));
      xhr.ontimeout = () => reject(new Error('Upload timed out. Try a smaller file or a stream URL.'));
      xhr.send(file);
    });

  // Submit Movie Form
  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      showToast('error', 'Movie title is required');
      return;
    }
    if (!posterFile && !posterPreview) {
      showToast('error', 'Movie poster image is required');
      return;
    }
    if (!videoFile && !videoUrlManual) {
      showToast('error', 'Video asset or stream URL is required');
      return;
    }

    // A manual stream URL must be a browser-playable source (no local paths,
    // no MKV/x265 files that browsers cannot decode)
    if (!videoFile && videoUrlManual) {
      const urlValidation = validateVideoUrl(videoUrlManual);
      if (!urlValidation.isValid) {
        showToast('error', urlValidation.error || 'Invalid video URL');
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      let finalPosterUrl = posterPreview;
      let finalPosterKey = `posters/${Date.now()}.jpg`;

      // 1. Upload Poster if file provided (0% - 40% of total progress)
      if (posterFile) {
        const poster = await uploadAsset(posterFile, 'posters', (p) =>
          setUploadProgress(Math.round(p * 0.4))
        );
        finalPosterUrl = poster.publicUrl;
        finalPosterKey = poster.storageKey;
      }
      setUploadProgress(40);

      // 2. Upload Video if file provided (40% - 80% of total progress)
      let finalVideoUrl = videoUrlManual;
      let finalVideoKey = `videos/${Date.now()}.mp4`;

      if (videoFile) {
        const video = await uploadAsset(videoFile, 'videos', (p) =>
          setUploadProgress(40 + Math.round(p * 0.4))
        );
        finalVideoUrl = video.publicUrl;
        finalVideoKey = video.storageKey;
      }
      setUploadProgress(80);

      // 3. Save Movie Record to PostgreSQL
      const moviePayload = {
        title: title.trim(),
        description: description.trim(),
        posterUrl: finalPosterUrl,
        videoUrl: finalVideoUrl,
        posterStorageKey: finalPosterKey,
        videoStorageKey: finalVideoKey,
        genre: genreInput.split(',').map((g) => g.trim()).filter(Boolean),
        releaseYear: parseInt(releaseYear, 10),
        language,
        duration: parseInt(duration, 10),
        rating,
        cast: cast.split(',').map((c) => c.trim()).filter(Boolean),
        director: director.trim() || 'Unknown',
        publicationStatus,
        featured,
      };

      const createRes = await fetch('/api/admin/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(moviePayload),
      });

      const createData = await createRes.json();
      setUploadProgress(100);

      if (!createRes.ok || !createData.success) {
        showToast('error', createData.error || 'Failed to record movie in database');
        setIsUploading(false);
        return;
      }

      showToast('success', createData.message || 'Movie created successfully!');

      // Reset Form
      setTitle('');
      setDescription('');
      setPosterFile(null);
      setPosterPreview('');
      setVideoFile(null);
      setVideoFileName('');
      setVideoUrlManual('');
      setUseManualVideoUrl(false);
      setCast('');
      setDirector('');

      // Refresh listings
      await fetchAdminData();
      setActiveTab('manage-movies');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'An error occurred during movie creation');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Quick Toggle Publish / Draft
  const handleTogglePublish = async (movie: Movie) => {
    const nextStatus = movie.publicationStatus === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch(`/api/admin/movies/${movie.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publicationStatus: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', `Status updated to ${nextStatus}`);
        fetchAdminData();
      } else {
        showToast('error', data.error || 'Failed to update publication status');
      }
    } catch {
      showToast('error', 'Error updating status');
    }
  };

  // Edit Movie Submit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMovie) return;

    if (!editingMovie.title.trim()) {
      showToast('error', 'Movie title is required');
      return;
    }

    setIsEditSaving(true);
    setEditUploadProgress(0);

    try {
      // 1. Resolve final thumbnail / poster URL
      let finalPosterUrl = editPosterPreview.trim();
      let finalPosterKey = editingMovie.posterStorageKey;

      if (editPosterFile) {
        const posterRes = await uploadAsset(editPosterFile, 'posters', (p) =>
          setEditUploadProgress(Math.round(p * 0.4))
        );
        finalPosterUrl = posterRes.publicUrl;
        finalPosterKey = posterRes.storageKey;
      }
      setEditUploadProgress(40);

      if (!finalPosterUrl) {
        showToast('error', 'Movie thumbnail / poster is required');
        setIsEditSaving(false);
        return;
      }

      // 2. Resolve final video source URL
      let finalVideoUrl = editVideoMode === 'upload' ? '' : editVideoUrlManual.trim();
      let finalVideoKey = editingMovie.videoStorageKey;

      if (editVideoFile) {
        const videoRes = await uploadAsset(editVideoFile, 'videos', (p) =>
          setEditUploadProgress(40 + Math.round(p * 0.5))
        );
        finalVideoUrl = videoRes.publicUrl;
        finalVideoKey = videoRes.storageKey;
      }
      setEditUploadProgress(90);

      if (!finalVideoUrl) {
        showToast('error', 'Movie video source URL or uploaded file is required');
        setIsEditSaving(false);
        return;
      }

      // Validate video stream source
      const urlValidation = validateVideoUrl(finalVideoUrl);
      if (!urlValidation.isValid) {
        showToast('error', urlValidation.error || 'Invalid video source URL');
        setIsEditSaving(false);
        return;
      }

      const payload = {
        title: editingMovie.title.trim(),
        description: (editingMovie.description || '').trim(),
        posterUrl: finalPosterUrl,
        posterStorageKey: finalPosterKey,
        backdropUrl: (editBackdropUrl.trim() || finalPosterUrl),
        videoUrl: finalVideoUrl,
        videoStorageKey: finalVideoKey,
        releaseYear: Number(editingMovie.releaseYear) || 2026,
        duration: Number(editingMovie.duration) || 120,
        language: editingMovie.language || 'English',
        rating: editingMovie.rating || 'PG-13',
        publicationStatus: editingMovie.publicationStatus || 'published',
        featured: Boolean(editingMovie.featured),
        genre: editGenreInput.split(',').map((g) => g.trim()).filter(Boolean),
        cast: editCastInput.split(',').map((c) => c.trim()).filter(Boolean),
        director: (editingMovie.director || 'Unknown').trim(),
      };

      const res = await fetch(`/api/admin/movies/${editingMovie.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setEditUploadProgress(100);

      if (res.ok && data.success) {
        showToast('success', data.message || `Movie "${payload.title}" updated successfully!`);
        setEditingMovie(null);
        await fetchAdminData();
      } else {
        showToast('error', data.error || 'Failed to update movie');
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Error updating movie');
    } finally {
      setIsEditSaving(false);
      setEditUploadProgress(0);
    }
  };

  // Confirm Delete Movie
  const handleConfirmDelete = async () => {
    if (!deletingMovie) return;
    try {
      const res = await fetch(`/api/admin/movies/${deletingMovie.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('success', data.message || 'Movie removed');
        setDeletingMovie(null);
        fetchAdminData();
      } else {
        showToast('error', data.error || 'Failed to delete movie');
      }
    } catch {
      showToast('error', 'Error deleting movie');
    }
  };

  // Authorization Check Guard
  if (authLoading) {
    return (
      <div className="w-full h-screen bg-[#07080b] flex items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 403 Forbidden Screen if not designated administrator
  if (!user || user.role !== 'admin') {
    return (
      <div className="w-full h-screen bg-[#07080b] flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel rounded-2xl p-8 text-center space-y-6 shadow-2xl border border-red-500/30">
          <div className="w-16 h-16 rounded-full bg-red-600/20 text-red-500 border border-red-500/40 flex items-center justify-center mx-auto shadow-lg shadow-red-950">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight mb-2">
              403 Forbidden: Administrator Required
            </h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Access to this control panel is restricted to the designated platform administrator (<span className="text-red-400 font-mono">hostelform31@gmail.com</span>). Your current session does not possess administrative privileges.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-3">
            <Link
              href="/auth/login"
              className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg transition-colors"
            >
              Sign In as Administrator
            </Link>
            <Link
              href="/"
              className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition-colors"
            >
              Return to CinePulse Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Filtered movies in table
  const displayedMovies = adminMovies.filter((m) => {
    if (movieFilter === 'published' && m.publicationStatus !== 'published') return false;
    if (movieFilter === 'draft' && m.publicationStatus !== 'draft') return false;
    if (movieSearch.trim()) {
      const q = movieSearch.trim().toLowerCase();
      return (
        m.title.toLowerCase().includes(q) ||
        m.genre.some((g) => g.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#07080b] text-[#f3f4f6] flex flex-col md:flex-row">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-4 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/20 border-red-500/40 text-red-300'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#0a0d14] border-r border-white/5 p-6 flex flex-col justify-between flex-shrink-0">
        <div className="space-y-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-600 to-amber-600 flex items-center justify-center shadow-lg shadow-red-600/30">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-black tracking-wider text-white">
                CINE<span className="text-red-500">PULSE</span>
              </div>
              <div className="text-[9px] uppercase tracking-widest text-red-400 font-bold -mt-1">
                Admin Console
              </div>
            </div>
          </Link>

          {/* Admin Tag */}
          <div className="p-3 rounded-xl bg-red-600/10 border border-red-500/20 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Admin</span>
            </div>
            <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('upload')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'upload'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Upload Movie</span>
            </button>

            <button
              onClick={() => setActiveTab('manage-movies')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'manage-movies'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Manage Movies</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-white/10">
                {adminMovies.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('manage-users')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'manage-users'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Manage Users</span>
              <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-white/10">
                {adminUsers.length}
              </span>
            </button>
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-white/5 space-y-2">
          <Link
            href="/"
            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span>Live Website</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>

          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Admin Content Canvas */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto max-w-6xl mx-auto w-full">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Protected operations for administrator hostelform31@gmail.com
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchAdminData}
              disabled={dataLoading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-neutral-300 hover:text-white border border-white/5 transition-colors"
              title="Refresh dataset"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${dataLoading ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>

            {activeTab !== 'upload' && (
              <button
                onClick={() => setActiveTab('upload')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>Upload New Movie</span>
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            TAB 1: OVERVIEW & STATISTICS
           ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stat Counters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div className="glass-panel rounded-2xl p-5 border border-white/5">
                <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                  Total Movies
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-white">{stats.totalMovies}</span>
                  <span className="text-xs text-neutral-500">records</span>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 border border-white/5">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                  Published Movies
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-emerald-400">
                    {stats.publishedMovies}
                  </span>
                  <span className="text-xs text-neutral-500">live</span>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 border border-white/5">
                <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider block">
                  Unpublished Drafts
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-amber-400">{stats.draftMovies}</span>
                  <span className="text-xs text-neutral-500">hidden</span>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 border border-white/5">
                <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">
                  Registered Users
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-3xl font-black text-blue-400">
                    {stats.registeredUsers}
                  </span>
                  <span className="text-xs text-neutral-500">profiles</span>
                </div>
              </div>
            </div>

            {/* Quick Actions & Storage Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Storage & Engine Card */}
              <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-red-500" />
                  <span>Streaming Engine Infrastructure</span>
                </h3>
                <div className="space-y-3 text-xs text-neutral-300">
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-neutral-400">Database Engine:</span>
                    <span className="font-semibold text-white">Supabase PostgreSQL / RLS</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-neutral-400">Email Verification:</span>
                    <span className="font-semibold text-white">Nodemailer SMTP (Email OTP)</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-neutral-400">Object Storage Target:</span>
                    <span className="font-semibold text-white">Persistent Cloud Storage / R2</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-neutral-400">Designated Admin:</span>
                    <span className="font-mono text-red-400 font-bold">hostelform31@gmail.com</span>
                  </div>
                </div>
              </div>

              {/* Quick Launch Shortcuts */}
              <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>Quick Actions</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    onClick={() => setActiveTab('upload')}
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left space-y-1 transition-colors border border-white/5"
                  >
                    <Upload className="w-5 h-5 text-red-500" />
                    <span className="text-xs font-bold text-white block">Upload Movie</span>
                    <span className="text-[10px] text-neutral-400 block">Add poster & stream</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('manage-movies')}
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left space-y-1 transition-colors border border-white/5"
                  >
                    <Film className="w-5 h-5 text-amber-500" />
                    <span className="text-xs font-bold text-white block">Manage Movies</span>
                    <span className="text-[10px] text-neutral-400 block">Edit or purge titles</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('manage-users')}
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left space-y-1 transition-colors border border-white/5"
                  >
                    <Users className="w-5 h-5 text-blue-500" />
                    <span className="text-xs font-bold text-white block">Manage Users</span>
                    <span className="text-[10px] text-neutral-400 block">Inspect registered users</span>
                  </button>

                  <Link
                    href="/"
                    className="p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left space-y-1 transition-colors border border-white/5 block"
                  >
                    <Eye className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-bold text-white block">View as Member</span>
                    <span className="text-[10px] text-neutral-400 block">Inspect public feed</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: UPLOAD MOVIE
           ========================================================================= */}
        {activeTab === 'upload' && (
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-white/5 space-y-8">
            {/* Fast Presets Toolbar */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                Fast Demonstration Pre-fill Presets (Test Publishing Instantly)
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSetPresetTrailer(
                      'Cosmic Horizons 4K',
                      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
                      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-medium border border-red-500/30 transition-colors"
                >
                  + Preset: Cosmic Horizons (Sci-Fi)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSetPresetTrailer(
                      'The Last Sentinel',
                      'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
                      'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-300 text-xs font-medium border border-red-500/30 transition-colors"
                >
                  + Preset: The Last Sentinel (Fantasy)
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateMovie} className="space-y-6">
              {/* Row 1: Title and Release Year */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Movie Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Interstellar Odyssey"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Release Year *
                  </label>
                  <input
                    type="number"
                    required
                    min={1900}
                    max={2100}
                    value={releaseYear}
                    onChange={(e) => setReleaseYear(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:outline-none focus:border-red-500 transition-colors"
                  />
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Description / Synopsis *
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive synopsis of the movie storyline..."
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white placeholder-neutral-500 text-sm focus:outline-none focus:border-red-500 transition-colors"
                />
              </div>

              {/* Row 3: Genres, Language, Duration, Rating */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Genres (comma separated)
                  </label>
                  <input
                    type="text"
                    value={genreInput}
                    onChange={(e) => setGenreInput(e.target.value)}
                    placeholder="Action, Sci-Fi"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Language
                  </label>
                  <input
                    type="text"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    placeholder="English"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Maturity Rating
                  </label>
                  <select
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                  >
                    <option value="G">G - General Audiences</option>
                    <option value="PG">PG - Parental Guidance</option>
                    <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                    <option value="R">R - Restricted</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Director and Cast */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Director
                  </label>
                  <input
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    placeholder="Director name"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Cast Members (comma separated)
                  </label>
                  <input
                    type="text"
                    value={cast}
                    onChange={(e) => setCast(e.target.value)}
                    placeholder="Actor 1, Actor 2, Actor 3"
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Row 5: Upload Files (Poster & Video) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {/* Poster Dropzone */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Poster Image (JPEG, PNG, WebP &le; 10MB) *
                  </label>
                  {/* The whole dropzone is a label so clicking anywhere opens the picker */}
                  <label className="block border-2 border-dashed border-white/15 rounded-2xl p-4 text-center hover:border-red-500/50 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[160px]">
                    {posterPreview ? (
                      <div className="relative group/poster">
                        <img
                          src={posterPreview}
                          alt="Preview"
                          className="h-32 aspect-[2/3] object-cover rounded-xl shadow-md"
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            // prevent the surrounding label from re-opening the picker
                            e.preventDefault();
                            setPosterFile(null);
                            setPosterPreview('');
                          }}
                          className="absolute -top-2 -right-2 p-1 rounded-full bg-red-600 text-white shadow"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                        {posterFile?.name && (
                          <span className="mt-2 block text-[10px] text-neutral-400 truncate max-w-[180px]">
                            {posterFile.name}
                          </span>
                        )}
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-neutral-500 mb-2" />
                        <span className="text-xs text-neutral-300 font-medium">
                          Choose or drop poster image
                        </span>
                      </>
                    )}
                    {/* Kept mounted (hidden once a file is chosen) so clicking the
                        dropzone replaces the selection */}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.avif,image/*"
                      onChange={handlePosterChange}
                      className={
                        posterPreview
                          ? 'hidden'
                          : 'mt-2 text-xs text-neutral-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-red-600 file:text-white cursor-pointer'
                      }
                    />
                  </label>
                </div>

                {/* Video Dropzone */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-neutral-300">
                      Video Asset (MP4, WebM, MKV) *
                    </label>
                    <button
                      type="button"
                      onClick={() => setUseManualVideoUrl(!useManualVideoUrl)}
                      className="text-[11px] text-red-400 hover:text-red-300 underline"
                    >
                      {useManualVideoUrl ? 'Switch to file upload' : 'Enter stream URL directly'}
                    </button>
                  </div>

                  {useManualVideoUrl ? (
                    <div className="border border-white/10 rounded-2xl p-4 space-y-2 bg-black/40 min-h-[160px] flex flex-col justify-center">
                      <span className="text-xs text-neutral-400">Stream or Direct CDN Video URL:</span>
                      <input
                        type="url"
                        value={videoUrlManual}
                        onChange={(e) => setVideoUrlManual(e.target.value)}
                        placeholder="https://.../movie.mp4  or a YouTube/Vimeo link"
                        className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                      />
                      <p className="text-[10px] text-neutral-500 leading-relaxed">
                        Direct .mp4/.webm URLs stream natively; YouTube and Vimeo links are embedded in the player.
                        Local file paths and .mkv/x265 files cannot play in browsers.
                      </p>
                    </div>
                  ) : (
                    <>
                      <label className="block border-2 border-dashed border-white/15 rounded-2xl p-4 text-center hover:border-red-500/50 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[160px]">
                        {videoFileName ? (
                          <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10">
                            <Film className="w-4 h-4 text-red-500 shrink-0" />
                            <span className="text-xs font-medium text-white truncate max-w-[200px]">
                              {videoFileName}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                // prevent the surrounding label from re-opening the picker
                                e.preventDefault();
                                setVideoFile(null);
                                setVideoFileName('');
                              }}
                              className="p-1 rounded-full text-neutral-400 hover:text-white"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Film className="w-8 h-8 text-neutral-500 mb-2" />
                            <span className="text-xs text-neutral-300 font-medium">
                              Select video file (.mp4, .webm, .mov, .mkv)
                            </span>
                          </>
                        )}
                        {/* Kept mounted (hidden once a file is chosen) so clicking the
                            dropzone replaces the selection */}
                        <input
                          type="file"
                          accept=".mp4,.webm,.mov,.mkv,video/*"
                          onChange={handleVideoChange}
                          className={
                            videoFileName
                              ? 'hidden'
                              : 'mt-2 text-xs text-neutral-400 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-red-600 file:text-white cursor-pointer'
                          }
                        />
                      </label>
                      <p className="text-[10px] text-neutral-500 leading-relaxed">
                        Direct upload streams the file to storage (posters up to 10MB, videos up to 2GB).
                        MP4/WebM uploads play automatically; for larger files use{' '}
                        <span className="text-neutral-400">Enter stream URL directly</span> (a .mp4/.webm
                        URL or a YouTube/Vimeo link).
                      </p>
                    </>
                  )}
                 </div>
               </div>

              {/* Row 6: Publication Status & Featured Checkbox */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-6">
                  <div>
                    <label className="text-xs font-semibold text-neutral-300 block mb-1">
                      Publication Mode
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-white cursor-pointer">
                        <input
                          type="radio"
                          name="pubStatus"
                          value="published"
                          checked={publicationStatus === 'published'}
                          onChange={() => setPublicationStatus('published')}
                          className="accent-red-600"
                        />
                        <span>Publish Live Now</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                        <input
                          type="radio"
                          name="pubStatus"
                          value="draft"
                          checked={publicationStatus === 'draft'}
                          onChange={() => setPublicationStatus('draft')}
                          className="accent-red-600"
                        />
                        <span>Save as Draft</span>
                      </label>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs text-white cursor-pointer pt-4">
                    <input
                      type="checkbox"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="accent-red-600 w-4 h-4 rounded"
                    />
                    <span>Highlight as Featured Premiere on Homepage Banner</span>
                  </label>
                </div>
              </div>

              {/* Progress Bar during upload */}
              {isUploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-neutral-300 font-medium">
                    <span>Uploading assets and registering in PostgreSQL...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-red-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewMovie({
                      title,
                      description,
                      posterUrl: posterPreview,
                      releaseYear: parseInt(releaseYear, 10),
                      genre: genreInput.split(',').map((g) => g.trim()),
                      duration: parseInt(duration, 10),
                      language,
                      rating,
                      director,
                    })
                  }
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white font-semibold text-xs border border-white/10 transition-colors"
                >
                  Preview Before Saving
                </button>

                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold text-xs tracking-wide shadow-xl shadow-red-600/30 transition-all flex items-center gap-2"
                >
                  {isUploading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>{publicationStatus === 'published' ? 'Publish Movie' : 'Save Draft'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =========================================================================
            TAB 3: MANAGE MOVIES
           ========================================================================= */}
        {activeTab === 'manage-movies' && (
          <div className="space-y-6">
            {/* Filter and Search controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel rounded-2xl p-4 border border-white/5">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={movieSearch}
                  onChange={(e) => setMovieSearch(e.target.value)}
                  placeholder="Filter by title..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Status Pills */}
              <div className="flex items-center gap-1.5 w-full sm:w-auto">
                <button
                  onClick={() => setMovieFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    movieFilter === 'all'
                      ? 'bg-red-600 text-white'
                      : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  All ({adminMovies.length})
                </button>
                <button
                  onClick={() => setMovieFilter('published')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    movieFilter === 'published'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  Published ({adminMovies.filter((m) => m.publicationStatus === 'published').length})
                </button>
                <button
                  onClick={() => setMovieFilter('draft')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    movieFilter === 'draft'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  Drafts ({adminMovies.filter((m) => m.publicationStatus === 'draft').length})
                </button>
              </div>
            </div>

            {/* Movies Table */}
            <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-black/60 text-neutral-400 border-b border-white/5 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="p-4">Poster & Title</th>
                      <th className="p-4">Genre</th>
                      <th className="p-4">Year & Lang</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Upload Date</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-neutral-300">
                    {displayedMovies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-neutral-500">
                          No movies found matching current filter.
                        </td>
                      </tr>
                    ) : (
                      displayedMovies.map((movie) => (
                        <tr key={movie.id} className="hover:bg-white/5 transition-colors">
                          {/* Poster and Title */}
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={movie.posterUrl}
                                alt={movie.title}
                                className="w-10 h-14 object-cover rounded-lg bg-neutral-900 border border-white/10"
                              />
                              <div>
                                <h4 className="font-bold text-white text-sm hover:text-red-400 transition-colors">
                                  {movie.title}
                                </h4>
                                <span className="text-[11px] text-neutral-500">
                                  {movie.duration}m &bull; {movie.rating || 'PG-13'}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Genre */}
                          <td className="p-4">
                            <span className="font-medium text-neutral-300">
                              {movie.genre.slice(0, 2).join(', ')}
                            </span>
                          </td>

                          {/* Year and Language */}
                          <td className="p-4">
                            <div>{movie.releaseYear}</div>
                            <div className="text-[10px] text-neutral-500">{movie.language}</div>
                          </td>

                          {/* Publication Status & Quick Toggle */}
                          <td className="p-4">
                            <button
                              onClick={() => handleTogglePublish(movie)}
                              title="Click to toggle status"
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                                movie.publicationStatus === 'published'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  movie.publicationStatus === 'published'
                                    ? 'bg-emerald-400'
                                    : 'bg-amber-400'
                                }`}
                              />
                              <span>{movie.publicationStatus}</span>
                            </button>
                          </td>

                          {/* Upload Date */}
                          <td className="p-4 text-neutral-500 font-mono text-[11px]">
                            {new Date(movie.createdAt).toLocaleDateString()}
                          </td>

                          {/* Actions */}
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Preview / Play */}
                              <Link
                                href={`/watch/${movie.id}`}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white"
                                title="Stream preview"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </Link>

                              {/* Edit */}
                              <button
                                onClick={() => openEditModal(movie)}
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white"
                                title="Edit movie"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => setDeletingMovie(movie)}
                                className="p-1.5 rounded-lg bg-red-600/10 hover:bg-red-600/25 text-red-400"
                                title="Delete movie"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: MANAGE USERS
           ========================================================================= */}
        {activeTab === 'manage-users' && (
          <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Registered Users Profile Directory</h3>
              <span className="text-xs text-neutral-400">{adminUsers.length} total user(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/60 text-neutral-400 border-b border-white/5 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="p-4">User</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Role</th>
                    <th className="p-4">Registered Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-neutral-300">
                  {adminUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center font-bold text-[11px] text-white">
                            {u.fullName ? u.fullName[0].toUpperCase() : 'U'}
                          </div>
                          <span className="font-semibold text-white">{u.fullName}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-neutral-300">{u.email}</td>
                      <td className="p-4 font-mono text-neutral-300">
                        <div className="flex items-center gap-1.5">
                          <span>{u.phoneNumber || 'N/A'}</span>
                          {(u.phoneVerified || u.emailVerified) && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-semibold">
                              Verified OTP
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            u.role === 'admin'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-neutral-500 font-mono text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL: EDIT MOVIE WITH THUMBNAIL & VIDEO SOURCE CONTROLS
         ========================================================================= */}
      {editingMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-3xl w-full glass-panel rounded-2xl p-6 sm:p-8 space-y-5 shadow-2xl border border-white/10 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit className="w-5 h-5 text-red-500" />
                  Edit Movie & Media Assets
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Update movie thumbnail, video source URL, and details for &quot;{editingMovie.title}&quot;
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMovie(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              {/* SECTION 1: MEDIA ASSETS (Thumbnail & Video Source) */}
              <div className="space-y-5 p-4 rounded-xl bg-black/40 border border-white/10">
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  Media Assets (Thumbnail & Video Stream Source)
                </h4>

                {/* THUMBNAIL / POSTER SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                  {/* Thumbnail Live Preview */}
                  <div className="flex flex-col items-center">
                    <label className="block text-xs font-semibold text-neutral-300 mb-2 w-full text-center sm:text-left">
                      Thumbnail Preview
                    </label>
                    <div className="w-32 aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900 border border-white/15 shadow-xl relative group">
                      {editPosterPreview ? (
                        <img
                          src={editPosterPreview}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600 p-2 text-center text-[10px]">
                          <ImageIcon className="w-8 h-8 mb-1" />
                          No thumbnail
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail Edit Controls */}
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-neutral-300">
                        Movie Thumbnail / Poster Image
                      </label>
                      <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/10 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setEditPosterMode('url')}
                          className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                            editPosterMode === 'url'
                              ? 'bg-red-600 text-white'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          Image URL
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditPosterMode('upload')}
                          className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                            editPosterMode === 'upload'
                              ? 'bg-red-600 text-white'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          Upload File
                        </button>
                      </div>
                    </div>

                    {editPosterMode === 'url' ? (
                      <div>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            placeholder="https://example.com/poster.jpg or /uploads/..."
                            value={editPosterPreview}
                            onChange={(e) => setEditPosterPreview(e.target.value)}
                            className="w-full px-3 py-2 pl-9 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-red-500"
                          />
                          <Link2 className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                        </div>
                        <p className="text-[10px] text-neutral-400 mt-1">
                          Paste a direct web link or uploaded image path to update the movie thumbnail.
                        </p>
                      </div>
                    ) : (
                      <div className="border border-dashed border-white/20 rounded-xl p-3 bg-black/30 hover:bg-black/50 transition-colors text-center">
                        <input
                          type="file"
                          id="edit-poster-file"
                          accept="image/*"
                          onChange={handleEditPosterChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="edit-poster-file"
                          className="cursor-pointer flex flex-col items-center justify-center gap-1"
                        >
                          <Upload className="w-5 h-5 text-red-500" />
                          <span className="text-xs font-semibold text-white">
                            {editPosterFile ? editPosterFile.name : 'Choose New Thumbnail Image'}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            PNG, JPG, or WebP up to 10MB
                          </span>
                        </label>
                      </div>
                    )}

                    {/* Widescreen Backdrop Banner URL */}
                    <div className="pt-2">
                      <label className="block text-[11px] font-semibold text-neutral-400 mb-1">
                        Widescreen Hero Backdrop Banner URL (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Leave blank to use thumbnail as backdrop"
                        value={editBackdropUrl}
                        onChange={(e) => setEditBackdropUrl(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4" />

                {/* VIDEO SOURCE SECTION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300">
                        Movie Video Source URL (Stream Source)
                      </label>
                      <p className="text-[10px] text-neutral-400">
                        Enter any playable stream URL (Direct MP4, YouTube, Vimeo, m3u8) or upload a new video file.
                      </p>
                    </div>

                    <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/10 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setEditVideoMode('url')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                          editVideoMode === 'url'
                            ? 'bg-red-600 text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Source URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditVideoMode('upload')}
                        className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                          editVideoMode === 'upload'
                            ? 'bg-red-600 text-white'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Upload Video
                      </button>
                    </div>
                  </div>

                  {editVideoMode === 'url' ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="https://example.com/movie.mp4, YouTube link, or /uploads/..."
                          value={editVideoUrlManual}
                          onChange={(e) => {
                            setEditVideoUrlManual(e.target.value);
                            setShowTestPlayer(false);
                          }}
                          className="w-full px-3 py-2 pl-9 pr-24 rounded-xl bg-black/60 border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-red-500"
                        />
                        <Video className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
                        <button
                          type="button"
                          onClick={() => setShowTestPlayer(!showTestPlayer)}
                          disabled={!editVideoUrlManual.trim()}
                          className="absolute right-2 top-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-200 text-[10px] font-semibold transition-colors disabled:opacity-40"
                        >
                          {showTestPlayer ? 'Hide Test' : 'Test Playback'}
                        </button>
                      </div>

                      {/* Source Format Indicator */}
                      {editVideoUrlManual.trim() && (
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-neutral-400">Detected format:</span>
                          {editVideoUrlManual.includes('youtube.com') || editVideoUrlManual.includes('youtu.be') ? (
                            <span className="px-2 py-0.5 rounded bg-red-600/20 text-red-400 border border-red-600/30 font-semibold">
                              YouTube Video Player
                            </span>
                          ) : editVideoUrlManual.includes('vimeo.com') ? (
                            <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-600/30 font-semibold">
                              Vimeo Embed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-emerald-600/20 text-emerald-400 border border-emerald-600/30 font-semibold">
                              Direct Stream / Video File
                            </span>
                          )}
                        </div>
                      )}

                      {/* Inline Video Test Player */}
                      {showTestPlayer && editVideoUrlManual.trim() && (
                        <div className="p-3 rounded-xl bg-black border border-white/15 space-y-2 mt-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-neutral-300">Live Video Test Preview:</span>
                            <button
                              type="button"
                              onClick={() => setShowTestPlayer(false)}
                              className="text-[10px] text-neutral-400 hover:text-white"
                            >
                              Close Preview
                            </button>
                          </div>
                          <div className="aspect-video w-full rounded-lg overflow-hidden bg-neutral-950">
                            {(() => {
                              const resolved = parseVideoSource(editVideoUrlManual);
                              if (resolved.kind === 'youtube' || resolved.kind === 'vimeo') {
                                return (
                                  <iframe
                                    src={resolved.src}
                                    title="Video test preview"
                                    className="w-full h-full border-0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                );
                              }
                              return (
                                <video
                                  src={resolved.src}
                                  controls
                                  className="w-full h-full object-contain"
                                />
                              );
                            })()}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="border border-dashed border-white/20 rounded-xl p-4 bg-black/30 hover:bg-black/50 transition-colors text-center">
                      <input
                        type="file"
                        id="edit-video-file"
                        accept="video/mp4,video/webm"
                        onChange={handleEditVideoChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="edit-video-file"
                        className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                      >
                        <Upload className="w-6 h-6 text-red-500" />
                        <span className="text-xs font-semibold text-white">
                          {editVideoFileName ? editVideoFileName : 'Choose New Video File (MP4 / WebM)'}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          Supports MP4 (H.264 + AAC) or WebM. Files will stream directly to storage.
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 2: MOVIE METADATA */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Movie Title</label>
                  <input
                    type="text"
                    required
                    value={editingMovie.title}
                    onChange={(e) =>
                      setEditingMovie({ ...editingMovie, title: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Synopsis</label>
                  <textarea
                    rows={3}
                    value={editingMovie.description || ''}
                    onChange={(e) =>
                      setEditingMovie({ ...editingMovie, description: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Release Year
                    </label>
                    <input
                      type="number"
                      value={editingMovie.releaseYear}
                      onChange={(e) =>
                        setEditingMovie({
                          ...editingMovie,
                          releaseYear: parseInt(e.target.value, 10) || 2026,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Duration (Mins)
                    </label>
                    <input
                      type="number"
                      value={editingMovie.duration}
                      onChange={(e) =>
                        setEditingMovie({
                          ...editingMovie,
                          duration: parseInt(e.target.value, 10) || 120,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Language
                    </label>
                    <input
                      type="text"
                      value={editingMovie.language || 'English'}
                      onChange={(e) =>
                        setEditingMovie({ ...editingMovie, language: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Rating
                    </label>
                    <input
                      type="text"
                      value={editingMovie.rating || 'PG-13'}
                      onChange={(e) =>
                        setEditingMovie({ ...editingMovie, rating: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Genres (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={editGenreInput}
                      onChange={(e) => setEditGenreInput(e.target.value)}
                      placeholder="e.g. Action, Sci-Fi, Thriller"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Cast Members (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={editCastInput}
                      onChange={(e) => setEditCastInput(e.target.value)}
                      placeholder="e.g. Actor One, Actor Two"
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Director
                    </label>
                    <input
                      type="text"
                      value={editingMovie.director || ''}
                      onChange={(e) =>
                        setEditingMovie({ ...editingMovie, director: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Publication Status
                    </label>
                    <select
                      value={editingMovie.publicationStatus}
                      onChange={(e) =>
                        setEditingMovie({
                          ...editingMovie,
                          publicationStatus: e.target.value as 'published' | 'draft',
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white text-xs"
                    >
                      <option value="published">Published (Visible to all users)</option>
                      <option value="draft">Draft (Admin preview only)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-5">
                    <input
                      type="checkbox"
                      id="edit-featured"
                      checked={Boolean(editingMovie.featured)}
                      onChange={(e) =>
                        setEditingMovie({ ...editingMovie, featured: e.target.checked })
                      }
                      className="rounded accent-red-600 w-4 h-4 cursor-pointer"
                    />
                    <label
                      htmlFor="edit-featured"
                      className="text-xs font-semibold text-neutral-200 cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Featured in Hero Banner
                    </label>
                  </div>
                </div>
              </div>

              {/* Upload Progress Bar if uploading files */}
              {isEditSaving && editUploadProgress > 0 && (
                <div className="space-y-1.5 p-3 rounded-xl bg-black/50 border border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-300 font-medium flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                      Uploading media assets & updating database...
                    </span>
                    <span className="font-mono text-red-400 font-bold">{editUploadProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300"
                      style={{ width: `${editUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  disabled={isEditSaving}
                  onClick={() => setEditingMovie(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSaving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isEditSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Save Movie Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CONFIRM DELETE
         ========================================================================= */}
      {deletingMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full glass-panel rounded-2xl p-6 text-center space-y-4 shadow-2xl border border-red-500/30">
            <div className="w-12 h-12 rounded-full bg-red-600/20 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-white">Permanently Delete Movie?</h3>
            <p className="text-xs text-neutral-400">
              Are you sure you want to delete <strong className="text-white">&ldquo;{deletingMovie.title}&rdquo;</strong>? This will remove the database record and clean up associated storage assets. Regular users will immediately lose access.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeletingMovie(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-950"
              >
                Delete Movie
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: LIVE PREVIEW BEFORE SAVING
         ========================================================================= */}
      {previewMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="max-w-lg w-full glass-panel rounded-2xl p-6 space-y-4 shadow-2xl border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-red-500" />
                <span>Live Card Preview</span>
              </h3>
              <button
                onClick={() => setPreviewMovie(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-4">
              <div className="w-32 aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex-shrink-0">
                {previewMovie.posterUrl ? (
                  <img
                    src={previewMovie.posterUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-600">
                    No Poster
                  </div>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <h4 className="text-base font-bold text-white">{previewMovie.title || 'Movie Title'}</h4>
                <div className="text-neutral-400">
                  {previewMovie.releaseYear} &bull; {previewMovie.duration}m &bull; {previewMovie.language}
                </div>
                <p className="text-neutral-300 line-clamp-3">{previewMovie.description || 'Description...'}</p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {previewMovie.genre?.map((g) => (
                    <span
                      key={g}
                      className="px-1.5 py-0.5 rounded bg-red-600/20 text-red-300 text-[10px]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setPreviewMovie(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
