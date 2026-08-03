const mongoose = require('mongoose');

const AgencyPackageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: String, default: '' },
  description: { type: String, default: '' },
  features: [{ type: String }],
  users: { type: Number },
  clients: { type: Number },
  active: { type: Number, default: 0 },
  billingInterval: { type: String, enum: ['Monthly', 'Yearly', 'One Time'], default: 'Monthly' }
}, { timestamps: true });

module.exports = mongoose.model('AgencyPackage', AgencyPackageSchema);
