const { body, param } = require('express-validator');

const categoryIdValidation = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId'),
];

// PUT requires name; description is optional on both POST and PUT.
const categoryBodyValidation = [
  body('name').exists().withMessage('name is required').bail()
    .isString().withMessage('name must be a string').bail()
    .trim().notEmpty().withMessage('name is required').bail()
    .isLength({ max: 100 }).withMessage('name must be at most 100 characters'),
  body('description').optional().isString().withMessage('description must be a string')
    .bail().trim().isLength({ max: 2000 })
    .withMessage('description must be at most 2000 characters'),
];

module.exports = { categoryIdValidation, categoryBodyValidation };
