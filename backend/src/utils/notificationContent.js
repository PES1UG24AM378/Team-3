/**
 * Builds the subject and body text for a given notification type.
 * `booking` must include: subject, start_time, tutor_name, tutee_name
 */
function buildNotificationContent(reminderType, booking) {
  const sessionTime = new Date(booking.start_time).toUTCString();

  if (reminderType === 'confirmation') {
    return {
      subject: `Booking confirmed: ${booking.subject}`,
      text:
        `Your tutoring session is confirmed.\n\n` +
        `Subject: ${booking.subject}\n` +
        `Tutor: ${booking.tutor_name}\n` +
        `Tutee: ${booking.tutee_name}\n` +
        `Starts: ${sessionTime} (UTC)\n\n` +
        `See you then!`
    };
  }

  if (reminderType === '24h') {
    return {
      subject: `Reminder: ${booking.subject} session in 24 hours`,
      text:
        `This is a reminder that your tutoring session is coming up in about 24 hours.\n\n` +
        `Subject: ${booking.subject}\n` +
        `Tutor: ${booking.tutor_name}\n` +
        `Tutee: ${booking.tutee_name}\n` +
        `Starts: ${sessionTime} (UTC)`
    };
  }

  if (reminderType === '1h') {
    return {
      subject: `Reminder: ${booking.subject} session in 1 hour`,
      text:
        `This is a reminder that your tutoring session starts in about 1 hour.\n\n` +
        `Subject: ${booking.subject}\n` +
        `Tutor: ${booking.tutor_name}\n` +
        `Tutee: ${booking.tutee_name}\n` +
        `Starts: ${sessionTime} (UTC)`
    };
  }

  throw new Error(`Unknown reminder type: ${reminderType}`);
}

module.exports = { buildNotificationContent };