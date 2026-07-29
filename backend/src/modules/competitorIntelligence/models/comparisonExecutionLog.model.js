const mongoose = require('mongoose');

/**
 * ComparisonExecutionLog — AI SEO Platform v2 §4.
 *
 * `WorkspaceAuditLog` is a generic before/after value log (comments,
 * attachments, field changes) — not shaped for run metadata, so this is a
 * genuinely new model. It mirrors `auditLog.service.js`'s fire-and-forget
 * write convention (see `comparisonEngine.service.js`) and is the single
 * row of truth every comparison run updates through its lifecycle — it
 * also feeds the Execution Queue (§7 — `workspaceCron.service.js` polls
 * `status: 'queued'` rows here) and the Rate Limit Manager's credit
 * tracking (§6 — `ProviderQuota.creditsUsed` increments off this on
 * completion), so there's one row per run, not three.
 */
const ComparisonExecutionLogSchema = new mongoose.Schema({
  comparisonId: { type: String, required: true, index: true }, // groups multi-domain runs; not a Mongo _id ref
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  providerId: { type: String, default: null }, // which adapter actually served it

  domains: [{ type: String }],

  type: {
    type: String,
    enum: ['keyword_gap', 'content_gap', 'backlink_gap', 'page_gap', 'overview'],
    required: true
  },

  creditsUsed: { type: Number, default: 0 }, // from the provider's response metadata, where available
  durationMs: { type: Number, default: null },

  status: {
    type: String,
    enum: ['queued', 'running', 'completed', 'failed'],
    default: 'queued',
    index: true
  },

  // Retry/backoff bookkeeping (§6 Rate Limit Manager reads/writes these).
  retryCount: { type: Number, default: 0 },
  retryAfter: { type: Date, default: null },

  resultSummary: { type: mongoose.Schema.Types.Mixed, default: null }, // ComparisonResult.summary, denormalized for fast history views
  error: { type: String, default: null }
}, { timestamps: true });

ComparisonExecutionLogSchema.index({ status: 1, retryAfter: 1 }); // Execution Queue's polling query (§7)
ComparisonExecutionLogSchema.index({ projectId: 1, createdAt: -1 }); // history views

module.exports = mongoose.model('ComparisonExecutionLog', ComparisonExecutionLogSchema, 'comparison_execution_logs');
