const jwt = require('jsonwebtoken');
const { env } = require('../config/env');

function signToken(userId) {
  return jwt.sign({}, env.jwtSecret, {
    subject: userId.toString(),
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
    issuer: 'modular-mvc-api',
    audience: 'modular-mvc-client',
  });
}

module.exports = signToken;
