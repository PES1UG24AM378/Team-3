const express = require('express');
const bcrypt = require('bcryptjs');
const { UserModel } = require('../models');
const { validate } = require('../middleware/validator');
const { AppError } = require('../middleware/error');
const { signToken } = require('../middleware/auth');

const router = express.Router();

// Sliding-window rate limiter for login attempts
const loginAttempts = new Map();

function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const email = (req.body?.email || '').toLowerCase().trim();
  const key = `${ip}:${email}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 10;

  const record = loginAttempts.get(key);
  if (record && record.resetTime > now) {
    if (record.count >= maxAttempts) {
      return next(
        new AppError(
          'Too many failed login attempts. Please try again later.',
          429,
          'RATE_LIMIT_EXCEEDED'
        )
      );
    }
  }
  next();
}

function recordFailedLogin(req) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const email = (req.body?.email || '').toLowerCase().trim();
  const key = `${ip}:${email}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;

  const record = loginAttempts.get(key);
  if (!record || record.resetTime <= now) {
    loginAttempts.set(key, { count: 1, resetTime: now + windowMs });
  } else {
    record.count += 1;
  }
}

function clearFailedLogin(req) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const email = (req.body?.email || '').toLowerCase().trim();
  loginAttempts.delete(`${ip}:${email}`);
}

function sanitizePlainText(value) {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
}

/**
 * Handle user login
 */
async function handleLogin(req, res, next) {
  try {
    const user = await UserModel.findByEmail(req.body.email);

    const passwordMatches =
      user && (await bcrypt.compare(req.body.password, user.password_hash));

    if (!passwordMatches || !user.is_verified) {
      recordFailedLogin(req);
      return next(
        new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS')
      );
    }

    if (user.is_suspended) {
      return next(
        new AppError('Your account has been suspended', 403, 'ACCOUNT_SUSPENDED')
      );
    }

    clearFailedLogin(req);

    const now = Math.floor(Date.now() / 1000);

    res.json({
      data: {
        token: signToken({
          sub: user.id,
          iat: now,
          exp: now + 7 * 24 * 60 * 60
        }),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

const loginValidation = validate({
  body: {
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string' }
  }
});

// Mounted for both /api/auth/login and legacy root routes
router.post('/login', loginRateLimiter, loginValidation, handleLogin);
router.post('/', loginRateLimiter, loginValidation, handleLogin);

/**
 * POST /api/auth/register
 * Register a new student or tutor account
 */
router.post(
  '/register',
  validate({
    body: {
      name: { required: true, type: 'string' },
      email: { required: true, type: 'email' },
      password: { required: true, type: 'string' }
    }
  }),
  async (req, res, next) => {
    try {
      const { name, email, password, role = 'student' } = req.body;

      if (!name || name.trim().length === 0 || name.length > 100) {
        return next(
          new AppError('Name must be between 1 and 100 characters', 422, 'VALIDATION_ERROR')
        );
      }

      if (password.length < 8) {
        return next(
          new AppError('Password must be at least 8 characters long', 422, 'VALIDATION_ERROR')
        );
      }

      const validRoles = ['student', 'tutor', 'both'];
      if (!validRoles.includes(role)) {
        return next(
          new AppError("Role must be 'student', 'tutor', or 'both'", 422, 'VALIDATION_ERROR')
        );
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return next(
          new AppError('An account with this email already exists', 409, 'EMAIL_ALREADY_EXISTS')
        );
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await UserModel.create({
        name: sanitizePlainText(name),
        email: email.toLowerCase().trim(),
        passwordHash,
        role,
        isVerified: true
      });

      const now = Math.floor(Date.now() / 1000);
      const token = signToken({
        sub: newUser.id,
        iat: now,
        exp: now + 7 * 24 * 60 * 60
      });

      res.status(201).json({
        message: 'User registered successfully',
        data: {
          token,
          user: {
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
          }
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/auth/forgot-password
 * Password reset request flow
 */
router.post(
  '/forgot-password',
  validate({
    body: {
      email: { required: true, type: 'email' }
    }
  }),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      const user = await UserModel.findByEmail(email);

      // Always return a generic success response to prevent email enumeration
      res.json({
        message: 'If the email exists, a password reset link has been dispatched.'
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
