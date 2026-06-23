const mongoose = require('mongoose');

const AgencyPackageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: String, default: '' },
  description: { type: String, default: '' },
  features: [{ type: String }],
  active: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('AgencyPackage', AgencyPackageSchema);
