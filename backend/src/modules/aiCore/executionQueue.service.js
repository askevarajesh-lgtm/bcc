/**
 * AI Core — Execution Queue
 *
 * Serializes AI Engine executions per key (typically a projectId) so two
 * runs never race against the same target. This closes a real, existing gap:
 * `workspaceCron.service.js` runs an hourly autopilot job calling
 * `seoMonitorAgent`, and nothing today stops a manual orchestration trigger
 * (`runOrchestration`) from firing concurrently against the same project —
 * both would read/write the same WorkspaceKeyword/WorkspaceTask documents at
 * once. Wiring the cron/orchestrator to go through this queue is a follow-up
 * (next phase); this pass only builds the reusable primitive.
 *
 * In-process only, matching the codebase's current infra (no Redis/Bull
 * dependency exists — see retry.service.js's note). Per-key chaining, plus a
 * global concurrency cap across all keys so a burst of distinct projects
 * doesn't all hit the AI provider at once.
 */
const logger = require('./logger.service');

const DEFAULT_GLOBAL_CONCURRENCY = 5;

class ExecutionQueueService {
  constructor(globalConcurrency = DEFAULT_GLOBAL_CONCURRENCY) {
    this._tails = new Map(); // key -> Promise chain tail
    this._globalConcurrency = globalConcurrency;
    this._activeGlobal = 0;
    this._globalWaiters = [];
  }

  async _acquireGlobalSlot() {
    if (this._activeGlobal < this._globalConcurrency) {
      this._activeGlobal++;
      return;
    }
    await new Promise(resolve => this._globalWaiters.push(resolve));
    this._activeGlobal++;
  }

  _releaseGlobalSlot() {
    this._activeGlobal--;
    const next = this._globalWaiters.shift();
    if (next) next();
  }

  /**
   * Runs `fn` once no other execution is running under the same `key`, and
   * once a global concurrency slot is free. Returns fn's resolved value (or
   * rethrows its error) to the caller — queueing is transparent.
   *
   * @param {string} key - e.g. a projectId; executions under the same key run strictly in order
   * @param {Function} fn - async function to run
   */
  run(key, fn) {
    const previousTail = this._tails.get(key) || Promise.resolve();

    const task = previousTail
      .catch(() => { /* a prior failure under this key must not block the next one */ })
      .then(async () => {
        await this._acquireGlobalSlot();
        try {
          logger.debug('ExecutionQueue', `running under key "${key}"`);
          return await fn();
        } finally {
          this._releaseGlobalSlot();
        }
      });

    // Store a settled-tracking promise as the new tail so the NEXT caller
    // waits on this one, regardless of whether it resolves or rejects.
    const tail = task.then(() => {}, () => {});
    this._tails.set(key, tail);

    // Once this tail settles, drop it from the map if nothing newer has
    // replaced it — otherwise `_tails` grows forever with one entry per
    // key ever seen, and isBusy() would report stale keys as busy forever.
    tail.then(() => {
      if (this._tails.get(key) === tail) this._tails.delete(key);
    });

    return task;
  }

  /**
   * True if there is a run currently pending/active for this key.
   */
  isBusy(key) {
    return this._tails.has(key);
  }
}

module.exports = new ExecutionQueueService();
