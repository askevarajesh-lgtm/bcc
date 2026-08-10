const mongoose = require('mongoose');

const WordPressConnectionSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', default: null },
  brandId: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null },
  name: { type: String, required: true, trim: true },
  websiteUrl: { type: String, required: true, trim: true },
  apiUrl: { type: String, required: true, trim: true },
  authType: { type: String, enum: ['application_password'], default: 'application_password', required: true },
  username: { type: String, required: true },
  credentials: { type: String, required: true }, // Encrypted application password
  status: { type: String, enum: ['Connected', 'Error', 'Pending'], default: 'Connected', required: true },
  lastConnectionCheck: { type: Date, default: null },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

WordPressConnectionSchema.index({ workspaceId: 1, name: 1 });

module.exports = mongoose.model('WordPressConnection', WordPressConnectionSchema);
