import { NextResponse } from 'next/server';
import { verifyEmailOtp } from '@/lib/services/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email address and verification code are required' },
        { status: 400 }
      );
    }

    const result = await verifyEmailOtp(email, code);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    console.error('Email OTP Verify error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while verifying code' },
      { status: 500 }
    );
  }
}
