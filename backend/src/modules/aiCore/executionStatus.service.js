/**
 * AI Core — Execution Status
 *
 * Tracks the live state of any execution running through AI Core (an AI
 * Engine call, an Execution Queue run, a Task Queue job) by executionId.
 *
 * Kept in-memory by design: the codebase has no Redis/Bull/Agenda dependency
 * today (`package.json` only lists `node-cron`), so an in-process Map is the
 * honest reusable choice rather than introducing a new infra dependency for
 * this pass. Durable history for anything that needs to survive a restart
 * already has a home in Logger's logExecution() (persisted to
 * `ai_execution_logs`) — this service is the fast, current-state read path,
 * not the historical one.
 */
const logger = require('./logger.service');

const STATUSES = ['pending', 'running', 'succeeded', 'failed'];

class ExecutionStatusService {
  constructor() {
    this._store = new Map();
  }

  start(executionId, meta = {}) {
    const record = {
      executionId,
      status: 'running',
      meta,
      startedAt: new Date(),
      updatedAt: new Date(),
      finishedAt: null,
      error: null,
      result: null
    };
    this._store.set(executionId, record);
    logger.debug('ExecutionStatus', `started ${executionId}`, meta);
    return { ...record };
  }

  update(executionId, patch = {}) {
    const record = this._store.get(executionId);
    if (!record) return null;
    Object.assign(record, patch, { updatedAt: new Date() });
    return { ...record };
  }

  succeed(executionId, result = null) {
    const record = this._store.get(executionId);
    if (!record) return null;
    record.status = 'succeeded';
    record.result = result;
    record.finishedAt = new Date();
    record.updatedAt = new Date();
    return { ...record };
  }

  fail(executionId, error) {
    const record = this._store.get(executionId);
    if (!record) return null;
    record.status = 'failed';
    record.error = error && error.message ? error.message : String(error);
    record.finishedAt = new Date();
    record.updatedAt = new Date();
    return { ...record };
  }

  get(executionId) {
    const record = this._store.get(executionId);
    return record ? { ...record } : null;
  }

  /**
   * @param {Object} [filter]
   * @param {string} [filter.status]
   * @returns {Array}
   */
  list(filter = {}) {
    const all = Array.from(this._store.values());
    if (!filter.status) return all.map(r => ({ ...r }));
    return all.filter(r => r.status === filter.status).map(r => ({ ...r }));
  }

  /**
   * Clears finished (succeeded/failed) entries older than maxAgeMs, so the
   * in-memory Map doesn't grow unbounded over a long-running process.
   */
  prune(maxAgeMs = 24 * 60 * 60 * 1000) {
    const now = Date.now();
    let pruned = 0;
    for (const [id, record] of this._store.entries()) {
      const isFinished = record.status === 'succeeded' || record.status === 'failed';
      const age = now - (record.finishedAt ? record.finishedAt.getTime() : record.startedAt.getTime());
      if (isFinished && age > maxAgeMs) {
        this._store.delete(id);
        pruned++;
      }
    }
    if (pruned > 0) logger.debug('ExecutionStatus', `pruned ${pruned} finished executions`);
    return pruned;
  }
}

module.exports = new ExecutionStatusService();
module.exports.STATUSES = STATUSES;
