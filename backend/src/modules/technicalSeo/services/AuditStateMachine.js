/**
 * AuditStateMachine
 * Formal state transitions for the Technical SEO audit lifecycle.
 */

const VALID_STATES = [
  'Draft',
  'Queued',
  'Initializing',
  'Crawling',
  'Analyzing',
  'Scoring',
  'AI_Processing',
  'Verification',
  'Completed',
  'Archived',
  'Failed',
  'Cancelled',
  'Paused',
  'Resumed' // Acts mostly like a trigger to go back to Crawling or previous state
];

class AuditStateMachine {
  /**
   * Validate and transition an audit to a new state.
   * @param {Object} audit - Audit document or object with current `state`
   * @param {string} newState - The requested new state
   * @returns {boolean} true if valid
   * @throws {Error} if transition is invalid
   */
  static transition(audit, newState) {
    if (!VALID_STATES.includes(newState)) {
      throw new Error(`Invalid state: ${newState}`);
    }

    const currentState = audit.state || 'Draft';
    
    // Very basic state graph rules (can be expanded)
    const validTransitions = {
      'Draft': ['Queued', 'Cancelled'],
      'Queued': ['Initializing', 'Cancelled'],
      'Initializing': ['Crawling', 'Failed', 'Cancelled'],
      'Crawling': ['Analyzing', 'Paused', 'Failed', 'Cancelled'],
      'Paused': ['Resumed', 'Cancelled'],
      'Resumed': ['Crawling', 'Analyzing'], // depends on where it paused
      'Analyzing': ['Scoring', 'Failed', 'Cancelled'],
      'Scoring': ['AI_Processing', 'Completed', 'Failed'],
      'AI_Processing': ['Verification', 'Completed', 'Failed'],
      'Verification': ['Completed', 'Failed'],
      'Completed': ['Archived'],
      'Archived': [],
      'Failed': ['Queued'], // allows retry
      'Cancelled': []
    };

    const allowed = validTransitions[currentState];
    if (!allowed || !allowed.includes(newState)) {
      throw new Error(`Cannot transition audit from ${currentState} to ${newState}`);
    }

    audit.state = newState;
    return true;
  }
}

module.exports = AuditStateMachine;
