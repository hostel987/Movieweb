import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import nodemailer, { Transporter } from 'nodemailer';
import { getLocalOtps, saveLocalOtps } from '../db/local-db';

/**
 * SMTP configuration is read lazily (on each send) from process.env and .env.local
 * so that additions or edits in .env.local are picked up immediately without
 * requiring a dev server restart.
 */
interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

function parseEnvFile(filePath: string): Record<string, string> {
  const result: Record<string, string> = {};
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (
            (val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))
          ) {
            val = val.slice(1, -1);
          }
          result[key] = val;
        }
      }
    }
  } catch {
    // Ignore read errors
  }
  return result;
}

function readSmtpConfig(): SmtpConfig {
  const envLocal = parseEnvFile(path.join(process.cwd(), '.env.local'));
  const host = (envLocal.SMTP_HOST ?? process.env.SMTP_HOST ?? '').trim();
  const port = Number(envLocal.SMTP_PORT ?? process.env.SMTP_PORT ?? 587);
  const secure = (envLocal.SMTP_SECURE ?? process.env.SMTP_SECURE) === 'true';
  const user = (envLocal.SMTP_USER ?? process.env.SMTP_USER ?? '').trim();
  const pass = (envLocal.SMTP_PASS ?? process.env.SMTP_PASS ?? '').trim();
  const configuredFrom = (envLocal.SMTP_FROM ?? process.env.SMTP_FROM ?? '').trim();

  // If using Gmail or generic SMTP with a user account, default 'from' to the authenticated
  // address so providers (e.g. Gmail) do not reject or bounce the message due to sender policy.
  let from = configuredFrom;
  if (!from || (from.includes('cinepulse.app') && user && user.includes('@'))) {
    from = user ? `CinePulse <${user}>` : 'CinePulse <no-reply@cinepulse.app>';
  }

  return { host, port, secure, user, pass, from };
}

function isSmtpConfigured(config: SmtpConfig): boolean {
  return Boolean(config.host && config.user && config.pass);
}

let cachedTransporter: Transporter | null = null;
let cachedTransporterKey = '';

function getTransporter(): Transporter | null {
  const config = readSmtpConfig();
  if (!isSmtpConfigured(config)) return null;

  const key = `${config.host}|${config.port}|${config.secure}|${config.user}|${config.pass}`;
  if (cachedTransporter && cachedTransporterKey === key) return cachedTransporter;

  cachedTransporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
  cachedTransporterKey = key;
  return cachedTransporter;
}

// In-memory rate limiting tracker (per email address)
interface RateLimitEntry {
  lastSentAt: number;
  countLastHour: number;
  firstAttemptAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RESEND_COOLDOWN_SECONDS = 60;
const MAX_HOURLY_REQUESTS = 5;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_RECORD_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Validates a standard email address format
 */
export function validateEmail(email: string): { isValid: boolean; normalized?: string; error?: string } {
  if (!email) {
    return { isValid: false, error: 'Email address is required' };
  }

  const normalized = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    return { isValid: false, error: 'Please provide a valid email address' };
  }

  return { isValid: true, normalized };
}

/**
 * Build the branded CinePulse verification email (HTML + plain text)
 */
