const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  websiteId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Optional linked website
  storeId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Optional linked store
  description: { type: String, default: "" },
  postsPerPage: { type: Number, default: 12, required: true },
  status: { type: String, enum: ['active', 'draft'], default: 'active', required: true },
  isDeleted: { type: Boolean, default: false, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId },
  updatedBy: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

BlogSchema.index({ workspaceId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Blog', BlogSchema);
