const mongoose = require('mongoose');

const SemrushProjectDataSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'SemrushProject', required: true, index: true },
  snapshotDate: { type: Date, default: Date.now, index: true },
  
  data: {
    overview: { type: mongoose.Schema.Types.Mixed },
    backlinks: { type: mongoose.Schema.Types.Mixed },
    siteHealth: { type: mongoose.Schema.Types.Mixed },
    keywords: { type: mongoose.Schema.Types.Mixed }
  }
}, { timestamps: true });

module.exports = mongoose.model('SemrushProjectData', SemrushProjectDataSchema, 'semrush_project_data');
