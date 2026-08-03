/**
 * EventBus
 * A central event emitter for the Technical SEO module to decouple services.
 */

const EventEmitter = require('events');

class TechnicalSeoEventBus extends EventEmitter {
  constructor() {
    super();
    // Increase limit for concurrent workers/plugins listening
    this.setMaxListeners(50);
  }

  /**
   * Strongly typed emit for technical SEO lifecycle events.
   * @param {string} eventName 
   * @param {Object} payload 
   */
  dispatch(eventName, payload) {
    // Optionally add structured logging here for all events
    console.debug(`[EventBus] Dispatched: ${eventName}`, { auditId: payload?.auditId });
    this.emit(eventName, payload);
  }
}

const eventBus = new TechnicalSeoEventBus();

module.exports = {
  eventBus,
  EVENTS: {
    AUDIT_STARTED: 'audit.started',
    CRAWL_STARTED: 'crawl.started',
    PAGE_DISCOVERED: 'page.discovered',
    PAGE_CRAWLED: 'page.crawled',
    PAGE_RENDERED: 'page.rendered',
    PAGE_ANALYZED: 'page.analyzed',
    PLUGIN_COMPLETED: 'plugin.completed',
    ISSUE_DETECTED: 'issue.detected',
    SCORE_UPDATED: 'score.updated',
    AI_STARTED: 'ai.started',
    AI_COMPLETED: 'ai.completed',
    VERIFICATION_COMPLETED: 'verification.completed',
    AUDIT_COMPLETED: 'audit.completed',
    AUDIT_FAILED: 'audit.failed',
  }
};
