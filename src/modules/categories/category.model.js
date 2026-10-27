const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, versionKey: false });

module.exports = mongoose.model('Category', categorySchema);
