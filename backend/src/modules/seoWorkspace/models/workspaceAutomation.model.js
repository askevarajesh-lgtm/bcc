const mongoose = require('mongoose');

/**
 * Workspace Automation — the Automation Agent's own domain object.
 *
 * Formalizes what `workspaceCron.service.js` currently does as hardcoded,
 * un-inspectable logic (a single `settings.autopilot` boolean + one
 * hardcoded `drop >= 2` threshold + one hardcoded scheduled-report
 * due-check) into a proper rule set, exactly as designed in
 * `seo-mongodb-schema-plan.md` §2.3 (`seo_automation`). `settings.autopilot`/
 * `frequency` on WorkspaceProject are left untouched for backward
 * compatibility — this collection is additive, not a replacement.
 *
 * Named `WorkspaceAutomation` / `workspace_automations` rather than
 * `seo_automation`, matching every other model in this module today
 * (`workspace_projects`, `workspace_tasks`, `workspace_reports`, ...) — if/when
 * the documented `workspace_* -> seo_*` rename in seo-mongodb-schema-plan.md
 * §4 Phase B happens, only this file's third `mongoose.model()` argument
 * would need to change, per that doc's own low-risk rename pattern.
 *
 * Human approval gate: a newly created rule starts at `approvalStatus:
 * 'Pending Approval'` and the Automation Agent will never evaluate or act on
 * a rule that isn't `'Approved'` — approving a rule is how a human
 * authorizes the agent to act autonomously on that specific, scoped policy
 * going forward. This is a different (and appropriately higher) gate than
 * the per-artifact approval already used by the other agents (e.g.
 * WorkspaceTask.status), because a rule is a standing, recurring
 * authorization rather than a single one-off artifact — see
 * `automationAgent.service.js`'s header for how the two gates compose
 * (rule approval + the created WorkspaceTask's own Pending status, for the
 * create_task action specifically).
 */
const WorkspaceAutomationSchema = new mongoose.Schema({
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkspaceProject', required: true, index: true },
  agencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  name: { type: String, required: true },

  ruleType: {
    type: String,
    enum: ['rank_drop_alert', 'scheduled_report', 'content_freshness', 'backlink_loss', 'credential_health_check'],
    required: true
  },

  trigger: {
    metric: { type: String, default: null },
    operator: { type: String, enum: ['gt', 'gte', 'lt', 'lte', 'eq', null], default: null },
    value: { type: Number, default: null }
  },

  action: {
    type: {
      type: String,
      enum: ['create_task', 'send_report', 'send_notification', 'pause_autopilot'],
      required: true
    },
    config: { type: mongoose.Schema.Types.Mixed, default: {} }
  },

  // Reuses the exact same enum WorkspaceReport.scheduleFrequency already
  // uses — not a new vocabulary. For rule types other than
  // 'scheduled_report', this is the minimum re-check interval (so a
  // standing-true condition doesn't refire on every single agent run).
  frequency: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },

  // Plain string, checked against MarketplacePurchase.moduleName at
  // execution time — deliberately NOT an ObjectId ref, to avoid the
  // dangling-ref pattern flagged elsewhere in this codebase
  // (seo-mongodb-schema-plan.md §0/§2.3). Marketplace gating itself
  // (marketplaceGate.service.js) is a separate, not-yet-built piece per
  // marketplace-seo-platform-architecture.md — this field only stores the
  // requirement so that gate has somewhere to read from once it exists.
  marketplaceModuleRequired: { type: String, default: 'seo_autopilot' },

  isEnabled: { type: Boolean, default: true },
  lastTriggeredAt: { type: Date, default: null },

  approvalStatus: {
    type: String,
    enum: ['Pending Approval', 'Approved', 'Rejected'],
    default: 'Pending Approval'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: null },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

WorkspaceAutomationSchema.index({ projectId: 1, isEnabled: 1 });
WorkspaceAutomationSchema.index({ agencyId: 1 });

module.exports = mongoose.model('WorkspaceAutomation', WorkspaceAutomationSchema, 'workspace_automations');
