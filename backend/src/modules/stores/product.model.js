const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  images: [{ type: String }],
  isDeleted: { type: Boolean, default: false, required: true }
}, { timestamps: true });

ProductSchema.index({ storeId: 1, name: 1 });

module.exports = mongoose.model('Product', ProductSchema);
