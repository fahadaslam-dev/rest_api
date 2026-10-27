const User = require('./auth.model');
const signToken = require('../../utils/token');
const sendResponse = require('../../utils/response');
const ApiError = require('../../utils/ApiError');

async function register(req, res) {
  const { name, email, password } = req.validated;
  if (await User.exists({ email })) throw new ApiError(400, 'email already exists');

  // Role is assigned by the server, never taken from the registration payload.
  const user = await User.create({ name, email, password, role: 'user' });
  return sendResponse(res, 201, 'Registration successful', {
    user: user.toJSON(), token: signToken(user._id),
  });
}

async function login(req, res) {
  const { email, password } = req.validated;
  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  return sendResponse(res, 200, 'Login successful', {
    user: user.toJSON(), token: signToken(user._id),
  });
}

module.exports = { register, login };
