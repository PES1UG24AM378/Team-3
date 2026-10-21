const express = require('express');
const db = require('../db');
const { currentUtcIso } = require('../utils/timezone');

const router = express.Router();

/**
 * @route GET /api/health
 * @desc System health check endpoint for frontend & CI/monitoring
 */
router.get('/', async (req, res) => {
  const dbHealth = await db.checkHealth();

  const status = dbHealth.connected ? 'ok' : 'degraded';
  const statusCode = dbHealth.connected ? 200 : 503;

  res.status(statusCode).json({
    status,
    service: 'peer-to-peer-tutoring-api',
    uptimeSeconds: Math.floor(process.uptime()),
    timestampUtc: currentUtcIso(),
    database: {
      status: dbHealth.connected ? 'connected' : 'disconnected',
      serverTimeUtc: dbHealth.timestampUtc || null,
      error: dbHealth.error || null
    },
    version: '1.0.0'
  });
});

module.exports = router;
