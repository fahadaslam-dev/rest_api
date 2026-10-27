const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 10000, default: '' },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
  price: { type: Number, required: true, min: 0 },
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  duration: { type: String, trim: true, maxlength: 100, default: '' },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Course', courseSchema);
