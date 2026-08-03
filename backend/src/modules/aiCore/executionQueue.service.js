/**
 * AI Core — Execution Queue (Enhanced for Enterprise Automation)
 *
 * Provides a robust, in-memory execution queue supporting:
 * - Chaining by key (strict ordering per key)
 * - Global concurrency caps
 * - Priorities
 * - Retries & Exponential Backoff
 * - Cancellation
 * - Pause / Resume
 * - Dead-letter queue for failed tasks
 * - Queue metrics
 */
const logger = require('./logger.service');

const DEFAULT_GLOBAL_CONCURRENCY = 5;

class ExecutionQueueService {
  constructor(globalConcurrency = DEFAULT_GLOBAL_CONCURRENCY) {
    this._globalConcurrency = globalConcurrency;
    this._activeGlobal = 0;
    
    // Per-key queue mapping: key -> array of tasks
    this._queues = new Map();
    // Tasks waiting for a global slot (across all keys)
    this._globalWaiters = [];
    
    this._isPaused = false;
    this._deadLetterQueue = [];
    this._metrics = {
      completed: 0,
      failed: 0,
      cancelled: 0,
      totalWaitTime: 0,
      totalExecTime: 0
    };
  }

  /**
   * Run a standard promise-chain task (Legacy compatibility)
   */
  run(key, fn) {
    return this.enqueue({ key, fn, priority: 0 });
  }

  /**
   * Enqueue a new execution task with advanced options.
   * @param {Object} options
   * @param {string} options.key - Partition key (e.g. projectId)
   * @param {Function} options.fn - Async function to execute
   * @param {number} [options.priority=0] - Higher priority runs first
   * @param {number} [options.retries=0] - Max retries
   * @param {number} [options.backoffMs=1000] - Base delay for exponential backoff
   * @param {string} [options.taskId] - Unique ID for cancellation
   */
  enqueue({ key, fn, priority = 0, retries = 0, backoffMs = 1000, taskId = null }) {
    taskId = taskId || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const enqueueTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const task = {
        taskId,
        key,
        fn,
        priority,
        retries,
        backoffMs,
        enqueueTime,
        attempt: 0,
        resolve,
        reject,
        status: 'queued' // queued, running, cancelled
      };

      if (!this._queues.has(key)) {
        this._queues.set(key, []);
      }
      
      const q = this._queues.get(key);
      q.push(task);
      // Sort by priority descending
      q.sort((a, b) => b.priority - a.priority);

      this._processNext(key);
    });
  }

  async _processNext(key) {
    if (this._isPaused) return;

    const q = this._queues.get(key);
    if (!q || q.length === 0) {
      this._queues.delete(key);
      return;
    }

    // If there is already a running task for this key, wait (strict ordering)
    if (q[0].status === 'running') {
      return;
    }

    const task = q[0];
    
    if (task.status === 'cancelled') {
      q.shift();
      this._metrics.cancelled++;
      return this._processNext(key);
    }

    task.status = 'running';
    
    // Acquire global slot
    await this._acquireGlobalSlot();
    
    // Check pause/cancellation again after acquiring slot
    if (this._isPaused || task.status === 'cancelled') {
      this._releaseGlobalSlot();
      if (task.status === 'cancelled') {
        q.shift();
        this._metrics.cancelled++;
      } else {
        task.status = 'queued'; // revert if paused
      }
      return; // If paused, just stop. _processNext will be called on resume
    }

    const waitTime = Date.now() - task.enqueueTime;
    this._metrics.totalWaitTime += waitTime;
    const execStartTime = Date.now();

    try {
      logger.debug('ExecutionQueue', `running task ${task.taskId} under key "${key}"`);
      const result = await task.fn();
      
      this._metrics.completed++;
      this._metrics.totalExecTime += (Date.now() - execStartTime);
      
      task.resolve(result);
    } catch (error) {
      if (task.attempt < task.retries) {
        task.attempt++;
        const delay = task.backoffMs * Math.pow(2, task.attempt - 1);
        logger.warn('ExecutionQueue', `Task ${task.taskId} failed, retrying in ${delay}ms...`, { attempt: task.attempt });
        
        this._releaseGlobalSlot();
        task.status = 'queued';
        
        await new Promise(r => setTimeout(r, delay));
        return this._processNext(key);
      } else {
        logger.error('ExecutionQueue', `Task ${task.taskId} failed permanently.`, { error: error.message });
        this._metrics.failed++;
        this._deadLetterQueue.push({
          task: { taskId: task.taskId, key: task.key, fn: task.fn.toString() },
          error: error.message,
          timestamp: new Date()
        });
        task.reject(error);
      }
    }

    this._releaseGlobalSlot();
    q.shift(); // Remove the completed/failed task
    this._processNext(key);
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
    if (!this._isPaused && this._globalWaiters.length > 0) {
      const next = this._globalWaiters.shift();
      next();
    }
  }

  /**
   * Cancel a task by its ID
   */
  cancelTask(taskId) {
    for (const [key, q] of this._queues.entries()) {
      for (const task of q) {
        if (task.taskId === taskId) {
          task.status = 'cancelled';
          task.reject(new Error('Task cancelled'));
          return true;
        }
      }
    }
    return false;
  }

  /**
   * Pause processing new tasks. Currently running tasks will finish.
   */
  pause() {
    this._isPaused = true;
    logger.info('ExecutionQueue', 'Queue processing paused');
  }

  /**
   * Resume processing tasks.
   */
  resume() {
    this._isPaused = false;
    logger.info('ExecutionQueue', 'Queue processing resumed');
    // Release any global slots that might be waiting
    while (this._activeGlobal < this._globalConcurrency && this._globalWaiters.length > 0) {
      const next = this._globalWaiters.shift();
      next();
    }
    // Kick off processNext for all keys
    for (const key of this._queues.keys()) {
      this._processNext(key);
    }
  }

  /**
   * Helper specifically for automation workflows
   */
  enqueueWorkflowExecution({ projectId, workflowId, versionId, triggerContext }) {
    const automationExecutionService = require('../seoWorkspace/services/automationExecution.service');
    return this.enqueue({
      key: `workflow:${projectId}`,
      taskId: `wf_${workflowId}_${Date.now()}`,
      priority: 10, // Default workflow priority
      fn: () => automationExecutionService.executeWorkflowRun(projectId, workflowId, versionId, triggerContext)
    });
  }

  getMetrics() {
    let queuedTasks = 0;
    for (const q of this._queues.values()) {
      queuedTasks += q.length;
    }
    return {
      ...this._metrics,
      activeGlobal: this._activeGlobal,
      queuedTasks,
      deadLetterCount: this._deadLetterQueue.length,
      isPaused: this._isPaused
    };
  }
  
  getDeadLetterQueue() {
    return this._deadLetterQueue;
  }

  isBusy(key) {
    return this._queues.has(key) && this._queues.get(key).length > 0;
  }
}

module.exports = new ExecutionQueueService();
