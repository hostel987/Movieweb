/**
 * SMTP delivery diagnostic.
 *
 * Loads .env.local, checks that credentials are present, verifies the SMTP
 * connection, and sends a real test email to the configured address.
 *
 * Usage:  node scripts/verify-smtp.js
 */
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('No .env.local found in', process.cwd());
  process.exit(1);
}

const env = {};
for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
}

const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM } = env;

console.log('--- configuration ---');
console.log('SMTP_HOST  :', SMTP_HOST || '(empty)');
console.log('SMTP_PORT  :', SMTP_PORT || '(default 587)');
console.log('SMTP_SECURE:', SMTP_SECURE || 'false');
console.log('SMTP_USER  :', SMTP_USER ? SMTP_USER.replace(/^(.).*(@.*)$/, '$1***$2') : '(empty)');
console.log('SMTP_PASS  :', SMTP_PASS ? `set (${SMTP_PASS.length} chars)` : '(empty)');
console.log('SMTP_FROM  :', SMTP_FROM || '(defaults to SMTP_USER)');

const problems = [];
if (!SMTP_HOST) problems.push('SMTP_HOST is empty - use smtp.gmail.com for Gmail.');
if (!SMTP_USER) problems.push('SMTP_USER is empty - enter your full Gmail address.');
if (!SMTP_PASS) problems.push('SMTP_PASS is empty - enter a 16-character Gmail App Password.');
if (SMTP_PASS && SMTP_PASS.replace(/\s/g, '').length !== 16) {
  problems.push(
    `SMTP_PASS is ${SMTP_PASS.replace(/\s/g, '').length} characters - Gmail App Passwords are exactly 16.`
  );
}

if (problems.length > 0) {
  console.log('\nRESULT: credentials are incomplete - no email can be sent.');
  for (const p of problems) console.log('  -', p);
  console.log(
    '\nHow to fix (Gmail):\n' +
      '  1. Google Account -> Security -> enable 2-Step Verification.\n' +
      '  2. Google Account -> Security -> App passwords -> generate one (16 chars).\n' +
      '  3. Put your Gmail address in SMTP_USER and that 16-char password in SMTP_PASS.\n' +
      '  4. Restart: npm run dev\n'
  );
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT || 587),
  secure: SMTP_SECURE === 'true',
  auth: { user: SMTP_USER, pass: SMTP_PASS },
});

(async () => {
  console.log('\nverifying SMTP login...');
  try {
    await transporter.verify();
    console.log('  SMTP login OK');
  } catch (error) {
    console.log('  SMTP login FAILED:', error.code || '', String(error.message).split('\n')[0]);
    if (error.code === 'EAUTH') {
      console.log(
        '  -> Gmail rejected the username/password. Use a 16-character App Password\n' +
          '     (Google Account -> Security -> App passwords), not your normal Gmail password.'
      );
    }
    process.exit(1);
  }

  console.log('sending test email to', SMTP_USER, '...');
  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to: SMTP_USER,
      subject: 'CinePulse SMTP test',
      text: 'If you received this, CinePulse OTP emails will be delivered.',
    });
    console.log('  SENT. messageId:', info.messageId, '| accepted:', JSON.stringify(info.accepted));
    console.log('\nRESULT: SMTP is working. Check the inbox (and spam folder) for the test email.');
    console.log('Now restart the dev server: npm run dev');
  } catch (error) {
    console.log('  SEND FAILED:', error.code || '', String(error.message).split('\n')[0]);
    process.exit(1);
  }
})();
