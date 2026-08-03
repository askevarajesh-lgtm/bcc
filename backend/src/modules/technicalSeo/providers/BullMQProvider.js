/**
 * BullMQProvider
 * Redis-backed production queue implementation.
 * Implements the QueueProvider interface.
 */
const QueueProvider = require('./QueueProvider');
const { Queue, Worker, Job } = require('bullmq');

// Assumes process.env.REDIS_URL or REDIS_HOST etc. are available
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined
};

class BullMQProvider extends QueueProvider {
  /**
   * @param {string} queueName 
   */
  constructor(queueName) {
    super();
    this.queueName = queueName;
    this.queue = new Queue(queueName, { connection });
    this.workers = [];
  }

  async enqueue(name, data, options = {}) {
    const job = await this.queue.add(name, data, {
      priority: options.priority,
      delay: options.delay,
      attempts: options.attempts || 3,
      backoff: options.backoff || { type: 'exponential', delay: 1000 },
      removeOnComplete: true,
      removeOnFail: false
    });
    return job.id;
  }

  async dequeue(handler, concurrency = 1) {
    const worker = new Worker(this.queueName, async (job) => {
      // Wrapper to pass job data directly if desired, but BullMQ jobs are complex
      // For parity with MemoryQueue, we pass the BullMQ job itself.
      return handler(job);
    }, { 
      connection,
      concurrency
    });

    worker.on('failed', (job, err) => {
      console.error(`[BullMQProvider] Job ${job?.id} failed:`, err.message);
    });

    this.workers.push(worker);
  }

  async retry(jobId) {
    const job = await Job.fromId(this.queue, jobId);
    if (job && await job.isFailed()) {
      await job.retry();
    }
  }

  async cancel(jobId) {
    const job = await Job.fromId(this.queue, jobId);
    if (job) {
      await job.remove();
    }
  }

  async pause() {
    await this.queue.pause();
  }

  async resume() {
    await this.queue.resume();
  }

  async progress(jobId, progress) {
    const job = await Job.fromId(this.queue, jobId);
    if (job) {
      await job.updateProgress(progress);
    }
  }

  async status() {
    const counts = await this.queue.getJobCounts();
    return {
      waiting: counts.waiting || 0,
      active: counts.active || 0,
      completed: counts.completed || 0,
      failed: counts.failed || 0
    };
  }
}

module.exports = BullMQProvider;
