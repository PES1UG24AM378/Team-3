const nodemailer = require('nodemailer');

/**
 * Builds the email transporter.
 * If SMTP_HOST is configured, real emails are sent.
 * Otherwise, emails are simulated in development without exposing contents.
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
    sendMail: async () => {
      console.log('[DEV MODE] Email simulated. SMTP_HOST is not configured.');
      return { messageId: `dev-${Date.now()}` };
    }
  };
}

const transporter = createTransport();

/**
 * Sends an email. Throws on failure so the caller can retry.
 */
async function sendEmail({ to, subject, text }) {
  if (!to) {
    throw new Error('Cannot send email: missing recipient address');
  }

  const from = process.env.SMTP_FROM || 'Tutoring Scheduler <no-reply@tutoringscheduler.local>';

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    text
  });

  return info;
}

module.exports = { sendEmail };