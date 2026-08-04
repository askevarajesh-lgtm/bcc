const mongoose = require('mongoose');

const semrushSyncLogSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: false,
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SemrushProject',
    index: true,
    default: null
  },
  endpoint: {
    type: String,
    required: true
  },
  queryKey: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['success', 'error'],
    required: true
  },
  errorMessage: {
    type: String,
    default: null
  },
  creditsUsed: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('SemrushSyncLog', semrushSyncLogSchema);
