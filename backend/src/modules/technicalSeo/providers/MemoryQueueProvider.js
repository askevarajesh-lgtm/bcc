/**
 * MemoryQueueProvider
 * In-memory fallback queue for development and testing.
 * Implements the QueueProvider interface.
 */
const QueueProvider = require('./QueueProvider');

class MemoryQueueProvider extends QueueProvider {
  constructor(queueName) {
    super();
    this.queueName = queueName;
    this.jobs = new Map(); // Store job data
    this.queue = [];       // Queue of job IDs
    this.processing = new Set();
    this.completed = new Set();
    this.failed = new Set();
    this.isPaused = false;
    this.handlers = [];
  }

  async enqueue(name, data, options = {}) {
    const jobId = `${this.queueName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.jobs.set(jobId, { id: jobId, name, data, progress: 0, status: 'waiting' });
    this.queue.push(jobId);
    this._processNext();
    return jobId;
  }

  async dequeue(handler, concurrency = 1) {
    this.handlers.push({ handler, concurrency });
    this._processNext();
  }

  async _processNext() {
    if (this.isPaused || this.queue.length === 0 || this.handlers.length === 0) return;

    for (const h of this.handlers) {
      if (this.processing.size < h.concurrency) {
        const jobId = this.queue.shift();
        if (!jobId) break;

        this.processing.add(jobId);
        const job = this.jobs.get(jobId);
        job.status = 'active';

        // Execute async without awaiting so other jobs can process
        (async () => {
          try {
            await h.handler(job);
            job.status = 'completed';
            this.completed.add(jobId);
          } catch (error) {
            job.status = 'failed';
            job.error = error.message;
            this.failed.add(jobId);
          } finally {
            this.processing.delete(jobId);
            this._processNext();
          }
        })();
      }
    }
  }

  async retry(jobId) {
    if (this.failed.has(jobId)) {
      this.failed.delete(jobId);
      const job = this.jobs.get(jobId);
      job.status = 'waiting';
      job.error = null;
      this.queue.push(jobId);
      this._processNext();
    }
  }

  async cancel(jobId) {
    const index = this.queue.indexOf(jobId);
    if (index !== -1) {
      this.queue.splice(index, 1);
    }
    this.jobs.delete(jobId);
  }

  async pause() {
    this.isPaused = true;
  }

  async resume() {
    this.isPaused = false;
    this._processNext();
  }

  async progress(jobId, progress) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = progress;
    }
  }

  async status() {
    return {
      waiting: this.queue.length,
      active: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size
    };
  }
}

module.exports = MemoryQueueProvider;
