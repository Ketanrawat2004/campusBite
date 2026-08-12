'use strict';

const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');

/**
 * Email Transport Layer
 *
 * Provides a provider-agnostic transport interface.
 * Currently implements:
 *   - Gmail SMTP (EMAIL_PROVIDER=gmail)
 *   - Development logger mode (EMAIL_PROVIDER=dev or unconfigured SMTP)
 *
 * To add Resend/SES later:
 *   1. Add a new case in createTransport()
 *   2. Set EMAIL_PROVIDER=resend in .env
 *   3. emailService.js needs NO changes
 *
 * Why Nodemailer with Gmail SMTP?
 *   - No custom domain required
 *   - Gmail App Password works without OAuth setup
 *   - Free for development/testing volumes
 *   - Easy swap to production provider later
 */

let _transport = null;

/**
 * Build the appropriate Nodemailer transport based on ENV config.
 * @returns {object} Nodemailer transporter or dev logger stub
 */
function createTransport() {
  const provider = (process.env.EMAIL_PROVIDER || 'dev').toLowerCase();
  const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;

  // ── Development console / mock mode ─────────────────────────────────────────────
  if (
    provider === 'dev' ||
    provider === 'console' ||
    provider === 'mock' ||
    !smtpUser ||
    !smtpPass
  ) {
    logger.warn({
      msg: 'Email transport: running in CONSOLE / MOCK mode. Emails will be printed to console.',
      tip: 'Set EMAIL_PROVIDER=gmail + EMAIL_USER + EMAIL_PASS in .env for real transactional email delivery.',
    });

    return {
      _isDevMode: true,
      sendMail: async (mailOptions) => {
        console.log('\n========================================');
        console.log(`📧 [CONSOLE EMAIL PROVIDER]`);
        console.log(`From: ${mailOptions.from}`);
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Content:\n${mailOptions.html}`);
        console.log('========================================\n');

        logger.info({
          msg: '📧 [CONSOLE/MOCK EMAIL] Email logged',
          to: mailOptions.to,
          subject: mailOptions.subject,
        });
        return { messageId: `mock-${Date.now()}@localhost` };
      },
      verify: async () => true,
    };
  }

  // ── Gmail SMTP ───────────────────────────────────────────────────────────
  if (provider === 'gmail') {
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass, // Gmail App Password (16 chars)
      },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 4000,
      pool: false,
    });

    logger.info({
      msg: 'Email transport: Gmail SMTP configured',
      user: smtpUser,
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
    });

    return transport;
  }

  // ── Future providers can be added here ──────────────────────────────────
  // case 'resend': return new ResendTransport({ apiKey: process.env.RESEND_API_KEY });
  // case 'ses':    return nodemailer.createTransport({ SES: new AWS.SES() });

  logger.warn({ msg: `Unknown EMAIL_PROVIDER '${provider}', falling back to dev mode` });
  return createTransport(); // recurse with dev mode
}

/**
 * Get (or create) the singleton transport.
 */
function getTransport() {
  if (!_transport) {
    _transport = createTransport();
  }
  return _transport;
}

/**
 * Verify SMTP connection. Called at startup if not in dev mode.
 */
async function verifyTransport() {
  const transport = getTransport();
  if (transport._isDevMode) return;

  try {
    await transport.verify();
    logger.info({ msg: 'Email SMTP connection verified successfully' });
  } catch (err) {
    logger.error({
      msg: 'Email SMTP connection failed. Emails will NOT be sent.',
      err: err.message,
      tip: 'Check SMTP_USER, SMTP_PASSWORD, and Gmail App Password settings.',
    });
    // Don't throw — degrade gracefully, don't crash the app
  }
}

module.exports = { getTransport, verifyTransport };
