const mongoose = require('mongoose');

const WorkspaceAeoAuditSimulationSchema = new mongoose.Schema({
  auditId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceAeoAudit', required: true, index: true },
  pageUrl: { type: String, required: true },
  
  platform: { 
    type: String, 
    enum: ['ChatGPT', 'Google AI Overviews', 'Gemini', 'Perplexity', 'Copilot'],
    required: true
  },
  
  citationLikelihood: { type: Number, min: 0, max: 100, default: null }, // Percentage
  confidenceScore: { type: Number, min: 0, max: 100, default: null },
  
  simulation: {
    bestCandidateParagraph: { type: String, default: '' },
    missingInformation: [{ type: String }],
    reasons: [{ type: String }],
    suggestedImprovements: [{ type: String }]
  }
}, { timestamps: true });

WorkspaceAeoAuditSimulationSchema.index({ auditId: 1, pageUrl: 1, platform: 1 }, { unique: true });

module.exports = mongoose.model('WorkspaceAeoAuditSimulation', WorkspaceAeoAuditSimulationSchema, 'workspace_aeo_audit_simulations');
