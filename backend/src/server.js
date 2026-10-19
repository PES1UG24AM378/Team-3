const app = require('./app');
const config = require('./config');

const server = app.listen(config.port, () => {
  console.log(`====================================================`);
  console.log(`🚀 Tutoring Scheduler API running on port ${config.port}`);
  console.log(`   Environment: ${config.env}`);
  console.log(`   Health Check: http://localhost:${config.port}${config.apiPrefix}/health`);
  console.log(`====================================================`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