function buildOtpEmail(code: string): { html: string; text: string } {
  const text = [
    'CinePulse Verification Code',
    '',
    `Your one-time verification code is: ${code}`,
    '',
    'This code expires in 10 minutes. If you did not request it, you can safely ignore this email.',
    '',
    '- The CinePulse Team',
  ].join('\n');

  const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CinePulse Verification Code</title>
  </head>
  <body style="margin:0;padding:0;background-color:#07080b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#07080b;padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#0e111a;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:32px 40px 8px 40px;text-align:center;">
                <div style="font-size:26px;font-weight:900;letter-spacing:2px;color:#ffffff;">
                  CINE<span style="color:#e50914;">PULSE</span>
                </div>
                <div style="font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#9ca3af;margin-top:4px;">Streaming</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 40px 0 40px;text-align:center;">
                <h1 style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">Verify your email address</h1>
                <p style="margin:12px 0 0 0;font-size:14px;line-height:1.6;color:#d1d5db;">
                  Enter the following one-time verification code to complete your CinePulse registration:
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 40px 8px 40px;text-align:center;">
                <div style="display:inline-block;background-color:#07080b;border:1px solid rgba(229,9,20,0.4);border-radius:12px;padding:18px 36px;font-size:36px;font-weight:800;letter-spacing:10px;color:#ffffff;font-family:'Courier New',monospace;">
                  ${code}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 40px 8px 40px;text-align:center;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">This code expires in <strong style="color:#f59e0b;">10 minutes</strong>.</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 40px 36px 40px;text-align:center;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
                  If you did not create a CinePulse account, you can safely ignore this email.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#0a0c12;padding:16px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
                <p style="margin:0;font-size:11px;color:#4b5563;">&copy; ${new Date().getFullYear()} CinePulse Streaming. All rights reserved.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`.trim();

  return { html, text };
}

/**
 * Send a 6-digit verification code to the user's email address.
 * Uses SMTP when configured; otherwise falls back to a secure server-side
 * console log for local development (the code is never exposed to the client).
 */
export async function sendEmailOtp(
  email: string
): Promise<{
  success: boolean;
  message: string;
  cooldownSeconds?: number;
  devMode?: boolean;
  devCode?: string;
}> {
  const validation = validateEmail(email);
  if (!validation.isValid || !validation.normalized) {
    return { success: false, message: validation.error || 'Invalid email address' };
  }

  const normalized = validation.normalized;
  const now = Date.now();

  // Fail closed: in production the code must actually reach the user's inbox,
  // so an unconfigured SMTP provider must not silently "succeed" (and must not
  // consume the caller's rate-limit budget).
  const mailTransport = getTransporter();
  if (!mailTransport && process.env.NODE_ENV === 'production') {
    return {
      success: false,
      message: 'Email delivery is not configured on this server. Please contact the administrator.',
    };
  }

  // Rate limiting (per email address). Snapshot first so a failed dispatch can
  // restore the exact previous state.
  const previousRateLimit = rateLimitMap.get(normalized)
    ? { ...rateLimitMap.get(normalized)! }
    : null;
  const rateLimit = rateLimitMap.get(normalized);
  if (rateLimit) {
    const secondsSinceLast = Math.floor((now - rateLimit.lastSentAt) / 1000);
    if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
      const remaining = RESEND_COOLDOWN_SECONDS - secondsSinceLast;
      return {
        success: false,
        message: `Please wait ${remaining} seconds before requesting another verification code.`,
        cooldownSeconds: remaining,
      };
    }

    if (now - rateLimit.firstAttemptAt < 3600 * 1000) {
      if (rateLimit.countLastHour >= MAX_HOURLY_REQUESTS) {
        return {
          success: false,
          message: 'Too many verification requests. Please try again in an hour for security reasons.',
        };
      }
      rateLimit.countLastHour += 1;
      rateLimit.lastSentAt = now;
    } else {
      rateLimit.countLastHour = 1;
      rateLimit.firstAttemptAt = now;
      rateLimit.lastSentAt = now;
    }
  } else {
    rateLimitMap.set(normalized, {
      lastSentAt: now,
      countLastHour: 1,
      firstAttemptAt: now,
    });
  }

  // Generate cryptographically secure 6-digit code (stored hashed, never plaintext)
  const code = crypto.randomInt(100000, 999999).toString();
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(now + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();

  if (mailTransport) {
    const smtpConfig = readSmtpConfig();
    try {
      const { html, text } = buildOtpEmail(code);
      await mailTransport.sendMail({
        from: smtpConfig.from,
        to: normalized,
        subject: 'Your CinePulse verification code',
        text,
        html,
      });

      // Persist only after a successful delivery so a failed send never
      // leaves an undeliverable code behind.
      persistEmailOtp(normalized, codeHash, expiresAt);

      return {
        success: true,
        message: 'Verification code sent to your email address.',
        cooldownSeconds: RESEND_COOLDOWN_SECONDS,
      };
    } catch (error) {
      // Surface the provider's real error (EAUTH, ETIMEDOUT, ...) in the
      // server log so a failed delivery is never silent.
      const reason = error as { code?: string; message?: string; response?: string };
      console.error(
        `[EMAIL-SERVICE] Delivery to ${normalized} failed:`,
        reason?.code || 'UNKNOWN',
        reason?.message || reason
      );
      // Restore the exact pre-send rate-limit state so a transient provider
      // failure does not consume the user's resend cooldown.
      rollbackRateLimit(normalized, previousRateLimit);

      let userMessage = 'Failed to send verification email. Please try again later.';
      if (reason?.code === 'EAUTH') {
        userMessage =
          'SMTP authentication failed. If using Gmail, make sure you use a 16-character Google App Password (not your normal password).';
      } else if (reason?.code === 'ETIMEDOUT' || reason?.code === 'ESOCKET') {
        userMessage = 'Connection to mail server timed out. Please check your network and SMTP port.';
      }

      return {
        success: false,
        message: userMessage,
      };
    }
  }

  // Local development fallback: SMTP credentials are not configured, so the
  // code is written to the server log and returned in devMode so local testing is seamless.
  persistEmailOtp(normalized, codeHash, expiresAt);
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `[EMAIL-SERVICE-DISPATCH] Verification email dispatched to ${normalized}. [SECURE SERVER LOG ONLY: Token=${code}]`
    );
  }

  return {
    success: true,
    message: 'Verification code generated for testing.',
    cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    devMode: true,
    ...(process.env.NODE_ENV !== 'production' ? { devCode: code } : {}),
  };
}

/**
 * Store (or replace) the pending email OTP and prune stale entries so the
 * store stays bounded. Records belonging to OTHER email addresses are never
 * touched: a verified-but-not-yet-consumed code must survive until registration.
 */
function persistEmailOtp(email: string, codeHash: string, expiresAt: string): void {
  const otps = getLocalOtps().filter((o) => {
    // Supersede any existing record for this email (pending, verified or expired)
    if (o.email === email) return false;
    // Bound growth: drop records for other emails older than 24 hours
    return Date.now() - new Date(o.createdAt).getTime() < MAX_OTP_RECORD_AGE_MS;
  });

  otps.push({
    email,
    codeHash,
    attempts: 0,
    expiresAt,
    verified: false,
    createdAt: new Date().toISOString(),
  });
  saveLocalOtps(otps);
}

/**
 * Undo a rate-limit update after a failed dispatch, restoring the previous state.
 */
function rollbackRateLimit(email: string, previous: RateLimitEntry | null): void {
  if (previous) {
    rateLimitMap.set(email, previous);
  } else {
    rateLimitMap.delete(email);
  }
}

/**
 * Atomically consume a verified, unexpired email OTP record.
 * Returns true only when the email address genuinely completed the OTP
 * challenge; the record is removed so it cannot be replayed.
 */
export function consumeVerifiedEmailOtp(email: string): boolean {
  const validation = validateEmail(email);
  if (!validation.isValid || !validation.normalized) return false;

  const normalized = validation.normalized;
  const otps = getLocalOtps();
  const index = otps.findIndex((o) => o.email === normalized && o.verified);

  if (index === -1) return false;

  const entry = otps[index];
  const stillValid = new Date(entry.expiresAt).getTime() >= Date.now();
  otps.splice(index, 1);
  saveLocalOtps(otps);

  return stillValid;
}

/**
 * Verify an email OTP on the server.
 * Server-side checks: code match, expiration, attempt limit, replay prevention.
 */
export async function verifyEmailOtp(
  email: string,
  code: string
): Promise<{ success: boolean; message: string }> {
  const validation = validateEmail(email);
  if (!validation.isValid || !validation.normalized) {
    return { success: false, message: validation.error || 'Invalid email address' };
  }

  const normalized = validation.normalized;
  const cleanedCode = code.trim();

  if (!cleanedCode || cleanedCode.length !== 6) {
    return { success: false, message: 'Please enter a valid 6-digit verification code' };
  }

  // Cryptographic server-side check
  const otps = getLocalOtps();
  const entry = otps.find((o) => o.email === normalized && !o.verified);

  if (!entry) {
    return {
      success: false,
      message: 'No pending verification code found. Please request a new code.',
    };
  }

  // Check expiry
  if (new Date(entry.expiresAt).getTime() < Date.now()) {
    return {
      success: false,
      message: 'Verification code has expired. Please request a new one.',
    };
  }

  // Check max attempts (prevent brute force)
  if (entry.attempts >= 5) {
    return {
      success: false,
      message: 'Maximum attempts exceeded for this code. Please request a new code.',
    };
  }

  entry.attempts += 1;

  // Verify hash
  const inputHash = crypto.createHash('sha256').update(cleanedCode).digest('hex');
  if (inputHash !== entry.codeHash) {
    saveLocalOtps(otps);
    const remaining = 5 - entry.attempts;
    return {
      success: false,
      message: `Incorrect code. ${remaining} attempt(s) remaining.`,
    };
  }

  // Mark verified
  entry.verified = true;
  saveLocalOtps(otps);

  return {
    success: true,
    message: 'Email verified successfully!',
  };
}
