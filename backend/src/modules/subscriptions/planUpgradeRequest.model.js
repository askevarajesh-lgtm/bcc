const mongoose = require('mongoose');

const PlanUpgradeRequestSchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  currentPlan: {
    type: String,
    required: true
  },
  requestedModules: [{
    type: String
  }],
  remarks: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('PlanUpgradeRequest', PlanUpgradeRequestSchema);
