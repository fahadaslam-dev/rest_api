const Category = require('./category.model');
const Course = require('../courses/course.model');
const ApiError = require('../../utils/ApiError');
const sendResponse = require('../../utils/response');

async function createCategory(req, res) {
  const category = await Category.create({ ...req.validated, createdBy: req.user._id });
  return sendResponse(res, 201, 'Category created', category);
}

async function getCategories(req, res) {
  const categories = await Category.find().sort({ createdAt: -1 });
  return sendResponse(res, 200, 'Categories retrieved', categories);
}

async function getCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  return sendResponse(res, 200, 'Category retrieved', category);
}

async function updateCategory(req, res) {
  const category = await Category.findByIdAndUpdate(
    req.params.id, { $set: req.validated }, { new: true, runValidators: true },
  );
  if (!category) throw new ApiError(404, 'Category not found');
  return sendResponse(res, 200, 'Category updated', category);
}

async function deleteCategory(req, res) {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found');
  if (await Course.exists({ category: category._id })) {
    throw new ApiError(400, 'Category is in use; delete or reassign its courses first');
  }
  await category.deleteOne();
  return sendResponse(res, 200, 'Category deleted');
}

module.exports = { createCategory, getCategories, getCategory, updateCategory, deleteCategory };
