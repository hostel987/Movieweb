import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth/session';
import { getMovieById, updateMovie, deleteMovie } from '@/lib/db/movies';
import { deleteFromStorage } from '@/lib/storage';
import { validateVideoUrl } from '@/lib/services/validation';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await verifyAdminSession();
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Administrator credentials required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    const existing = await getMovieById(id, true);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Movie record not found' },
        { status: 404 }
      );
    }

    // If the video source is being changed, it must be browser-playable
    if (typeof body?.videoUrl === 'string') {
      const videoUrlValidation = validateVideoUrl(body.videoUrl);
      if (!videoUrlValidation.isValid) {
        return NextResponse.json(
          { success: false, error: videoUrlValidation.error },
          { status: 400 }
        );
      }
    }

    const updated = await updateMovie(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Failed to update movie record' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Movie updated successfully',
      movie: updated,
    });
  } catch (error) {
    console.error('Admin movie update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while updating movie' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminSession = await verifyAdminSession();
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Administrator credentials required' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const existing = await getMovieById(id, true);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Movie record not found' },
        { status: 404 }
      );
    }

    // Securely delete from database
    const deleted = await deleteMovie(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Failed to delete movie from database' },
        { status: 500 }
      );
    }

    // Cleanup associated storage assets if they are custom uploads
    if (existing.posterStorageKey && !existing.posterStorageKey.startsWith('http')) {
      await deleteFromStorage(existing.posterStorageKey).catch(() => {});
    }
    if (existing.videoStorageKey && !existing.videoStorageKey.startsWith('http')) {
      await deleteFromStorage(existing.videoStorageKey).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: `Movie "${existing.title}" and its assets were securely removed.`,
    });
  } catch (error) {
    console.error('Admin movie deletion error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while deleting movie' },
      { status: 500 }
    );
  }
}
