const express = require('express');
const db = require('../db');
const { currentUtcIso } = require('../utils/timezone');

const router = express.Router();

/**
 * @route GET /api/health
 * @desc System health check endpoint for frontend & CI/monitoring
 */
router.get('/', async (req, res) => {
  try {
    const dbHealth = await db.checkHealth();

    const connected = Boolean(dbHealth.connected);
    const status = connected ? 'ok' : 'degraded';
    const statusCode = connected ? 200 : 503;

    res.status(statusCode).json({
      status,
      service: 'peer-to-peer-tutoring-api',
      uptimeSeconds: Math.floor(process.uptime()),
      timestampUtc: currentUtcIso(),
      database: {
        status: connected ? 'connected' : 'disconnected',
        serverTimeUtc: connected ? dbHealth.timestampUtc || null : null,
        error: connected ? null : 'Database connection unavailable'
      },
      version: '1.0.0'
    });
  } catch (err) {
    res.status(503).json({
      status: 'degraded',
      service: 'peer-to-peer-tutoring-api',
      uptimeSeconds: Math.floor(process.uptime()),
      timestampUtc: currentUtcIso(),
      database: {
        status: 'disconnected',
        serverTimeUtc: null,
        error: 'Database connection unavailable'
      },
      version: '1.0.0'
    });
  }
});

module.exports = router;