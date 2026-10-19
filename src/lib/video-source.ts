/**
 * Resolves a video source URL into something a browser can actually play.
 *
 * - Direct file URLs (mp4/webm/mov hosted anywhere) play in a <video> element.
 * - Platform links (YouTube/Vimeo) are watch-page URLs that cannot be loaded by
 *   <video>; they must be embedded in an <iframe> instead.
 */

export type VideoSourceKind = 'file' | 'youtube' | 'vimeo';

export interface ResolvedVideoSource {
  kind: VideoSourceKind;
  /** Embeddable player URL (youtube/vimeo) or the direct file URL (file) */
  src: string;
  /** The URL exactly as it was stored/entered */
  originalUrl: string;
}

const YOUTUBE_PATTERNS: RegExp[] = [
  /youtube\.com\/watch\?(?:[^"'\s]*&)?v=([\w-]{11})/i,
  /youtu\.be\/([\w-]{11})/i,
  /youtube\.com\/embed\/([\w-]{11})/i,
  /youtube\.com\/shorts\/([\w-]{11})/i,
  /youtube\.com\/live\/([\w-]{11})/i,
  /youtube-nocookie\.com\/embed\/([\w-]{11})/i,
];

const VIMEO_PATTERNS: RegExp[] = [
  /vimeo\.com\/(\d+)/i,
  /player\.vimeo\.com\/video\/(\d+)/i,
];

/**
 * Detects the platform kind and returns the URL the browser should load.
 */
export function parseVideoSource(url: string): ResolvedVideoSource {
  const trimmed = (url || '').trim();

  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        kind: 'youtube',
        src: `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0&modestbranding=1&playsinline=1`,
        originalUrl: trimmed,
      };
    }
  }

  for (const pattern of VIMEO_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      return {
        kind: 'vimeo',
        src: `https://player.vimeo.com/video/${match[1]}?autoplay=1&playsinline=1`,
        originalUrl: trimmed,
      };
    }
  }

  return { kind: 'file', src: trimmed, originalUrl: trimmed };
}

/**
 * True when the URL must be embedded in an iframe instead of a <video> element.
 */
export function isEmbeddableVideoSource(url: string): boolean {
  return parseVideoSource(url).kind !== 'file';
}
