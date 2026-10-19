'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { parseVideoSource } from '@/lib/video-source';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  ArrowLeft,
  Settings,
  Tv,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface MoviePlayerProps {
  movieTitle: string;
  videoSrc: string;
  posterSrc?: string;
  onBack?: () => void;
}

export default function MoviePlayer({
  movieTitle,
  videoSrc,
  posterSrc,
  onBack,
}: MoviePlayerProps) {
  const router = useRouter();
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorDetail, setErrorDetail] = useState<string>('');
  const [showControls, setShowControls] = useState<boolean>(true);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState<boolean>(false);
  const [bufferedPercent, setBufferedPercent] = useState<number>(0);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Platform links (YouTube/Vimeo) are embedded in an iframe; everything else
  // plays through the native <video> element below.
  const videoSource = parseVideoSource(videoSrc);
  const isEmbedded = videoSource.kind !== 'file';

  // Auto-hide controls after inactivity
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSpeedMenu(false);
      }, 3000);
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  // Skip time (+/- seconds)
  const skipTime = (delta: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(videoRef.current.currentTime + delta, duration)
    );
  };

  // Handle Seek Bar
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const nextTime = parseFloat(e.target.value);
    videoRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  // Volume
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
    if (!nextMuted && volume === 0) {
      setVolume(0.5);
      videoRef.current.volume = 0.5;
    }
  };

  // Speed
  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
      setShowSpeedMenu(false);
    }
  };

  // Fullscreen
  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;

    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // PiP
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      // not supported
    }
  };

  // Video event handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);

    // Buffer percentage
    if (videoRef.current.buffered.length > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      const pct = (bufferedEnd / (videoRef.current.duration || 1)) * 100;
      setBufferedPercent(Math.min(100, pct));
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    setIsLoading(false);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If typing in an input, ignore
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      switch (e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'arrowleft':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'arrowright':
          e.preventDefault();
          skipTime(10);
          break;
        case 'arrowup':
          e.preventDefault();
          setVolume((prev) => {
            const next = Math.min(1, prev + 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
        case 'arrowdown':
          e.preventDefault();
          setVolume((prev) => {
            const next = Math.max(0, prev - 0.1);
            if (videoRef.current) videoRef.current.volume = next;
            return next;
          });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, isMuted, volume, duration]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={playerContainerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen bg-black overflow-hidden flex items-center justify-center select-none"
    >
      {/* Video Element (direct file) or embedded platform player */}
      {isEmbedded ? (
        <iframe
          src={videoSource.src}
          title={movieTitle}
          className="w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => {
            setIsLoading(false);
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onError={() => {
            // Translate the MediaError code into something actionable
            const code = videoRef.current?.error?.code;
            const messages: Record<number, string> = {
              1: 'Playback was aborted before the video could load. Please retry.',
              2: 'The video could not be downloaded. Check that the URL is correct and publicly reachable.',
              3: 'The video data could not be decoded. Browsers need MP4 (H.264/AAC) or WebM — MKV and x265/HEVC files are not supported.',
              4: 'This video source is not supported by browsers. Use MP4 (H.264/AAC) or WebM; MKV, x265/HEVC and local file paths cannot play in a browser.',
            };
            setErrorDetail(
              messages[code ?? 4] ||
                'Unable to load the video stream. Please ensure the source is a valid, browser-playable video URL.'
            );
            setHasError(true);
            setIsLoading(false);
          }}
          playsInline
        />
      )}

      {/* Loading Spinner */}
      {isLoading && !hasError && !isEmbedded && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
            <span className="text-xs text-neutral-300 font-semibold tracking-wider uppercase">
              Loading 4K Stream...
            </span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md z-30 p-6 text-center">
          <div className="max-w-md space-y-4">
            <AlertCircle className="w-14 h-14 text-red-500 mx-auto" />
            <h3 className="text-xl font-bold text-white">Streaming Playback Error</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {errorDetail ||
                'Unable to load the video stream. Please ensure the movie video file is valid and your network connection is active.'}
            </p>
            <button
              onClick={() => {
                setHasError(false);
                setErrorDetail('');
                setIsLoading(true);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition-colors"
            >
              Retry Playback
            </button>
          </div>
        </div>
      )}

      {/* Center Animated Indicator on Click (file sources only) */}
      {!isEmbedded && !isPlaying && !isLoading && !hasError && (
        <button
          onClick={togglePlay}
          className="absolute z-20 w-20 h-20 rounded-full bg-red-600/90 hover:bg-red-600 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 hover:scale-110 active:scale-95 transition-all"
        >
          <Play className="w-9 h-9 fill-current ml-1" />
        </button>
      )}

      {/* Top Bar with Title and Back Button */}
      <div
        className={`absolute top-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent z-20 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => (onBack ? onBack() : router.back())}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Go Back"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white drop-shadow truncate">
              {movieTitle}
            </h2>
            <p className="text-[11px] text-neutral-400 font-medium">CinePulse Theatre Mode</p>
          </div>
        </div>
      </div>

      {/* Bottom Controls Overlay (file sources only - embedded players have their own controls) */}
      {!isEmbedded && (
        <div
          className={`absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent z-20 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
        {/* Custom Progress Bar / Seek Slider */}
        <div className="relative mb-3 group/seek cursor-pointer">
          {/* Buffer Bar */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 rounded-full bg-white/20 pointer-events-none"
            style={{ width: `${bufferedPercent}%` }}
          />

          {/* Active Progress */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 rounded-full bg-red-600 pointer-events-none shadow-md shadow-red-600/60"
            style={{ width: `${progressPercent}%` }}
          />

          {/* Native range input overlay for scrubbing */}
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2.5 opacity-0 cursor-pointer block relative z-10"
            aria-label="Seek Video"
          />
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between text-neutral-200">
          {/* Left: Play, Skip, Time, Volume */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="p-2 text-white hover:text-red-500 transition-colors"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current" />}
            </button>

            {/* Skip Back 10s */}
            <button
              onClick={() => skipTime(-10)}
              className="p-2 text-neutral-300 hover:text-white transition-colors"
              title="Rewind 10s"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            {/* Skip Forward 10s */}
            <button
              onClick={() => skipTime(10)}
              className="p-2 text-neutral-300 hover:text-white transition-colors"
              title="Forward 10s"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={toggleMute}
                className="p-2 text-neutral-300 hover:text-white transition-colors"
                title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-red-500" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 sm:w-24 h-1.5 accent-red-600 bg-white/20 rounded-lg cursor-pointer"
                aria-label="Volume Slider"
              />
            </div>

            {/* Time Stamp */}
            <div className="text-xs font-mono text-neutral-300 pl-2">
              <span>{formatTime(currentTime)}</span>
              <span className="text-neutral-500 mx-1.5">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right: Speed, PiP, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-4 relative">
            {/* Speed Selector */}
            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-semibold text-neutral-200 transition-colors"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>

              {showSpeedMenu && (
                <div className="absolute bottom-9 right-0 glass-panel rounded-xl py-1.5 w-24 shadow-2xl z-40 text-xs">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleSpeedChange(rate)}
                      className={`w-full text-left px-3 py-1.5 hover:bg-white/10 transition-colors ${
                        playbackRate === rate ? 'text-red-500 font-bold' : 'text-neutral-300'
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Picture-in-Picture */}
            <button
              onClick={togglePiP}
              className="p-2 text-neutral-300 hover:text-white transition-colors hidden sm:block"
              title="Picture in Picture"
            >
              <Tv className="w-5 h-5" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 text-white hover:text-red-500 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
            >
              {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
