const router = require('express').Router();
const controller = require('./category.controller');
const { categoryIdValidation, categoryBodyValidation } = require('./category.validation');
const { protect } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

router.route('/')
  .get(controller.getCategories)
  .post(protect, categoryBodyValidation, validate, controller.createCategory);

router.route('/:id')
  .get(categoryIdValidation, validate, controller.getCategory)
  .put(protect, categoryIdValidation, categoryBodyValidation, validate, controller.updateCategory)
  .delete(protect, categoryIdValidation, validate, controller.deleteCategory);

module.exports = router;
