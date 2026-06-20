const mongoose = require('mongoose');

const FunnelSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Draft', 'Active'], default: 'Draft', required: true },
  faviconUrl: { type: String, default: "" },
  trackingPixels: {
    metaPixelId: { type: String, default: "" },
    ga4Id: { type: String, default: "" },
    customHeadCode: { type: String, default: "" }
  },
  domainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Domain', default: null },
  isDeleted: { type: Boolean, default: false, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId },
  updatedBy: { type: mongoose.Schema.Types.ObjectId }
}, { timestamps: true });

FunnelSchema.index({ workspaceId: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Funnel', FunnelSchema);
