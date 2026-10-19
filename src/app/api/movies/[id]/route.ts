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
    const isAdmin = session?.role === 'admin';

    // If admin, allow preview of drafts; otherwise, published only
    const movie = await getMovieById(id, isAdmin);

    if (!movie) {
      return NextResponse.json(
        { success: false, error: 'Movie not found or not published' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      movie,
    });
  } catch (error) {
    console.error('Movie detail error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching movie details' },
      { status: 500 }
    );
  }
}
