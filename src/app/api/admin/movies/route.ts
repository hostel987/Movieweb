import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth/session';
import { getAllMoviesAdmin, createMovie } from '@/lib/db/movies';
import { validateVideoUrl } from '@/lib/services/validation';

export async function GET() {
  try {
    const adminSession = await verifyAdminSession();
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Administrator credentials required' },
        { status: 403 }
      );
    }

    const movies = await getAllMoviesAdmin();
    return NextResponse.json({
      success: true,
      count: movies.length,
      movies,
    });
  } catch (error) {
    console.error('Admin movies fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching admin movies' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const adminSession = await verifyAdminSession();
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Administrator credentials required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      posterUrl,
      videoUrl,
      posterStorageKey,
      videoStorageKey,
      genre,
      releaseYear,
      language,
      duration,
      rating,
      cast,
      director,
      publicationStatus,
      featured,
    } = body;

    // Strict validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Movie title is required' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Movie description/synopsis is required' },
        { status: 400 }
      );
    }

    if (!posterUrl) {
      return NextResponse.json(
        { success: false, error: 'Movie poster is required' },
        { status: 400 }
      );
    }

    if (!videoUrl) {
      return NextResponse.json(
        { success: false, error: 'Movie video stream/file is required' },
        { status: 400 }
      );
    }

    // The video source must be a browser-playable URL: local file paths and
    // browser-unsupported formats (MKV / x265) would only fail at playback.
    const videoUrlValidation = validateVideoUrl(videoUrl);
    if (!videoUrlValidation.isValid) {
      return NextResponse.json(
        { success: false, error: videoUrlValidation.error },
        { status: 400 }
      );
    }

    const year = parseInt(releaseYear, 10);
    if (isNaN(year) || year < 1900 || year > 2100) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid release year (e.g. 2026)' },
        { status: 400 }
      );
    }

    const durationMins = parseInt(duration, 10);
    if (isNaN(durationMins) || durationMins <= 0) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid movie duration in minutes' },
        { status: 400 }
      );
    }

    const genresList = Array.isArray(genre)
      ? genre
      : typeof genre === 'string'
      ? genre.split(',').map((g) => g.trim()).filter(Boolean)
      : ['Action'];

    const castList = Array.isArray(cast)
      ? cast
      : typeof cast === 'string'
      ? cast.split(',').map((c) => c.trim()).filter(Boolean)
      : [];

    const movie = await createMovie(
      {
        title: title.trim(),
        description: description.trim(),
        posterUrl,
        videoUrl,
        posterStorageKey: posterStorageKey || `posters/${Date.now()}.jpg`,
        videoStorageKey: videoStorageKey || `videos/${Date.now()}.mp4`,
        backdropUrl: posterUrl,
        genre: genresList,
        releaseYear: year,
        language: language || 'English',
        duration: durationMins,
        rating: rating || 'PG-13',
        cast: castList,
        director: director?.trim() || 'Unknown',
        publicationStatus: publicationStatus === 'published' ? 'published' : 'draft',
        featured: Boolean(featured),
        uploadedBy: adminSession.id,
      },
      adminSession.id
    );

    return NextResponse.json({
      success: true,
      message:
        movie.publicationStatus === 'published'
          ? 'Movie published successfully!'
          : 'Movie saved as draft successfully!',
      movie,
    });
  } catch (error) {
    console.error('Admin movie creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while creating movie' },
      { status: 500 }
    );
  }
}
