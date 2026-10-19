/**
 * Shared input validation helpers.
 */
import { isEmbeddableVideoSource } from '../video-source';

/**
 * Validates a browser-playable video source.
 * Accepts absolute http(s) file URLs, root-relative paths served by the app
 * (e.g. "/uploads/videos/movie.mp4") and embeddable platform links (YouTube,
 * Vimeo). Rejects local file paths, file:// URLs and formats browsers cannot
 * decode (MKV / x265-HEVC).
 */
export function validateVideoUrl(url: string): { isValid: boolean; error?: string } {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Video URL is required' };
  }

  // Platform links (YouTube/Vimeo) are playable through an embedded player
  if (isEmbeddableVideoSource(trimmed)) {
    return { isValid: true };
  }

  // Root-relative path served by this app (uploaded asset)
  if (trimmed.startsWith('/uploads/')) {
    return { isValid: true };
  }

  // Local file paths can never be streamed to a browser
  if (/^[a-zA-Z]:[\\/]/.test(trimmed) || trimmed.startsWith('file://')) {
    return {
      isValid: false,
      error:
        'Local file paths cannot be streamed. Enter an http(s) video URL, upload the file through the dashboard, or use a YouTube/Vimeo link.',
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      error:
        'Enter a valid video URL (http:// or https://), an uploaded file, or a YouTube/Vimeo link',
    };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, error: 'Only http:// and https:// video URLs are supported' };
  }

  // Browsers cannot decode MKV / x265 (HEVC) sources
  if (/\.mkv$/i.test(parsed.pathname)) {
    return {
      isValid: false,
      error:
        'MKV files cannot play in browsers. Convert the video to MP4 (H.264 + AAC) or WebM first, then use that URL.',
    };
  }

  return { isValid: true };
}

/**
 * Validates E.164 international phone number format
 * e.g., +14155552671 or +919876543210
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; normalized?: string; error?: string } {
  if (!phone) {
    return { isValid: false, error: 'Phone number is required' };
  }

  // Remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // E.164 pattern: starts with + followed by 10 to 15 digits
  const e164Regex = /^\+[1-9]\d{9,14}$/;
  if (!e164Regex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Phone number must be in valid international E.164 format (e.g. +1234567890 or +919876543210)',
    };
  }

  return { isValid: true, normalized: cleaned };
}
