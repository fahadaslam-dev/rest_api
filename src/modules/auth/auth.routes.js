const router = require('express').Router();
const controller = require('./auth.controller');
const { registerValidation, loginValidation } = require('./auth.validation');
const validate = require('../../middleware/validate');

router.post('/register', registerValidation, validate, controller.register);
router.post('/login', loginValidation, validate, controller.login);

module.exports = router;
