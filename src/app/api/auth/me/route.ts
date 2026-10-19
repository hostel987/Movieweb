import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getUserById } from '@/lib/db/users';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const fullProfile = await getUserById(session.id);
    return NextResponse.json({
      authenticated: true,
      user: fullProfile || session,
    });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}
