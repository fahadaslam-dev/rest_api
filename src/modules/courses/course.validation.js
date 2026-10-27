const { body, param } = require('express-validator');

const courseIdValidation = [
  param('id').isMongoId().withMessage('id must be a valid MongoDB ObjectId'),
];

// Required fields are required on PUT as well as POST.
const courseBodyValidation = [
  body('title').exists().withMessage('title is required').bail()
    .isString().withMessage('title must be a string').bail()
    .trim().notEmpty().withMessage('title is required').bail()
    .isLength({ max: 200 }).withMessage('title must be at most 200 characters'),
  body('category').exists().withMessage('category is required').bail()
    .isString().withMessage('category must be a string').bail()
    .isMongoId().withMessage('category must be a valid MongoDB ObjectId'),
  body('price').exists().withMessage('price is required').bail()
    .custom((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0)
    .withMessage('price must be a finite non-negative JSON number'),
  body('description').optional().isString().withMessage('description must be a string')
    .bail().trim().isLength({ max: 10000 })
    .withMessage('description must be at most 10000 characters'),
  body('duration').optional().isString().withMessage('duration must be a string')
    .bail().trim().isLength({ max: 100 })
    .withMessage('duration must be at most 100 characters'),
];

module.exports = { courseIdValidation, courseBodyValidation };
