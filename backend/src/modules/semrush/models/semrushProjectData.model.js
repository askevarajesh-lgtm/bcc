const mongoose = require('mongoose');

const semrushProjectDataSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SemrushProject',
    required: true,
    index: true
  },
  snapshotDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

module.exports = mongoose.model('SemrushProjectData', semrushProjectDataSchema);
