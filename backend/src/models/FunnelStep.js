const mongoose = require('mongoose');

const FunnelStepSchema = new mongoose.Schema({
  funnelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Funnel', required: true, index: true },
  name: { type: String, required: true, trim: true },
  type: { type: String, default: 'landing', required: true },
  path: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Draft', 'Active'], default: 'Draft', required: true },
  order: { type: Number, default: 0, required: true },
  layoutJson: { type: mongoose.Schema.Types.Mixed, default: {} },
  isDeleted: { type: Boolean, default: false, required: true }
}, { timestamps: true });

FunnelStepSchema.index({ funnelId: 1, path: 1 }, { unique: true });
FunnelStepSchema.index({ funnelId: 1, order: 1 });

module.exports = mongoose.model('FunnelStep', FunnelStepSchema);
