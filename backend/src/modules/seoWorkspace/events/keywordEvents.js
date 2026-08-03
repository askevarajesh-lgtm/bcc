/**
 * Keyword Domain Events
 *
 * A small in-process EventEmitter (matches the rest of this codebase's
 * "no Redis/Bull dependency" stance — see aiCore/retry.service.js's note)
 * that `keywordIntelligence.service.js` and the agents built on top of it
 * emit into, and that future consumers (Blog AI, Website Builder, Reporting,
 * Automation, Monitoring) can subscribe to without keyword-intelligence
 * code needing to know they exist.
 *
 * Emitting is fire-and-forget and MUST NOT throw or block the caller — a
 * failing listener must never break a keyword-research run. See emit().
 *
 * Usage:
 *   const { keywordEvents, EVENTS } = require('.../events/keywordEvents');
 *   keywordEvents.emit(EVENTS.KEYWORD_DISCOVERED, { projectId, keyword, ... });
 *
 *   // elsewhere, e.g. a future blogAI listener module:
 *   keywordEvents.on(EVENTS.KEYWORD_APPROVED, (payload) => { ... });
 */
const { EventEmitter } = require('events');
const logger = require('../../aiCore/logger.service');

const EVENTS = Object.freeze({
  KEYWORD_DISCOVERED: 'keyword.discovered',
  KEYWORD_APPROVED: 'keyword.approved',
  KEYWORD_REJECTED: 'keyword.rejected',
  CLUSTER_CREATED: 'cluster.created',
  GAP_DETECTED: 'gap.detected',
  TREND_UPDATED: 'trend.updated',
  SERP_UPDATED: 'serp.updated'
});

class KeywordEventBus extends EventEmitter {
  /**
   * Safe emit: logs and swallows listener errors instead of letting one
   * bad subscriber take down the emitting workflow (agent run, approve/
   * reject request, etc).
   */
  emitSafe(eventName, payload) {
    try {
      this.emit(eventName, { ...payload, emittedAt: new Date() });
    } catch (error) {
      logger.warn('KeywordEvents', `Listener for ${eventName} threw: ${error.message}`);
    }
  }
}

const keywordEvents = new KeywordEventBus();

// Node warns past 10 listeners by default; this bus is meant to gain many
// subscribers across modules over time (that's the whole point).
keywordEvents.setMaxListeners(50);

module.exports = { keywordEvents, EVENTS };
