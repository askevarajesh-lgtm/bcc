const nlp = require('compromise');

class KeywordQualityService {
  constructor() {
    this.spamPatterns = [
      /viagra/i, /casino/i, /porn/i, /escort/i, /essay writing/i,
      /\.mp4$/i, /\.zip$/i, /\.rar$/i, /download free/i
    ];
  }

  /**
   * Assesses the quality of a discovered keyword to determine if it should be rejected.
   * @param {string} keyword 
   * @param {Object} metrics 
   * @returns {{ score: number, reason: string, isRejected: boolean }}
   */
  assessQuality(keyword, metrics = {}) {
    if (!keyword) return { score: 0, reason: 'Empty keyword', isRejected: true };
    const normalized = keyword.toLowerCase().trim();

    // 1. Spam Check
    for (const pattern of this.spamPatterns) {
      if (pattern.test(normalized)) {
        return { score: 0, reason: `Matches spam pattern: ${pattern}`, isRejected: true };
      }
    }

    // 2. Length Check
    const tokens = normalized.split(/\s+/);
    if (tokens.length > 10) {
      return { score: 10, reason: 'Keyword is too long (over 10 words)', isRejected: true };
    }
    if (normalized.length < 3) {
      return { score: 10, reason: 'Keyword is too short', isRejected: true };
    }
    if (/^\d+$/.test(normalized)) {
      return { score: 10, reason: 'Keyword is just a number', isRejected: true };
    }

    // 3. Score Calculation
    let score = 100;
    let reason = 'High Quality';

    // Penalize if it's a single weird noun (usually noise from NLP)
    if (tokens.length === 1 && metrics.searchVolume === 0) {
      score -= 40;
      reason = 'Single word with no search volume (likely noise)';
    }

    // Penalize if it has special characters
    if (/[^a-z0-9\s-]/i.test(normalized)) {
      score -= 20;
      reason = 'Contains special characters';
    }

    if (score < 50) {
      return { score, reason, isRejected: true };
    }

    return { score, reason, isRejected: false };
  }
}

module.exports = new KeywordQualityService();
