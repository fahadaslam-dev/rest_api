const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.path}`));
}

// Four arguments are required for Express to recognize error middleware.
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let statusCode = err instanceof ApiError ? err.statusCode : 500;
  let message = err instanceof ApiError ? err.message : 'Internal server error';
  let errors = err instanceof ApiError ? err.errors : undefined;

  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    message = `${field} already exists`;
    errors = [{ field, message }];
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((error) => ({
      field: error.path, message: error.message,
    }));
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier or field value';
    errors = [{ field: err.path, message }];
  } else if (err.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Invalid JSON request body';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body exceeds the 100 KB limit';
  } else if (err.status >= 400 && err.status < 500 && !(err instanceof ApiError)) {
    statusCode = err.status;
    message = 'Invalid request';
  }

  if (statusCode >= 500) {
    console.error('Request failed:', err);
    message = 'Internal server error';
    errors = undefined;
  }

  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    ...(errors ? { errors } : {}),
  });
}

module.exports = { notFound, errorHandler };
