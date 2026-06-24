const mongoose = require('mongoose');

const BlogPostSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true, index: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  content: { type: String, default: "" },
  status: { type: String, enum: ['draft', 'published'], default: 'draft', required: true },
  categories: [{ type: String }],
  websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', default: null },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', default: null },
  excerpt: { type: String, default: "" },
  metaTitle: { type: String, default: "" },
  metaDescription: { type: String, default: "" },
  isFeatured: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false, required: true }
}, { timestamps: true });

BlogPostSchema.index({ blogId: 1, slug: 1 }, { unique: true });
BlogPostSchema.index({ blogId: 1, status: 1 });

module.exports = mongoose.model('BlogPost', BlogPostSchema);
