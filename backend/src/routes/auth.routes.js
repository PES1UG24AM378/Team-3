const express = require('express');
const bcrypt = require('bcryptjs');
const { UserModel } = require('../models');
const { validate } = require('../middleware/validator');
const { AppError } = require('../middleware/error');
const { signToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', validate({
  body: {
    email: { required: true, type: 'email' },
    password: { required: true, type: 'string' }
  }
}), async (req, res, next) => {
  try {
    const user = await UserModel.findByEmail(req.body.email);
    const passwordMatches = user && await bcrypt.compare(req.body.password, user.password_hash);
    if (!passwordMatches || !user.is_verified) {
      return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
    }
    const now = Math.floor(Date.now() / 1000);
    res.json({
      data: {
        token: signToken({ sub: user.id, iat: now, exp: now + 7 * 24 * 60 * 60 }),
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
