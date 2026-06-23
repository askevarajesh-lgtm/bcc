const mongoose = require('mongoose');

const AgencySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  logo: { type: String, default: null },
  domain: { type: String, default: null }, // Optional custom domain
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'AgencyPackage' },
  status: { type: String, enum: ['active', 'suspended', 'trial', 'churned'], default: 'active' },
  allowedUsers: { type: Number, default: 5 },
  mrr: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Agency', AgencySchema);
