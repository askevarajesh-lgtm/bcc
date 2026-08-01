const geoConfig = require('./geoConfig');
const crypto = require('crypto');

class RecommendationEngine {
  /**
   * Deduplicates and prioritizes recommendations across all analyzers.
   * @param {Object} analyzerResults - Results from the analyzer registry
   * @returns {Array} Deduplicated and prioritized recommendations
   */
  process(analyzerResults) {
    const rawRecommendations = [];

    // Collect all recommendations
    for (const [analyzerName, result] of Object.entries(analyzerResults)) {
      if (result.status === 'success' && Array.isArray(result.recommendations)) {
        for (const rec of result.recommendations) {
          rawRecommendations.push({
            ...rec,
            source: analyzerName
          });
        }
      }
    }

    // Deduplicate logic based on a unique hash of the recommendation rule key + page
    const dedupedMap = new Map();

    for (const rec of rawRecommendations) {
      // ruleKey should be a constant string identifying the issue e.g., 'missing_organization_schema'
      const key = `${rec.ruleKey}_${rec.page || 'sitewide'}`;
      
      if (dedupedMap.has(key)) {
        // Merge evidence and sources
        const existing = dedupedMap.get(key);
        
        // Merge sources
        const sources = new Set(existing.source.split(', '));
        sources.add(rec.source);
        existing.source = Array.from(sources).join(', ');

        // Merge evidence
        if (rec.evidence) {
          existing.evidence = existing.evidence || [];
          existing.evidence.push(...(Array.isArray(rec.evidence) ? rec.evidence : [rec.evidence]));
        }
      } else {
        // Assign deterministic priority if not present
        if (!rec.priority) {
          rec.priority = this.determinePriority(rec.ruleKey);
        }

        // Initialize evidence array if not present
        if (rec.evidence && !Array.isArray(rec.evidence)) {
          rec.evidence = [rec.evidence];
        } else if (!rec.evidence) {
          rec.evidence = [];
        }

        dedupedMap.set(key, { ...rec });
      }
    }

    // Convert map back to array and sort by priority
    const priorityWeights = { critical: 4, high: 3, medium: 2, low: 1 };
    
    return Array.from(dedupedMap.values()).sort((a, b) => {
      const weightA = priorityWeights[a.priority] || 0;
      const weightB = priorityWeights[b.priority] || 0;
      return weightB - weightA;
    });
  }

  determinePriority(ruleKey) {
    for (const [priority, rules] of Object.entries(geoConfig.priorityRules)) {
      if (rules.includes(ruleKey)) {
        return priority;
      }
    }
    return 'low'; // Default fallback priority
  }
}

module.exports = new RecommendationEngine();
