const { AppError } = require('./error');

// TEMPORARY stand-in for real login (issue #2, Vallabha).
// Reads a user id straight from a header instead of checking a real session.
// Delete this file once real auth is merged, and swap it out everywhere it's used.
function devAuth(req, res, next) {
  const userId = req.header('x-user-id');

  if (!userId) {
    return next(new AppError('Missing x-user-id header (dev auth stub)', 401, 'UNAUTHORIZED'));
  }

  req.user = { id: Number(userId) };
  next();
}

module.exports = { devAuth };