const mongoose = require('mongoose');

const DiscountSchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true, index: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  type: { type: String, enum: ['Percent', 'Fixed'], default: 'Percent', required: true },
  value: { type: String, required: true },
  uses: { type: Number, default: 0, required: true },
  active: { type: String, enum: ['Yes', 'No'], default: 'Yes', required: true },
  isDeleted: { type: Boolean, default: false, required: true }
}, { timestamps: true });

DiscountSchema.index({ storeId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Discount', DiscountSchema);
