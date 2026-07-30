const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },

  images: {
    type: [{
      url: { type: String, required: true },
      altText: { type: String, default: '' },
      _id: false
    }],
    default: []
  },

  // Additive — ContentAI Product Writer (content-ai-platform-architecture.md §8).
  description: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  features: { type: [String], default: [] },
  specifications: {
    type: [{ label: String, value: String, _id: false }],
    default: []
  },
  sizeGuide: { type: String, default: '' },
  comparisonPoints: {
    type: [{ competitor: String, advantage: String, _id: false }],
    default: []
  },
  faqs: {
    type: [{ question: String, answer: String, _id: false }],
    default: []
  },
  metaTitle: { type: String, default: '' },
  metaDescription: { type: String, default: '' },
  ogTitle: { type: String, default: '' },
  ogDescription: { type: String, default: '' },
  schemaMarkup: { type: mongoose.Schema.Types.Mixed, default: null },

  isDeleted: { type: Boolean, default: false, required: true }
}, { timestamps: true });

ProductSchema.index({ storeId: 1, name: 1 });

module.exports = mongoose.model('Product', ProductSchema);
