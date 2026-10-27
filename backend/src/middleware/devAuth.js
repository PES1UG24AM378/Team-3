const { AppError } = require('./error');

// TEMPORARY stand-in for real login (issue #2, Vallabha).
// Reads a user id straight from a header instead of checking a real session.
// Delete this file once real auth is merged, and swap it out everywhere it's used.
function devAuth(req, res, next) {
  // First check standard Authorization Bearer header if provided
  const authHeader = req.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace(/^Bearer\s+/i, '');
    try {
      const { verifyToken } = require('./auth');
      const payload = verifyToken(token);
      req.user = { id: Number(payload.sub), role: payload.role || 'tutor' };
      return next();
    } catch {
      // Fall through to x-user-id check
    }
  }

  const userId = req.header('x-user-id');
  if (!userId) {
    return next(new AppError('Missing authentication (Bearer token or x-user-id header)', 401, 'UNAUTHORIZED'));
  }

  req.user = { id: Number(userId), role: 'tutor' };
  next();
}

module.exports = { devAuth };