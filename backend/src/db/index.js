const { Pool } = require('pg');
const config = require('../config');

let pool;

function getPool() {
  if (!pool) {
    const poolConfig = config.db.connectionString
      ? { connectionString: config.db.connectionString, ssl: config.db.ssl }
      : {
          host: config.db.host,
          port: config.db.port,
          database: config.db.database,
          user: config.db.user,
          password: config.db.password,
          ssl: config.db.ssl
        };

    pool = new Pool({
      ...poolConfig,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client:', err);
    });
  }
  return pool;
}

/**
 * Execute a query with parameters
 */
async function query(text, params) {
  const p = getPool();
  const start = Date.now();
  const res = await p.query(text, params);
  const duration = Date.now() - start;
  if (config.env === 'development') {
    // optional query debug logging
  }
  return res;
}

/**
 * Acquire a client for manual transaction control
 */
async function getClient() {
  const p = getPool();
  return await p.connect();
}

/**
 * Check connectivity to the database
 */
async function checkHealth() {
  try {
    const res = await query('SELECT NOW() AT TIME ZONE \'UTC\' as now_utc');
    return {
      connected: true,
      timestampUtc: res.rows[0].now_utc
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  query,
  getClient,
  getPool,
  checkHealth,
  closePool
};
