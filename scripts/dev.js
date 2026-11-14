const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

console.log('====================================================');
console.log('🚀 Starting Tutoring Scheduler (Backend + Frontend)');
console.log('====================================================');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

const backend = spawn(npmCmd, ['run', 'dev:backend'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: isWindows
});

const frontend = spawn(npmCmd, ['run', 'dev:frontend'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: isWindows
});

function shutdown() {
  console.log('\nShutting down dev servers...');
  try {
    if (isWindows) {
      spawn('taskkill', ['/pid', backend.pid, '/f', '/t']);
      spawn('taskkill', ['/pid', frontend.pid, '/f', '/t']);
    } else {
      backend.kill('SIGINT');
      frontend.kill('SIGINT');
    }
  } catch (err) {
    // Ignore shutdown errors
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('exit', shutdown);
