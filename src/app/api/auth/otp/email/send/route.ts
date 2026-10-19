import { NextResponse } from 'next/server';
import { sendEmailOtp } from '@/lib/services/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    const result = await sendEmailOtp(email);

    if (!result.success) {
      const isRateLimited = typeof result.cooldownSeconds === 'number';
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          cooldownSeconds: result.cooldownSeconds,
        },
        { status: isRateLimited ? 429 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      cooldownSeconds: result.cooldownSeconds,
      devMode: result.devMode,
      ...(result.devCode ? { devCode: result.devCode } : {}),
    });
  } catch (error) {
    console.error('Email OTP Send error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while processing verification request' },
      { status: 500 }
    );
  }
}
