const crypto = require('crypto');
const config = require('../config');
const { AppError } = require('./error');
const { UserModel } = require('../models');

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function signToken(payload) {
  const encodedPayload = base64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', config.jwt.secret)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function verifyToken(token) {
  const [encodedPayload, signature] = String(token).split('.');
  if (!encodedPayload || !signature) throw new Error('Malformed token');
  const expected = crypto.createHmac('sha256', config.jwt.secret).update(encodedPayload).digest('base64url');
  if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    throw new Error('Invalid token signature');
  }
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
  if (!payload.sub || payload.exp <= Math.floor(Date.now() / 1000)) throw new Error('Expired token');
  return payload;
}

async function authenticate(req, res, next) {
  try {
    const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) throw new Error('Missing bearer token');
    const payload = verifyToken(token);
    const user = await UserModel.findById(Number(payload.sub));
    if (!user || !user.is_verified) throw new Error('User is not verified');
    req.user = user;
    next();
  } catch {
    next(new AppError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
  }
}

module.exports = { authenticate, signToken, verifyToken };
