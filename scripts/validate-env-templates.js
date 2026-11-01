const fs = require('node:fs');
const path = require('node:path');

const templates = [
  {
    file: '.env.example',
    required: [
      'PORT', 'NODE_ENV', 'API_PREFIX', 'DATABASE_URL', 'DB_HOST', 'DB_PORT',
      'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_SSL', 'CLIENT_ORIGIN', 'JWT_SECRET',
      'JWT_EXPIRES_IN', 'MIN_CANCELLATION_NOTICE_HOURS', 'TIMEZONE'
    ]
  },
  {
    file: 'backend/.env.example',
    required: [
      'PORT', 'NODE_ENV', 'API_PREFIX', 'DATABASE_URL', 'DB_HOST', 'DB_PORT',
      'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_SSL', 'CLIENT_ORIGIN', 'JWT_SECRET',
      'JWT_EXPIRES_IN', 'MIN_CANCELLATION_NOTICE_HOURS', 'TIMEZONE', 'SMTP_HOST',
      'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM',
      'REMINDER_POLL_INTERVAL_MS', 'REMINDER_RETRY_BASE_MINUTES', 'REMINDER_MAX_RETRIES'
    ]
  },
  { file: 'frontend/.env.example', required: ['VITE_API_BASE_URL'] }
];

let failed = false;

for (const template of templates) {
  const filePath = path.resolve(template.file);
  if (!fs.existsSync(filePath)) {
    console.error(`Missing environment template: ${template.file}`);
    failed = true;
    continue;
  }

  const keys = new Set();
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const [index, rawLine] of lines.entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    const key = separator === -1 ? '' : line.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      console.error(`${template.file}:${index + 1}: invalid environment assignment`);
      failed = true;
      continue;
    }
    if (keys.has(key)) {
      console.error(`${template.file}:${index + 1}: duplicate key ${key}`);
      failed = true;
    }
    keys.add(key);
  }

  for (const key of template.required) {
    if (!keys.has(key)) {
      console.error(`${template.file}: missing expected key ${key}`);
      failed = true;
    }
  }

  const contents = fs.readFileSync(filePath, 'utf8');
  if (template.file !== 'frontend/.env.example' && !/JWT_SECRET=(?:development|dev_|change|replace|example)/i.test(contents)) {
    console.error(`${template.file}: JWT_SECRET must remain a development/example placeholder`);
    failed = true;
  }
}

if (failed) process.exitCode = 1;
else console.log(`Environment templates validated (${templates.length} files).`);
