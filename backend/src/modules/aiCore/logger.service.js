/**
 * AI Core — Logger
 *
 * A single reusable logging surface for anything running through AI Core
 * (AI Engine calls, Execution Queue / Task Queue jobs, Agent Loader lookups).
 *
 * Two tiers, matching the distinction already drawn in
 * `seo-mongodb-schema-plan.md` §1 between `workspace_audit_logs` (user-facing
 * history) and `seo_execution_history` (agent/pipeline telemetry):
 *   - log()          → console-only, leveled, for day-to-day operational visibility.
 *   - logExecution()  → persisted, structured telemetry (which agent/job ran,
 *                        duration, tokens, outcome) for debugging and cost-tracking.
 *
 * Persistence is fire-and-forget, mirroring the existing
 * `seoWorkspace/services/auditLog.service.js` pattern exactly — a logging
 * failure must never block the actual workflow it's describing.
 */
const ExecutionLog = require('../models/executionLog.model');

const LEVELS = ['debug', 'info', 'warn', 'error'];

function log(level, tag, message, meta = {}) {
  const lvl = LEVELS.includes(level) ? level : 'info';
  const line = `[${new Date().toISOString()}] [${tag}] ${message}`;
  const metaStr = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';

  switch (lvl) {
    case 'error':
      console.error(line + metaStr);
      break;
    case 'warn':
      console.warn(line + metaStr);
      break;
    default:
      console.log(line + metaStr);
  }
}

/**
 * Persist one execution telemetry record. Never throws — same
 * fire-and-forget contract as auditLog.service.js.
 *
 * @param {Object} entry
 * @param {string} entry.executionId - correlates to Execution Status entries
 * @param {string} entry.source - which subsystem ran (e.g. 'aiEngine', 'taskQueue')
 * @param {string} entry.agentKey - optional, which agent config was used (data only, no new agent logic)
 * @param {string} entry.projectId - optional, for scoping to a WorkspaceProject
 * @param {string} entry.status - 'started' | 'succeeded' | 'failed' | 'retrying'
 * @param {number} entry.durationMs - optional
 * @param {Object} entry.meta - free-form context (skills used, model, attempt count, etc.)
 * @param {string} entry.error - optional error message
 */
async function logExecution(entry) {
  try {
    await ExecutionLog.create({
      executionId: entry.executionId,
      source: entry.source,
      agentKey: entry.agentKey || null,
      projectId: entry.projectId || null,
      status: entry.status,
      durationMs: entry.durationMs || null,
      meta: entry.meta || {},
      error: entry.error || null
    });
  } catch (error) {
    console.error('[AICore][Logger] Failed to persist execution log:', error.message);
  }

  // Always also surface to console so nothing is invisible if Mongo write fails.
  log(entry.status === 'failed' ? 'error' : 'info', entry.source || 'AICore', `${entry.status}: ${entry.executionId}`, {
    agentKey: entry.agentKey, projectId: entry.projectId, durationMs: entry.durationMs
  });
}

module.exports = {
  debug: (tag, message, meta) => log('debug', tag, message, meta),
  info: (tag, message, meta) => log('info', tag, message, meta),
  warn: (tag, message, meta) => log('warn', tag, message, meta),
  error: (tag, message, meta) => log('error', tag, message, meta),
  logExecution
};
