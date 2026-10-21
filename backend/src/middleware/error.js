class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Standard error response middleware
 * Produces unified JSON shape: { error: { code, message, details, timestamp } }
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const response = {
    error: {
      code: err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST'),
      message: err.message || 'An unexpected error occurred',
      timestamp: new Date().toISOString()
    }
  };

  if (err.details) {
    response.error.details = err.details;
  }

  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    response.error.stack = err.stack;
  }

  if (statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json(response);
}

module.exports = {
  AppError,
  errorHandler
};
