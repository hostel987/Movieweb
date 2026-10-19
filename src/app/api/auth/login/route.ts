import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getUserByEmail, DESIGNATED_ADMIN_EMAIL } from '@/lib/db/users';
import { createSession } from '@/lib/auth/session';
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await getUserByEmail(normalizedEmail);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password against the stored bcrypt hash only.
    // The designated admin must authenticate with the real seeded password.
    let passwordValid = false;
    if (user.passwordHash) {
      passwordValid = await bcrypt.compare(password, user.passwordHash);
    }

    if (!passwordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Enforce admin role if designated admin email
    const finalRole =
      normalizedEmail === DESIGNATED_ADMIN_EMAIL.toLowerCase() ? 'admin' : user.role;

    // Issue secure session cookie
    await createSession({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: finalRole,
      phoneVerified: user.phoneVerified,
      phoneNumber: user.phoneNumber,
    });

    const userProfile = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      phoneVerified: user.phoneVerified,
      emailVerified: Boolean(user.emailVerified),
      role: finalRole,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return NextResponse.json({
      success: true,
      user: userProfile,
      redirectTo: finalRole === 'admin' ? '/admin' : '/',
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during login' },
      { status: 500 }
    );
  }
}
