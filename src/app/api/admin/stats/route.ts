import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth/session';
import { getMovieStats } from '@/lib/db/movies';
import { getAllUsersAdmin } from '@/lib/db/users';

export async function GET() {
  try {
    const adminSession = await verifyAdminSession();
    if (!adminSession) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Administrator credentials required' },
        { status: 403 }
      );
    }

    const movieStats = await getMovieStats();
    const users = await getAllUsersAdmin();

    return NextResponse.json({
      success: true,
      stats: {
        totalMovies: movieStats.totalMovies,
        publishedMovies: movieStats.publishedMovies,
        draftMovies: movieStats.draftMovies,
        registeredUsers: users.length,
        totalHours: movieStats.totalHours,
      },
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching admin statistics' },
      { status: 500 }
    );
  }
}
