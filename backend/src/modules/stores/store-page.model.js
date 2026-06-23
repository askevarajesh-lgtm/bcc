const mongoose = require('mongoose');

const StorePageSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  pageName: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  type: { type: String, enum: ['Store home', 'Catalog', 'Cart', 'Checkout', 'Blog', 'Custom'], required: true },
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft', required: true },
  layoutJson: { type: mongoose.Schema.Types.Mixed, default: {} },
  isDeleted: { type: Boolean, default: false, required: true }
}, { timestamps: true });

StorePageSchema.index({ storeId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('StorePage', StorePageSchema);
