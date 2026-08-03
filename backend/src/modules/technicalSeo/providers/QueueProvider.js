/**
 * QueueProvider
 * Abstract base class for queues. Enforces standard interface for all implementations.
 */
class QueueProvider {
  /**
   * Add a job to the queue.
   * @param {string} name - Job name/type
   * @param {Object} data - Job payload
   * @param {Object} options - { priority, delay, attempts, backoff }
   */
  async enqueue(name, data, options = {}) {
    throw new Error('Method "enqueue" must be implemented.');
  }

  /**
   * Process jobs from the queue.
   * @param {Function} handler - Async function(job)
   * @param {number} concurrency - Number of concurrent jobs
   */
  async dequeue(handler, concurrency = 1) {
    throw new Error('Method "dequeue" must be implemented.');
  }

  /**
   * Retry a failed job.
   * @param {string} jobId 
   */
  async retry(jobId) {
    throw new Error('Method "retry" must be implemented.');
  }

  /**
   * Cancel a pending or delayed job.
   * @param {string} jobId 
   */
  async cancel(jobId) {
    throw new Error('Method "cancel" must be implemented.');
  }

  /**
   * Pause the entire queue.
   */
  async pause() {
    throw new Error('Method "pause" must be implemented.');
  }

  /**
   * Resume the paused queue.
   */
  async resume() {
    throw new Error('Method "resume" must be implemented.');
  }

  /**
   * Update the progress of a job.
   * @param {string} jobId 
   * @param {number|Object} progress 
   */
  async progress(jobId, progress) {
    throw new Error('Method "progress" must be implemented.');
  }

  /**
   * Schedule a recurring job.
   * @param {string} name 
   * @param {Object} data 
   * @param {string} cron 
   */
  async schedule(name, data, cron) {
    throw new Error('Method "schedule" must be implemented.');
  }

  /**
   * Get queue status (waiting, active, completed, failed counts).
   */
  async status() {
    throw new Error('Method "status" must be implemented.');
  }
}

module.exports = QueueProvider;
