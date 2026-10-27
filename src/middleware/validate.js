const { validationResult, matchedData } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    // Omit submitted values so passwords never appear in validation responses.
    const errors = result.array({ onlyFirstError: true }).map((error) => ({
      field: error.path,
      message: error.msg,
      location: error.location,
    }));
    return next(new ApiError(400, 'Validation failed', errors));
  }
  // Controllers never persist arbitrary request body fields.
  req.validated = matchedData(req, { locations: ['body'] });
  return next();
}

module.exports = validate;
