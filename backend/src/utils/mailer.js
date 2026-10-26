const nodemailer = require('nodemailer');

/**
 * Builds the email transporter.
 * If SMTP_HOST is configured in .env, real emails are sent through that server.
 * If not (as in local development/demo), emails are simply printed to the
 * console instead of being sent — this keeps the feature fully testable
 * without needing real email provider credentials (TUT-F-033 sibling rule:
 * secrets stay in environment configuration, never hardcoded).
 */
function createTransport() {
   if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      socketTimeout: 5000
    });
  }

  return {
    sendMail: async (mailOptions) => {
      console.log('--- [DEV MODE] No SMTP_HOST configured, email not actually sent ---');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Body:\n', mailOptions.text);
      console.log('--- end email ---');
      return { messageId: `dev-${Date.now()}` };
    }
  };
}

const transporter = createTransport();

/**
 * Sends an email. Throws on failure so the caller (the reminder worker)
 * can catch it and apply retry/backoff logic (TUT-F-033).
 */
async function sendEmail({ to, subject, text }) {
  if (!to) {
    throw new Error('Cannot send email: missing recipient address');
  }
  const from = process.env.SMTP_FROM || 'Tutoring Scheduler <no-reply@tutoringscheduler.local>';
  const info = await transporter.sendMail({ from, to, subject, text });
  return info;
}

module.exports = { sendEmail };