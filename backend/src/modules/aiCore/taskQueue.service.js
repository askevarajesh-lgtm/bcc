/**
 * AI Core — Task Queue
 *
 * Distinct from Execution Queue: Execution Queue serializes runs *per key*
 * (e.g. no two runs for the same project at once). Task Queue is a general
 * named-job dispatch mechanism — enqueue a `jobType` with a payload, a
 * registered handler processes it, with retry + status + logging for free.
 * Intended so future work (send a scheduled report email, dispatch a
 * WordPress publish, run a rank check) has one place to enqueue into instead
 * of each module inventing its own ad-hoc array/interval, the way
 * `workspaceCron.service.js` currently does its own inline loop.
 *
 * In-process only (no Redis/Bull dependency in this codebase today — see
 * retry.service.js's note). A single drain loop processes jobs up to a
 * concurrency limit; this does not replace `node-cron` schedules (which
 * decide *when* to enqueue) — it only decides *how* enqueued work gets run.
 */
const retry = require('./retry.service');
const executionStatus = require('./executionStatus.service');
const logger = require('./logger.service');

const DEFAULT_CONCURRENCY = 3;
const DEFAULT_DRAIN_INTERVAL_MS = 250;

class TaskQueueService {
  constructor(concurrency = DEFAULT_CONCURRENCY) {
    this._handlers = new Map(); // jobType -> async (payload, job) => result
    this._queue = []; // FIFO of job objects
    this._active = 0;
    this._concurrency = concurrency;
    this._draining = false;
    this._timer = null;
  }

  /**
   * @param {string} jobType
   * @param {Function} handlerFn - async (payload, job) => result
   */
  registerHandler(jobType, handlerFn) {
    this._handlers.set(jobType, handlerFn);
  }

  /**
   * @param {string} jobType - must have a registered handler before it's processed
   * @param {Object} payload
   * @param {Object} [options]
   * @param {Object} [options.retryOptions] - passed to Retry System
   * @returns {string} jobId — also used as the Execution Status executionId
   */
  enqueue(jobType, payload = {}, options = {}) {
    const jobId = `taskQueue:${jobType}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
    const job = { jobId, jobType, payload, retryOptions: options.retryOptions || {}, enqueuedAt: new Date() };
    this._queue.push(job);
    executionStatus.start(jobId, { jobType, payload });
    logger.debug('TaskQueue', `enqueued ${jobType}`, { jobId });
    this._scheduleDrain();
    return jobId;
  }

  _scheduleDrain() {
    if (this._timer) return;
    this._timer = setInterval(() => this._drainOnce(), DEFAULT_DRAIN_INTERVAL_MS);
  }

  _stopDrainIfIdle() {
    if (this._queue.length === 0 && this._active === 0 && this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  _drainOnce() {
    while (this._active < this._concurrency && this._queue.length > 0) {
      const job = this._queue.shift();
      this._runJob(job);
    }
    this._stopDrainIfIdle();
  }

  async _runJob(job) {
    const handler = this._handlers.get(job.jobType);
    if (!handler) {
      const error = new Error(`TaskQueue: no handler registered for jobType "${job.jobType}"`);
      executionStatus.fail(job.jobId, error);
      logger.logExecution({ executionId: job.jobId, source: 'taskQueue', status: 'failed', error: error.message, meta: { jobType: job.jobType } });
      return;
    }

    this._active++;
    const startedAt = Date.now();
    try {
      const result = await retry.withRetry(() => handler(job.payload, job), job.retryOptions);
      executionStatus.succeed(job.jobId, result);
      logger.logExecution({
        executionId: job.jobId, source: 'taskQueue', status: 'succeeded',
        durationMs: Date.now() - startedAt, meta: { jobType: job.jobType }
      });
    } catch (error) {
      executionStatus.fail(job.jobId, error);
      logger.logExecution({
        executionId: job.jobId, source: 'taskQueue', status: 'failed',
        durationMs: Date.now() - startedAt, error: error.message, meta: { jobType: job.jobType }
      });
    } finally {
      this._active--;
    }
  }

  /** Current queue depth (jobs not yet started). */
  pendingCount() {
    return this._queue.length;
  }

  activeCount() {
    return this._active;
  }
}

module.exports = new TaskQueueService();
