const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../modules/auth/auth.model');
const { env } = require('../config/env');
const ApiError = require('../utils/ApiError');

async function protect(req, res, next) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.get('Authorization') || '');
  if (!match) throw new ApiError(401, 'Authentication required: provide a Bearer token');

  let decoded;
  try {
    decoded = jwt.verify(match[1], env.jwtSecret, {
      algorithms: ['HS256'],
      issuer: 'modular-mvc-api',
      audience: 'modular-mvc-client',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token expired; please log in again');
    }
    if (['JsonWebTokenError', 'NotBeforeError'].includes(error.name)) {
      throw new ApiError(401, 'Invalid authentication token');
    }
    throw error;
  }

  if (!decoded || typeof decoded !== 'object' ||
      !mongoose.isObjectIdOrHexString(decoded.sub) ||
      !Number.isFinite(decoded.exp)) {
    throw new ApiError(401, 'Invalid authentication token');
  }
  // Lookup is outside the JWT catch: database failures remain server errors.
  const user = await User.findById(decoded.sub);
  if (!user) throw new ApiError(401, 'User no longer exists');
  req.user = user;
  return next();
}

module.exports = { protect };
