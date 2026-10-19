import path from 'path';
import fs from 'fs';
import os from 'os';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { supabaseAdmin, isSupabaseAdminConfigured } from '../db/supabase';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const STORAGE_BUCKET_MOVIES = 'movies-media';

/**
 * Maximum object size accepted by the Supabase Storage upload endpoint.
 * Configurable so it can be raised together with the project's global
 * storage limit (Supabase Dashboard -> Storage -> Settings).
 */
const SUPABASE_STORAGE_MAX_BYTES = (() => {
  const configuredMb = Number(process.env.STORAGE_MAX_UPLOAD_MB || 0);
  const megabyte = 1024 * 1024;
  return (configuredMb > 0 ? configuredMb : 50) * megabyte;
})();

function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Error thrown when an upload fails client-side validation (mapped to HTTP 400).
 */
export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UploadValidationError';
  }
}

/**
 * Validates poster file type and size (max 10MB)
 */
export function validatePosterFile(file: { name: string; size: number; type: string }): {
  valid: boolean;
  error?: string;
} {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
  // Extension fallback for browsers that report a generic mime type
  const ext = path.extname(file.name).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];

  if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
    return { valid: false, error: 'Poster must be a valid image (JPEG, PNG, WebP, or AVIF).' };
  }

  const maxBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxBytes) {
    return { valid: false, error: 'Poster image must be smaller than 10MB.' };
  }

  return { valid: true };
}

/**
 * Validates video file type and size (max 2GB)
 */
export function validateVideoFile(file: { name: string; size: number; type: string }): {
  valid: boolean;
  error?: string;
} {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska'];
  // Also check extension as fallback for browser mime mismatch
  const ext = path.extname(file.name).toLowerCase();
  const allowedExts = ['.mp4', '.webm', '.mov', '.mkv'];

  if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
    return { valid: false, error: 'Video must be in MP4, WebM, or MKV format.' };
  }

  const maxBytes = 2 * 1024 * 1024 * 1024; // 2GB
  if (file.size > maxBytes) {
    return { valid: false, error: 'Video file size exceeds the 2GB limit.' };
  }

  return { valid: true };
}

/**
 * Stream an uploaded request body to persistent storage.
 * The body is streamed to a temp file first (constant memory), then either
 * streamed to Supabase Storage or moved into public/uploads.
 */
export async function uploadStreamToStorage(
  body: ReadableStream<Uint8Array>,
  filename: string,
  contentType: string,
  folder: 'posters' | 'videos'
): Promise<{ storageKey: string; publicUrl: string; size: number }> {
  const ext = path.extname(filename) || (folder === 'videos' ? '.mp4' : '.jpg');
  const safeBase = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || 'asset';
  const storageKey = `${folder}/${Date.now()}_${safeBase}${ext}`;

  // 1. Stream the request body to a temp file (bounded memory, no size cap)
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cinepulse-upload-'));
  const tmpFile = path.join(tmpDir, 'upload.bin');
  let size = 0;

  try {
    await pipeline(
      Readable.fromWeb(body as Parameters<typeof Readable.fromWeb>[0]),
      fs.createWriteStream(tmpFile)
    );
    size = fs.statSync(tmpFile).size;
  } catch {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw new UploadValidationError('Upload failed: the connection was interrupted before the file was fully received.');
  }

  if (size === 0) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw new UploadValidationError('Upload failed: the received file was empty.');
  }

  // 2. Validate the ACTUAL received size (content-length can be missing or wrong)
  const validation =
    folder === 'videos'
      ? validateVideoFile({ name: filename, size, type: contentType })
      : validatePosterFile({ name: filename, size, type: contentType });
  if (!validation.valid) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    throw new UploadValidationError(validation.error || 'Uploaded file failed validation.');
  }

  // 3. Supabase Storage path (streamed straight from disk, constant memory).
  // Only used when STORAGE_PROVIDER is 'supabase' - with 'local' the files are
  // served from public/uploads and no bucket is required.
  const wantsSupabaseStorage =
    (process.env.STORAGE_PROVIDER || 'supabase').toLowerCase() === 'supabase';

  if (wantsSupabaseStorage && isSupabaseAdminConfigured && supabaseAdmin && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    if (size > SUPABASE_STORAGE_MAX_BYTES) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      throw new UploadValidationError(
        `This file is ${(size / (1024 * 1024)).toFixed(0)} MB, which exceeds the ${(
          SUPABASE_STORAGE_MAX_BYTES / (1024 * 1024)
        ).toFixed(0)} MB upload limit. To upload full-length movies: raise the global file size limit in Supabase Dashboard -> Storage -> Settings, set STORAGE_MAX_UPLOAD_MB to the same value in .env.local, and restart. Otherwise use "Enter stream URL directly".`
      );
    }

    try {
      const uploadRes = await fetch(
        `${SUPABASE_URL}/storage/v1/object/${STORAGE_BUCKET_MOVIES}/${storageKey}`,
        {
          method: 'POST',
          headers: {
            authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
            'content-type': contentType,
            'x-upsert': 'true',
          },
          body: fs.createReadStream(tmpFile),
          // Required by undici when the body is a stream
          duplex: 'half',
        } as unknown as RequestInit
      );

      if (uploadRes.ok) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        return {
          storageKey,
          publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET_MOVIES}/${storageKey}`,
          size,
        };
      }

      const detail = await uploadRes.text().catch(() => '');
      const bucketMissing = uploadRes.status === 404 || /bucket/i.test(detail);

      // A too-large file must be reported (the caller needs to pick another
      // source), but a missing/misconfigured bucket should fall back to local
      // storage so uploads keep working.
      if (uploadRes.status === 413) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        throw new UploadValidationError(
          `Supabase Storage rejected the file as too large (${(size / (1024 * 1024)).toFixed(
            0
          )} MB). Raise the global file size limit in Supabase Dashboard -> Storage -> Settings and set STORAGE_MAX_UPLOAD_MB to match, or use "Enter stream URL directly".`
        );
      }

      if (!bucketMissing) {
        fs.rmSync(tmpDir, { recursive: true, force: true });
        throw new UploadValidationError(
          `Storage upload failed (HTTP ${uploadRes.status}). ${detail.slice(0, 200)}`
        );
      }

      // Bucket missing: fall through to local storage below
      console.warn(
        `Supabase Storage bucket "${STORAGE_BUCKET_MOVIES}" is unavailable - saving to local storage instead.`
      );
    } catch (error) {
      if (error instanceof UploadValidationError) throw error;
      fs.rmSync(tmpDir, { recursive: true, force: true });
      throw error instanceof Error
        ? error
        : new Error('Storage upload failed. Please try again.');
    }
  }

  // 4. Persistent local storage in public/uploads (supports any file size)
  try {
    ensureUploadDir();
    const targetFolder = path.join(UPLOAD_DIR, folder);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    const localFilePath = path.join(UPLOAD_DIR, storageKey);
    fs.copyFileSync(tmpFile, localFilePath);

    return {
      storageKey,
      publicUrl: `/uploads/${storageKey}`,
      size,
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

/**
 * Remove an asset from persistent storage when movie is deleted
 */
export async function deleteFromStorage(storageKey: string): Promise<boolean> {
  if (!storageKey) return false;

  if (isSupabaseAdminConfigured && supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET_MOVIES)
        .remove([storageKey]);
      if (!error) return true;
    } catch {
      // fallback
    }
  }

  try {
    const localPath = path.join(UPLOAD_DIR, storageKey);
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
      return true;
    }
  } catch {
    // ignore
  }

  return true;
}
