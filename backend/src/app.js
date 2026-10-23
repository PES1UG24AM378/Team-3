const express = require('express');
const cors = require('cors');
const config = require('./config');
const { errorHandler, AppError } = require('./middleware/error');

const healthRoutes = require('./routes/health.routes');
const slotRoutes = require('./routes/slot.routes');
const bookingRoutes = require('./routes/booking.routes');

const profileRoutes = require('./routes/profile.routes');
const authRoutes = require('./routes/auth.routes');


const app = express();

// Request logging in development
if (config.env === 'development') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  });
}

// Security & Parsing Middleware
app.use(cors({
  origin: config.clientOrigin,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root health convenience endpoint
app.get('/health', (req, res) => res.redirect('/api/health'));

// Mount API Routes
app.use(`${config.apiPrefix}/health`, healthRoutes);
app.use(`${config.apiPrefix}/auth/login`, authRoutes);
app.use(`${config.apiPrefix}/slots`, slotRoutes);
app.use(`${config.apiPrefix}/bookings`, bookingRoutes);
app.use(`${config.apiPrefix}/profile`, profileRoutes);

// 404 Handler for undefined routes
app.use((req, res, next) => {
  next(new AppError(`Endpoint not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
});

// Central Error Handler
app.use(errorHandler);

module.exports = app;
