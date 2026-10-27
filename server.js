const mongoose = require('mongoose');
const { env, validateEnv } = require('./src/config/env');
const app = require('./src/app');
const connectDB = require('./src/config/db');

async function start() {
  validateEnv();
  await connectDB();
  const server = app.listen(env.port, () => {
    console.log(`API running on http://localhost:${env.port}`);
  });

  server.on('error', () => {
    console.error('HTTP server failed to start; check PORT and whether it is already in use');
    void mongoose.disconnect().finally(() => process.exit(1));
  });

  let shuttingDown = false;
  function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`${signal} received; closing server`);
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(() => {
      void mongoose.disconnect()
        .then(() => { clearTimeout(timeout); process.exit(0); })
        .catch(() => process.exit(1));
    });
  }
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch(async (error) => {
  // Avoid printing connection strings, which can contain database credentials.
  console.error('Startup failed. Check .env, MongoDB connectivity, and database permissions.');
  if (!['MongoServerSelectionError', 'MongoParseError', 'MongoServerError'].includes(error.name)) {
    console.error(error.message);
  }
  await mongoose.disconnect();
  process.exit(1);
});
