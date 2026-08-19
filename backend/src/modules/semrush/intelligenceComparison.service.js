const OptimizationSnapshot = require('./models/optimizationSnapshot.model');

class IntelligenceComparisonService {
  /**
   * Compare two OptimizationSnapshots
   * @param {Object} previous - The older snapshot
   * @param {Object} current - The newer snapshot
   * @returns {Object} Comparison results
   */
  compareSnapshots(previous, current) {
    if (!current) {
      return null;
    }

    if (!previous) {
      return {
        isFirstSnapshot: true,
        current: this._formatSnapshotSummary(current)
      };
    }

    const comparison = {
      isFirstSnapshot: false,
      dates: {
        previous: previous.collectedAt,
        current: current.collectedAt
      },
      scores: this._compareScores(previous.scores || {}, current.scores || {}),
      seo: this._compareSeoMetrics(previous.seo || {}, current.seo || {}),
      aeo: this._compareMetricsGroup(previous.aeo || {}, current.aeo || {}),
      geo: this._compareMetricsGroup(previous.geo || {}, current.geo || {}),
      positionTracking: this._comparePositionTracking(previous.seo?.positionTracking, current.seo?.positionTracking),
      siteHealth: this._compareSiteHealth(previous.seo?.siteHealthDetails, current.seo?.siteHealthDetails),
      summary: {
        improvements: 0,
        regressions: 0,
        unchanged: 0
      }
    };

    // Calculate summary counts
    this._tallyChanges(comparison.scores, comparison.summary);
    this._tallyChanges(comparison.seo, comparison.summary);
    this._tallyChanges(comparison.aeo, comparison.summary);
    this._tallyChanges(comparison.geo, comparison.summary);

    return comparison;
  }

  _formatSnapshotSummary(snapshot) {
    return {
      date: snapshot.collectedAt,
      scores: snapshot.scores || {},
      seo: snapshot.seo || {},
      aeo: snapshot.aeo || {},
      geo: snapshot.geo || {}
    };
  }

  _compareScores(prev, curr) {
    return {
      overall: this._compareValue(prev.overall, curr.overall),
      seo: this._compareValue(prev.seo, curr.seo),
      aeo: this._compareValue(prev.aeo, curr.aeo),
      geo: this._compareValue(prev.geo, curr.geo)
    };
  }

  _compareSeoMetrics(prev, curr) {
    return {
      authorityScore: this._compareValue(prev.authorityScore?.value, curr.authorityScore?.value),
      technicalScore: this._compareValue(prev.technicalScore?.value, curr.technicalScore?.value),
      organicTraffic: this._compareValue(prev.organicTraffic?.value, curr.organicTraffic?.value),
      organicKeywords: this._compareValue(prev.organicKeywords?.value, curr.organicKeywords?.value),
      backlinks: this._compareValue(prev.backlinks?.value, curr.backlinks?.value)
    };
  }

  _compareMetricsGroup(prev, curr) {
    const result = {};
    const keys = new Set([...Object.keys(prev), ...Object.keys(curr)]);
    
    for (const key of keys) {
      if (typeof prev[key] === 'object' && prev[key] !== null && 'value' in prev[key]) {
         result[key] = this._compareValue(prev[key]?.value, curr[key]?.value);
      }
    }
    return result;
  }

  _compareValue(prev, curr) {
    const prevVal = typeof prev === 'number' ? prev : null;
    const currVal = typeof curr === 'number' ? curr : null;

    if (prevVal === null && currVal === null) {
      return { prev: null, curr: null, delta: 0, status: 'unchanged' };
    }
    
    if (prevVal === null) return { prev: null, curr: currVal, delta: currVal, status: currVal > 0 ? 'improved' : 'unchanged' };
    if (currVal === null) return { prev: prevVal, curr: null, delta: -prevVal, status: 'regression' };

    const delta = currVal - prevVal;
    let status = 'unchanged';
    if (delta > 0) status = 'improved';
    else if (delta < 0) status = 'regression';

    return { prev: prevVal, curr: currVal, delta, status };
  }

  _tallyChanges(group, summary) {
    if (!group) return;
    for (const key in group) {
      const item = group[key];
      if (item && item.status) {
        if (item.status === 'improved') summary.improvements++;
        else if (item.status === 'regression') summary.regressions++;
        else if (item.status === 'unchanged' && item.curr !== null) summary.unchanged++;
      }
    }
  }

  _comparePositionTracking(prev, curr) {
    // Prevent phrase_this leakage and handle unavailable
    const normalizeRank = (val) => {
      if (val === null || val === undefined || val === '-' || val === 'Unavailable' || val === 'UNAVAILABLE') {
        return null;
      }
      const num = parseInt(val, 10);
      return isNaN(num) || num === 0 ? null : num;
    };

    const prevRankings = prev?.data?.rankings || [];
    const currRankings = curr?.data?.rankings || [];

    const prevMap = new Map();
    prevRankings.forEach(r => {
      if (r.keyword) prevMap.set(r.keyword.toLowerCase(), r);
    });

    const result = {
      improved: [],
      declined: [],
      new: [],
      lost: [],
      unavailable: []
    };

    currRankings.forEach(r => {
      if (!r.keyword) return;
      const kw = r.keyword.toLowerCase();
      const currRank = normalizeRank(r.position);
      const prevData = prevMap.get(kw);
      const prevRank = prevData ? normalizeRank(prevData.position) : null;

      const item = {
        keyword: r.keyword,
        prevRank,
        currRank,
        searchVolume: r.searchVolume,
        url: r.url || null
      };

      if (currRank === null) {
        result.unavailable.push(item);
      } else if (prevRank === null) {
        result.new.push(item);
      } else if (currRank < prevRank) { // Lower number = better rank
        item.delta = prevRank - currRank;
        result.improved.push(item);
      } else if (currRank > prevRank) {
        item.delta = prevRank - currRank;
        result.declined.push(item);
      }
      
      prevMap.delete(kw);
    });

    // Anything left in prevMap was lost or dropped
    prevMap.forEach((r, kw) => {
      const prevRank = normalizeRank(r.position);
      if (prevRank !== null) {
        result.lost.push({
          keyword: r.keyword,
          prevRank,
          currRank: null,
          searchVolume: r.searchVolume
        });
      }
    });

    return result;
  }

  _compareSiteHealth(prev, curr) {
    const prevErrors = prev?.errors || [];
    const currErrors = curr?.errors || [];
    
    const prevMap = new Map();
    prevErrors.forEach(e => prevMap.set(e.id, e.count));

    const result = {
      resolved: [],
      new: [],
      remaining: []
    };

    currErrors.forEach(e => {
      const prevCount = prevMap.get(e.id) || 0;
      const currCount = e.count;

      const item = { id: e.id, prevCount, currCount };

      if (prevCount === 0 && currCount > 0) {
        result.new.push(item);
      } else if (currCount > 0) {
        item.delta = currCount - prevCount;
        result.remaining.push(item);
      }
      prevMap.delete(e.id);
    });

    prevMap.forEach((count, id) => {
      if (count > 0) {
        result.resolved.push({ id, prevCount: count, currCount: 0 });
      }
    });

    return result;
  }
}

module.exports = new IntelligenceComparisonService();
