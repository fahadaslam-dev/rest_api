const Course = require('./course.model');
const Category = require('../categories/category.model');
const ApiError = require('../../utils/ApiError');
const sendResponse = require('../../utils/response');

async function requireCategory(categoryId) {
  if (!(await Category.exists({ _id: categoryId }))) {
    throw new ApiError(404, 'Category not found');
  }
}

async function createCourse(req, res) {
  await requireCategory(req.validated.category);
  const course = await Course.create({ ...req.validated, instructor: req.user._id });
  await course.populate('category', 'name description');
  return sendResponse(res, 201, 'Course created', course);
}

async function getCourses(req, res) {
  const courses = await Course.find().populate('category', 'name description')
    .sort({ createdAt: -1 });
  return sendResponse(res, 200, 'Courses retrieved', courses);
}

async function getCourse(req, res) {
  const course = await Course.findById(req.params.id).populate('category', 'name description');
  if (!course) throw new ApiError(404, 'Course not found');
  return sendResponse(res, 200, 'Course retrieved', course);
}

async function updateCourse(req, res) {
  const course = await Course.findById(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');
  await requireCategory(req.validated.category);
  Object.assign(course, req.validated);
  await course.save();
  await course.populate('category', 'name description');
  return sendResponse(res, 200, 'Course updated', course);
}

async function deleteCourse(req, res) {
  const course = await Course.findByIdAndDelete(req.params.id);
  if (!course) throw new ApiError(404, 'Course not found');
  return sendResponse(res, 200, 'Course deleted');
}

module.exports = { createCourse, getCourses, getCourse, updateCourse, deleteCourse };
