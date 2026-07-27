/**
 * AI Core — barrel export.
 *
 * Infrastructure only. No agents are defined or implemented anywhere in
 * this module — see agentLoader.service.js's header comment.
 */
module.exports = {
  aiEngine: require('./services/aiEngine.service'),
  executionQueue: require('./services/executionQueue.service'),
  taskQueue: require('./services/taskQueue.service'),
  agentLoader: require('./services/agentLoader.service'),
  logger: require('./services/logger.service'),
  retry: require('./services/retry.service'),
  executionStatus: require('./services/executionStatus.service'),
  sharedMemory: require('./services/sharedMemory.service')
};
