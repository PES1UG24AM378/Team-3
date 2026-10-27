const app = require('./app');
const config = require('./config');
const { startReminderWorker, stopReminderWorker } = require('./services/reminderWorker');

const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 Tutoring Scheduler API running on port ${config.port}`);
  console.log(`   Environment: ${config.env}`);
  console.log(`   Health Check: http://localhost:${config.port}${config.apiPrefix}/health`);
  console.log(`====================================================`);
});

// Starts the background worker that sends booking confirmations and
// scheduled reminder emails (TUT-F-025, TUT-F-030 to TUT-F-034).
startReminderWorker();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  stopReminderWorker();
  server.close(() => {
    console.log('HTTP server closed');
  });
});