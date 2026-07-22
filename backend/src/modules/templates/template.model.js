const mongoose = require('mongoose');

const TemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['website', 'store', 'funnel', 'form'], required: true },
  category: { type: String, default: 'General', trim: true },
  description: { type: String, default: '', trim: true },
  featuresCount: { type: Number, default: 1 },
  thumbnailColor: { type: String, default: 'var(--accent-primary)' },
  zipUrl: { type: String, default: '' },
  zipPublicId: { type: String, default: '' },
  isRealData: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false }
}, { timestamps: true });

TemplateSchema.index({ type: 1, category: 1 });

module.exports = mongoose.model('Template', TemplateSchema);