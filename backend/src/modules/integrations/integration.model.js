const mongoose = require('mongoose');

const IntegrationSchema = new mongoose.Schema({
  category: { type: String, required: true },
  integrationId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  status: { type: Boolean, default: false },
  icon: { type: String },
  color: { type: String },
  bg: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Integration', IntegrationSchema);
