const mongoose = require('mongoose');

const PageSchema = new mongoose.Schema({
  websiteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Website', required: true, index: true },
  title: { type: String, required: true, trim: true },
  path: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft', required: true },
  isHome: { type: Boolean, default: false, required: true },
  layoutJson: { type: mongoose.Schema.Types.Mixed, default: {} },
  html: { type: String, default: "" },
  css: { type: String, default: "" },
  isDeleted: { type: Boolean, default: false, required: true }
}, { timestamps: true });

PageSchema.index({ websiteId: 1, path: 1 }, { unique: true });

module.exports = mongoose.model('Page', PageSchema);
