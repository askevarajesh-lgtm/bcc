const contentEvents = require('../events/contentEvents');

class AutomationEngineService {
  constructor() {
    this._initializeListeners();
  }

  _initializeListeners() {
    contentEvents.on(contentEvents.EVENTS.SEO_SCORE_UPDATED, this.handleSEOScoreUpdated.bind(this));
    contentEvents.on(contentEvents.EVENTS.KEYWORD_UPDATED, this.handleKeywordUpdated.bind(this));
    contentEvents.on(contentEvents.EVENTS.COMPETITOR_ANALYSIS_COMPLETED, this.handleCompetitorAnalysis.bind(this));
  }

  /**
   * Evaluates rules when SEO Score drops below threshold
   */
  async handleSEOScoreUpdated({ contentPieceId, newScore }) {
    if (newScore < 80) {
      console.log(`[AutomationEngine] SEO Score for ${contentPieceId} dropped to ${newScore}. Triggering optimization suggestion.`);
      // In production: Create notification, push to UI suggestion queue, or auto-schedule AI optimization.
    }
  }

  /**
   * Re-evaluates content if the target keyword's volume/intent changes heavily
   */
  async handleKeywordUpdated({ keyword, changes }) {
    console.log(`[AutomationEngine] Keyword ${keyword} updated. Evaluating dependent content pieces...`);
    // In production: Find all ContentPieces targeting this keyword and queue them for brief re-evaluation.
  }

  /**
   * When competitors change significantly, notify content owners
   */
  async handleCompetitorAnalysis({ targetKeyword, newCompetitors }) {
    console.log(`[AutomationEngine] Competitor landscape shifted for ${targetKeyword}.`);
    // In production: Send email/notification to assigned reviewers of content pieces using this keyword.
  }
}

// Instantiate and export to auto-register listeners
module.exports = new AutomationEngineService();
