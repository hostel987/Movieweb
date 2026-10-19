import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth/session';
import {
  validatePosterFile,
  validateVideoFile,
  uploadStreamToStorage,
  UploadValidationError,
} from '@/lib/storage';

export async function POST(request: Request) {
  try {
    const adminSession = await verifyAdminSession();
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Administrator credentials required' },
        { status: 403 }
      );
    }

    // Streaming upload: the raw file body is piped straight to storage.
    // This avoids buffering multi-gigabyte videos in memory (and the
    // "Failed to parse body as FormData" failure on very large uploads).
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') === 'videos' ? 'videos' : 'posters';
    const filename = searchParams.get('filename') || 'upload';
    const contentType = request.headers.get('content-type') || 'application/octet-stream';

    if (!request.body) {
      return NextResponse.json(
        { success: false, error: 'No file data was received in the upload request' },
        { status: 400 }
      );
    }

    // Pre-flight validation using the declared content length when available
    const declaredSize = Number(request.headers.get('content-length') || 0);
    if (declaredSize > 0) {
      const validation =
        folder === 'videos'
          ? validateVideoFile({ name: filename, size: declaredSize, type: contentType })
          : validatePosterFile({ name: filename, size: declaredSize, type: contentType });
      if (!validation.valid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 });
      }
    }

    const result = await uploadStreamToStorage(request.body, filename, contentType, folder);

    return NextResponse.json({
      success: true,
      storageKey: result.storageKey,
      publicUrl: result.publicUrl,
      fileName: filename,
      fileSize: result.size,
    });
  } catch (error) {
    console.error('File upload error:', error);
    const message =
      error instanceof Error && error.message ? error.message : 'Internal server error during file upload';
    const status = error instanceof UploadValidationError ? 400 : 500;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
