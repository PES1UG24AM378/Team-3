
const ReminderJobModel = require('../models/reminderJob.model');
const { buildNotificationContent } = require('../utils/notificationContent');
const { sendEmail } = require('../utils/mailer');

let isProcessing = false;
let intervalHandle = null;

/**
 * Processes all reminder/notification jobs that are currently due.
 * Guarded by `isProcessing` so an overlapping tick never processes
 * the same batch twice.
 */
async function processDueJobs() {
  if (isProcessing) return;

  isProcessing = true;

  try {
    const maxRetries = Number(process.env.REMINDER_MAX_RETRIES) || 3;
    const baseMinutes = Number(process.env.REMINDER_RETRY_BASE_MINUTES) || 1;

    const jobs = await ReminderJobModel.findDueJobs(20);

    for (const job of jobs) {
      // Booking is no longer confirmed — don't send a stale reminder.
      if (job.booking_status !== 'confirmed') {
        await ReminderJobModel.markCancelled(job.id);
        continue;
      }

      try {
        const { subject, text } = buildNotificationContent(
          job.reminder_type,
          job
        );

        // Notify both tutor and tutee.
        await sendEmail({ to: job.tutor_email, subject, text });
        await sendEmail({ to: job.tutee_email, subject, text });

        await ReminderJobModel.markSent(job.id);
      } catch (err) {
        console.error(
          `Reminder job ${job.id} (${job.reminder_type}) failed.`
        );

        await ReminderJobModel.markFailedAttempt(
          job.id,
          err.message,
          { maxRetries, baseMinutes }
        );
      }
    }
  } catch (err) {
    console.error('Reminder worker tick failed.');
  } finally {
    isProcessing = false;
  }
}

function startReminderWorker() {
  const pollIntervalMs =
    Number(process.env.REMINDER_POLL_INTERVAL_MS) || 15000;

  intervalHandle = setInterval(processDueJobs, pollIntervalMs);

  console.log(
    `Reminder worker started (polling every ${pollIntervalMs}ms).`
  );
}

function stopReminderWorker() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = {
  startReminderWorker,
  stopReminderWorker,
  processDueJobs
};
