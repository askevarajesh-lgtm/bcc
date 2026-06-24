const mongoose = require('mongoose');

const BlogCategorySchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  isDeleted: { type: Boolean, default: false, required: true }
}, { timestamps: true });

BlogCategorySchema.index({ blogId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('BlogCategory', BlogCategorySchema);
