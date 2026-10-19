import { NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/db/users';
import { validatePhoneNumber } from '@/lib/services/validation';
import { consumeVerifiedEmailOtp } from '@/lib/services/email';
import { createSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, email, phoneNumber, password } = body;

    // Validate fields
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Full name is required (minimum 2 characters)' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.isValid || !phoneValidation.normalized) {
      return NextResponse.json(
        { success: false, error: phoneValidation.error || 'Invalid mobile number' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existing = await getUserByEmail(normalizedEmail);
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    // Server-side email verification: registration is only allowed when the
    // email address has completed the OTP challenge. The client cannot assert
    // this itself - the verified OTP record is consumed here.
    const emailOtpVerified = consumeVerifiedEmailOtp(normalizedEmail);
    if (!emailOtpVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email verification required. Please complete the OTP step before registering.',
        },
        { status: 403 }
      );
    }

    // Create user profile (role assignment is strictly verified server-side: hostelform31@gmail.com -> admin)
    const newUser = await createUser({
      fullName: fullName.trim(),
      email: normalizedEmail,
      phoneNumber: phoneValidation.normalized,
      password,
      phoneVerified: false,
      emailVerified: true,
    });

    // Create secure session
    await createSession({
      id: newUser.id,
      email: newUser.email,
      fullName: newUser.fullName,
      role: newUser.role,
      phoneVerified: newUser.phoneVerified,
      phoneNumber: newUser.phoneNumber,
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      redirectTo: newUser.role === 'admin' ? '/admin' : '/',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during registration' },
      { status: 500 }
    );
  }
}
