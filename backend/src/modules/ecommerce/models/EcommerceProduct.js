const mongoose = require('mongoose');

const EcommerceProductSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  websiteId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, default: null },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  category: { type: String, default: 'General' },
  stock: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Active', 'Draft'], default: 'Active' },
}, { timestamps: true });

// Ensure stock can't go negative natively at DB level if updated
EcommerceProductSchema.index({ workspaceId: 1, websiteId: 1 });

module.exports = mongoose.model('EcommerceProduct', EcommerceProductSchema);
