const mongoose = require('mongoose');

const SeoBacklinkSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'SeoProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  targetUrl: { type: String, required: true },
  sourceUrl: { type: String, required: true },
  
  domainAuthority: { type: Number, default: 0 },
  pageAuthority: { type: Number, default: 0 },
  
  anchorText: { type: String, default: null },
  isDofollow: { type: Boolean, default: true },
  
  isLost: { type: Boolean, default: false },
  isToxic: { type: Boolean, default: false },

  dateDiscovered: { type: Date, default: Date.now },
  dateLost: { type: Date, default: null },
}, { timestamps: true });

SeoBacklinkSchema.index({ projectId: 1, sourceUrl: 1 }, { unique: true });

module.exports = mongoose.model('SeoBacklink', SeoBacklinkSchema);
