const nlp = require('compromise');

class KeywordIntentService {
  constructor() {
    this.intentRules = {
      informational: {
        patterns: ['how', 'what', 'why', 'when', 'where', 'guide', 'tutorial', 'tips', 'ideas', 'examples', 'meaning', 'vs', 'difference', 'history'],
        weight: 1.5
      },
      transactional: {
        patterns: ['buy', 'price', 'cost', 'cheap', 'discount', 'coupon', 'order', 'purchase', 'sale', 'pricing'],
        weight: 2.0
      },
      commercial: {
        patterns: ['best', 'top', 'review', 'vs', 'compare', 'comparison', 'software', 'tools', 'services', 'agency'],
        weight: 1.8
      },
      local: {
        patterns: ['near me', 'nearby', 'in', 'city', 'state', 'location', 'restaurant', 'dentist', 'plumber', 'repair'],
        weight: 1.5
      }
    };
    
    // Simplistic mock for branded term detection (in reality this would check against the project's brand name)
    this.brandedIndicators = ['official', 'login', 'support', 'contact'];
  }

  /**
   * Deterministically classifies the intent of a keyword.
   * @param {string} keyword 
   * @param {string} brandName Optional brand name to check for branded intent
   * @returns {{ intent: string, confidence: number, reason: string }}
   */
  classify(keyword, brandName = null) {
    if (!keyword) return { intent: 'unknown', confidence: 0, reason: 'Empty keyword' };

    const normalized = keyword.toLowerCase().trim();
    const doc = nlp(normalized);
    const words = doc.terms().out('array');

    // 1. Branded Check
    if (brandName && normalized.includes(brandName.toLowerCase())) {
      return { intent: 'branded', confidence: 95, reason: `Contains brand name: ${brandName}` };
    }
    for (const indicator of this.brandedIndicators) {
      if (words.includes(indicator)) {
        return { intent: 'navigational', confidence: 80, reason: `Contains navigational indicator: ${indicator}` };
      }
    }

    // 2. Score Intents
    const scores = { informational: 0, transactional: 0, commercial: 0, local: 0 };
    const matchedPatterns = { informational: [], transactional: [], commercial: [], local: [] };

    for (const [intent, rule] of Object.entries(this.intentRules)) {
      for (const pattern of rule.patterns) {
        // Simple regex match for the pattern
        const regex = new RegExp(`\\b${pattern}\\b`, 'i');
        if (regex.test(normalized)) {
          scores[intent] += rule.weight;
          matchedPatterns[intent].push(pattern);
        }
      }
    }

    // Special NLP heuristic checks
    if (doc.questions().found) {
      scores.informational += 2;
      matchedPatterns.informational.push('Is a question');
    }

    // Determine highest score
    let highestIntent = 'unknown';
    let highestScore = 0;
    
    for (const [intent, score] of Object.entries(scores)) {
      if (score > highestScore) {
        highestScore = score;
        highestIntent = intent;
      }
    }

    if (highestScore === 0) {
      // Default fallback
      return { 
        intent: 'informational', 
        confidence: 40, 
        reason: 'Default fallback due to lack of strong signals' 
      };
    }

    const confidence = Math.min(100, Math.round(50 + (highestScore * 15)));
    const reason = `Matched signals: ${matchedPatterns[highestIntent].join(', ')}`;

    return {
      intent: highestIntent,
      confidence,
      reason
    };
  }
}

module.exports = new KeywordIntentService();
