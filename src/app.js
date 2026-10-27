const express = require('express');
const cors = require('cors');
const { env } = require('./config/env');
const authRoutes = require('./modules/auth/auth.routes');
const categoryRoutes = require('./modules/categories/category.routes');
const courseRoutes = require('./modules/courses/course.routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();
app.disable('x-powered-by');
app.use(cors({
  origin: env.corsOrigin === '*'
    ? '*'
    : env.corsOrigin.split(',').map((origin) => origin.trim()).filter(Boolean),
  // Continue preflight requests so they use the JSON response envelope, too.
  preflightContinue: true,
}));
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true, message: 'Preflight successful', data: null });
  }
  return next();
});
app.use(express.json({ limit: '100kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/courses', courseRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
