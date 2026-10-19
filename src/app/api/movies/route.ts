import { NextResponse } from 'next/server';
import { getMovies } from '@/lib/db/movies';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre') || undefined;
    const yearParam = searchParams.get('year');
    const language = searchParams.get('language') || undefined;
    const search = searchParams.get('search') || undefined;

    const releaseYear = yearParam ? parseInt(yearParam, 10) : undefined;

    // Normal public/user endpoint: strictly published movies
    const movies = await getMovies({
      genre,
      releaseYear: isNaN(Number(releaseYear)) ? undefined : releaseYear,
      language,
      search,
      publicationStatus: 'published',
    });

    return NextResponse.json({
      success: true,
      count: movies.length,
      movies,
    });
  } catch (error) {
    console.error('Movies query error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching movies' },
      { status: 500 }
    );
  }
}
