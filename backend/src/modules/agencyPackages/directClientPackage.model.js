const mongoose = require('mongoose');

const DirectClientPackageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  price: { type: String, default: '' },
  userCount: { type: Number, default: 5 },
  features: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('DirectClientPackage', DirectClientPackageSchema);
