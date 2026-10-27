const router = require('express').Router();
const controller = require('./course.controller');
const { courseIdValidation, courseBodyValidation } = require('./course.validation');
const { protect } = require('../../middleware/auth');
const validate = require('../../middleware/validate');

router.route('/')
  .get(controller.getCourses)
  .post(protect, courseBodyValidation, validate, controller.createCourse);

router.route('/:id')
  .get(courseIdValidation, validate, controller.getCourse)
  .put(protect, courseIdValidation, courseBodyValidation, validate, controller.updateCourse)
  .delete(protect, courseIdValidation, validate, controller.deleteCourse);

module.exports = router;
