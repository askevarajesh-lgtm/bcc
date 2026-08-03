const mongoose = require('mongoose');

const WorkspaceMonitoringSettingsSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, unique: true, index: true },
  
  // Health Score calculation weights
  healthWeights: {
    technicalSeo: { type: Number, default: 20 },
    performance: { type: Number, default: 20 }, // CWV
    indexability: { type: Number, default: 15 },
    traffic: { type: Number, default: 15 },
    ranking: { type: Number, default: 20 },
    alerts: { type: Number, default: 10 } // Deduction based on open alerts
  },
  
  // Scan frequencies
  scanFrequency: {
    health: { type: String, enum: ['hourly', 'daily', 'weekly', 'manual'], default: 'daily' },
    keywords: { type: String, enum: ['hourly', 'daily', 'weekly', 'manual'], default: 'daily' },
    traffic: { type: String, enum: ['hourly', 'daily', 'weekly', 'manual'], default: 'daily' },
    competitors: { type: String, enum: ['hourly', 'daily', 'weekly', 'manual'], default: 'weekly' }
  },
  
  // Alert thresholds
  alertThresholds: {
    rankDrop: { type: Number, default: 3 }, // positions
    trafficDropPercent: { type: Number, default: 15 }, // % drop
    uptimeDropPercent: { type: Number, default: 99.0 },
    cwvFailures: { type: Number, default: 2 } // Number of metrics failing
  }
  
}, { timestamps: true });

module.exports = mongoose.model('WorkspaceMonitoringSettings', WorkspaceMonitoringSettingsSchema, 'workspace_monitoring_settings');
