const { body } = require('express-validator');

const emailField = () => body('email')
  .exists().withMessage('email is required').bail()
  .isString().withMessage('email must be a string').bail()
  .trim().isEmail().withMessage('email must be valid').bail()
  .isLength({ max: 254 }).withMessage('email must be at most 254 characters')
  .toLowerCase();

// bcrypt uses at most 72 UTF-8 bytes; reject longer input instead of truncating.
const passwordField = (minimum) => body('password')
  .exists().withMessage('password is required').bail()
  .isString().withMessage('password must be a string').bail()
  .isLength({ min: minimum }).withMessage(`password must contain at least ${minimum} characters`)
  .bail().custom((value) => Buffer.byteLength(value, 'utf8') <= 72)
  .withMessage('password must be at most 72 UTF-8 bytes');

const registerValidation = [
  body('name').exists().withMessage('name is required').bail()
    .isString().withMessage('name must be a string').bail()
    .trim().notEmpty().withMessage('name is required').bail()
    .isLength({ max: 100 }).withMessage('name must be at most 100 characters'),
  emailField(),
  passwordField(8),
];

const loginValidation = [emailField(), passwordField(1)];

module.exports = { registerValidation, loginValidation };
