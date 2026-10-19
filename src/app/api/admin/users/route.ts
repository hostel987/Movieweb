import { NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth/session';
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

    const users = await getAllUsersAdmin();
    return NextResponse.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while fetching registered users' },
      { status: 500 }
    );
  }
}
