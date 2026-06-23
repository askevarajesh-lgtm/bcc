const mongoose = require('mongoose');

const BrandSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  logo: { type: String, default: null },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', default: null }, // Null for Direct Brands
  isDirect: { type: Boolean, default: false }, // True if owned directly by M1 MOS
  packageName: { type: String, default: null },
  features: [{ type: String }],
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Brand', BrandSchema);
