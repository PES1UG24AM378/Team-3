const DataCleanupModel = require('../models/dataCleanup.model');

let isProcessing = false;
let intervalHandle = null;

/**
 * Runs one data-retention cleanup pass: finds users whose account was
 * deleted more than the configured retention window ago, anonymizes their
 * personal data, and records an aggregate (non-personal) log of the run.
 * Guarded by `isProcessing` so an overlapping tick never runs twice at once.
 */
async function processCleanup() {
  if (isProcessing) return;

  isProcessing = true;

  try {
    const retentionDays = Number(process.env.DATA_RETENTION_DAYS) || 90;

    const eligible = await DataCleanupModel.findEligibleForCleanup(retentionDays);

    for (const user of eligible) {
      await DataCleanupModel.anonymizeUser(user.id);
    }

    await DataCleanupModel.recordCleanupRun({
      retentionDays,
      purgedCount: eligible.length
    });

    if (eligible.length > 0) {
      console.log(
        `Data cleanup run: purged ${eligible.length} account(s) past the ${retentionDays}-day retention window.`
      );
    }
  } catch (err) {
    console.error('Data cleanup worker tick failed.');
  } finally {
    isProcessing = false;
  }
}

function startDataCleanupWorker() {
  const pollIntervalMs =
    Number(process.env.CLEANUP_POLL_INTERVAL_MS) || 24 * 60 * 60 * 1000;

  intervalHandle = setInterval(processCleanup, pollIntervalMs);

  console.log(
    `Data cleanup worker started (polling every ${pollIntervalMs}ms).`
  );
}

function stopDataCleanupWorker() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

module.exports = {
  startDataCleanupWorker,
  stopDataCleanupWorker,
  processCleanup
};