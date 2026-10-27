const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

function validateEnv() {
  if (!['development', 'test', 'production'].includes(env.nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }
  if (!Number.isInteger(env.port) || env.port < 1 || env.port > 65535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }
  if (!env.mongoUri || !/^mongodb(?:\+srv)?:\/\//.test(env.mongoUri)) {
    throw new Error('MONGO_URI must be a MongoDB connection string');
  }
  if (!env.jwtSecret || Buffer.byteLength(env.jwtSecret, 'utf8') < 32 ||
      env.jwtSecret === 'replace_this_with_a_random_secret') {
    throw new Error('Set JWT_SECRET to a random secret of at least 32 bytes');
  }
  if (!/^[1-9]\d*[smhd]$/.test(env.jwtExpiresIn)) {
    throw new Error('JWT_EXPIRES_IN must include a unit, for example 30m, 12h, or 7d');
  }
}

module.exports = { env, validateEnv };
