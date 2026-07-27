const mongoose = require('mongoose');

/**
 * AI Core — Execution Log
 *
 * Deliberately separate from `seoWorkspace/models/workspaceAuditLog.model.js`
 * (`workspace_audit_logs`), for the same reason called out in
 * `seo-mongodb-schema-plan.md` §1: that collection records *user actions* on
 * *content objects* (polymorphic targetType/targetId). This collection
 * records *execution telemetry* for anything routed through AI Core — a
 * different write pattern (time-ordered per executionId), a different read
 * pattern (operational debugging / cost-tracking, not user-facing history),
 * and it is module-agnostic (not SEO-specific), so any future AI Core
 * consumer beyond seoWorkspace can write to it without a new collection.
 *
 * Collection name is `ai_execution_logs` rather than the `seo_execution_history`
 * name proposed in the schema doc, specifically because AI Core is designed to
 * be reusable beyond the SEO Workspace module. If/when `seo_execution_history`
 * is approved as its own collection, this model can be pointed at it instead —
 * only the third argument to mongoose.model() below would need to change.
 */
const executionLogSchema = new mongoose.Schema({
  executionId: {
    type: String,
    required: true,
    index: true
  },
  source: {
    type: String,
    required: true // e.g. 'aiEngine', 'executionQueue', 'taskQueue', 'agentLoader'
  },
  agentKey: {
    type: String,
    default: null // data reference only (e.g. 'seo-strategist') — no agent logic lives here
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkspaceProject',
    default: null
  },
  status: {
    type: String,
    enum: ['started', 'succeeded', 'failed', 'retrying'],
    required: true
  },
  durationMs: {
    type: Number,
    default: null
  },
  meta: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  error: {
    type: String,
    default: null
  }
}, { timestamps: true });

executionLogSchema.index({ executionId: 1, createdAt: 1 });
executionLogSchema.index({ projectId: 1, createdAt: -1 });

module.exports = mongoose.model('AiExecutionLog', executionLogSchema, 'ai_execution_logs');
