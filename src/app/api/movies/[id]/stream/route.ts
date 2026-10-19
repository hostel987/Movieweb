import { NextResponse } from 'next/server';
import { getMovieById } from '@/lib/db/movies';
import { getSession } from '@/lib/auth/session';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please log in to stream full movies.',
          requireLogin: true,
        },
        { status: 401 }
      );
    }

    const isAdmin = session.role === 'admin';
    const movie = await getMovieById(id, isAdmin);

    if (!movie) {
      return NextResponse.json(
        { success: false, error: 'Movie not found or not published' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      movieId: movie.id,
      title: movie.title,
      streamUrl: movie.videoUrl,
      posterUrl: movie.posterUrl,
      duration: movie.duration,
    });
  } catch (error) {
    console.error('Stream authorization error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during playback authorization' },
      { status: 500 }
    );
  }
}
