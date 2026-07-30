const mongoose = require('mongoose');

const StoreCollectionSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  active: { type: String, enum: ['Yes', 'No'], default: 'Yes', required: true },

  // Additive — ContentAI Category Writer (content-ai-platform-architecture.md §8).
  description: { type: String, default: '' },
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  ogTitle: { type: String, default: '' },
  ogDescription: { type: String, default: '' },
  schemaMarkup: { type: mongoose.Schema.Types.Mixed, default: null },

  isDeleted: { type: Boolean, default: false, required: true }
}, { timestamps: true });

StoreCollectionSchema.index({ storeId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('StoreCollection', StoreCollectionSchema);
