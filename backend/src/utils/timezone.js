/**
 * Timezone & Date utility functions
 * Enforces rule: All timestamps stored and processed in UTC
 */

/**
 * Parses any date input and returns ISO UTC string
 */
function toUtcIso(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date input');
  }
  return d.toISOString();
}

/**
 * Returns current UTC time as an ISO string
 */
function currentUtcIso() {
  return new Date().toISOString();
}

/**
 * Calculates whether cancellation is within allowed notice window
 * @param {Date|string} sessionStartTime
 * @param {number} noticeHours
 * @returns {boolean} true if cancelable, false if within locked notice window
 */
function isWithinCancellationWindow(sessionStartTime, noticeHours = 2) {
  const sessionTime = new Date(sessionStartTime).getTime();
  const now = Date.now();
  const noticeMs = noticeHours * 60 * 60 * 1000;
  return (sessionTime - now) >= noticeMs;
}

/**
 * Adds minutes to an ISO UTC string
 */
function addMinutesUtc(dateInput, minutes) {
  const d = new Date(dateInput);
  return new Date(d.getTime() + minutes * 60000).toISOString();
}

module.exports = {
  toUtcIso,
  currentUtcIso,
  isWithinCancellationWindow,
  addMinutesUtc
};
