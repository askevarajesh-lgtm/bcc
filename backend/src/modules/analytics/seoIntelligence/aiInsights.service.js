/**
 * AI Insights — rule-based, not model-generated.
 *
 * Every insight here is a template filled in with numbers the rest of the
 * Analytics/SEO Intelligence engine already computed from real data
 * (GA4/GSC trends, real ranking deltas, real technical findings, real
 * monitoring alerts). There is no LLM call in this file and no invented
 * commentary — an insight only appears when a real threshold on a real
 * number is crossed, and its text states that number.
 *
 * Thresholds are intentionally simple and documented inline so they're easy
 * to tune without hunting through the file.
 */
const TRAFFIC_TREND_THRESHOLD = 15; // % change in sessions/clicks/impressions worth flagging
const CTR_TREND_THRESHOLD = 10;     // % change in CTR worth flagging
const POSITION_TREND_THRESHOLD = 10; // % change in average position worth flagging
const LOW_SCORE_THRESHOLD = 50;      // AEO/GEO score (0-100) below which it's flagged as an opportunity

function parseTrendPercent(trendStr) {
  if (typeof trendStr !== 'string') return 0;
  const n = parseFloat(trendStr.replace('%', '').replace('+', ''));
  return Number.isFinite(n) ? n : 0;
}

function pushInsight(list, insight) {
  list.push({ id: `${insight.type}-${list.length}`, ...insight });
}

function buildTrafficInsights(metrics, insights) {
  const sessionsChange = parseTrendPercent(metrics.sessionsTrend);
  if (Math.abs(sessionsChange) >= TRAFFIC_TREND_THRESHOLD) {
    pushInsight(insights, {
      type: 'traffic_change',
      severity: sessionsChange > 0 ? 'positive' : 'warning',
      title: `Sessions ${sessionsChange > 0 ? 'up' : 'down'} ${metrics.sessionsTrend} vs. previous period`,
      detail: `Total sessions moved from the previous period to ${metrics.sessions?.toLocaleString?.() ?? metrics.sessions} in this range (${metrics.sessionsTrend}).`,
      metric: 'sessions',
      changePercent: sessionsChange
    });
  }

  const clicksChange = parseTrendPercent(metrics.clicksTrend);
  if (Math.abs(clicksChange) >= TRAFFIC_TREND_THRESHOLD) {
    pushInsight(insights, {
      type: 'traffic_change',
      severity: clicksChange > 0 ? 'positive' : 'warning',
      title: `Search clicks ${clicksChange > 0 ? 'up' : 'down'} ${metrics.clicksTrend} vs. previous period`,
      detail: `Google Search Console clicks are at ${metrics.clicks?.toLocaleString?.() ?? metrics.clicks} for this range (${metrics.clicksTrend}).`,
      metric: 'clicks',
      changePercent: clicksChange
    });
  }

  const impressionsChange = parseTrendPercent(metrics.impressionsTrend);
  if (Math.abs(impressionsChange) >= TRAFFIC_TREND_THRESHOLD) {
    pushInsight(insights, {
      type: 'traffic_change',
      severity: impressionsChange > 0 ? 'positive' : 'warning',
      title: `Search impressions ${impressionsChange > 0 ? 'up' : 'down'} ${metrics.impressionsTrend} vs. previous period`,
      detail: `Impressions are at ${metrics.impressions?.toLocaleString?.() ?? metrics.impressions} for this range (${metrics.impressionsTrend}).`,
      metric: 'impressions',
      changePercent: impressionsChange
    });
  }
}

function buildCtrInsights(metrics, insights) {
  const ctrChange = parseTrendPercent(metrics.ctrTrend);
  if (Math.abs(ctrChange) >= CTR_TREND_THRESHOLD) {
    pushInsight(insights, {
      type: 'ctr_change',
      severity: ctrChange > 0 ? 'positive' : 'warning',
      title: `CTR ${ctrChange > 0 ? 'improved' : 'declined'} ${metrics.ctrTrend} vs. previous period`,
      detail: `Search Console CTR is now ${metrics.ctr} (${metrics.ctrTrend} change). ${ctrChange < 0 ? 'Falling CTR at similar impressions usually points to weaker titles/snippets or new competing results in the SERP.' : ''}`,
      metric: 'ctr',
      changePercent: ctrChange
    });
  }

  const positionChange = parseTrendPercent(metrics.averagePositionTrend);
  if (Math.abs(positionChange) >= POSITION_TREND_THRESHOLD) {
    pushInsight(insights, {
      type: 'ranking_drop',
      severity: positionChange > 0 ? 'positive' : 'warning',
      title: `Average search position ${positionChange > 0 ? 'improved' : 'declined'} ${metrics.averagePositionTrend} vs. previous period`,
      detail: `Impression-weighted average position is now ${metrics.averagePosition}.`,
      metric: 'averagePosition',
      changePercent: positionChange
    });
  }
}

function buildRankingInsights(rankingImpact, insights) {
  if (!rankingImpact || rankingImpact.keywordsWithSnapshots === undefined) return;

  if (rankingImpact.declined > 0 || rankingImpact.lost > 0) {
    const dropExamples = (rankingImpact.biggestDrops || [])
      .slice(0, 3)
      .map(d => `"${d.keyword}" (#${d.before} → #${d.after})`)
      .join(', ');
    pushInsight(insights, {
      type: 'ranking_drop',
      severity: 'warning',
      title: `${rankingImpact.declined} tracked keyword${rankingImpact.declined === 1 ? '' : 's'} dropped in rank this period${rankingImpact.lost ? `, ${rankingImpact.lost} lost visibility entirely` : ''}`,
      detail: dropExamples ? `Biggest drops: ${dropExamples}.` : 'See the Rank Tracking module for the full list.',
      metric: 'rankingDeclines',
      count: rankingImpact.declined + rankingImpact.lost
    });
  }

  if (rankingImpact.improved > 0) {
    const gainExamples = (rankingImpact.biggestGains || [])
      .slice(0, 3)
      .map(g => `"${g.keyword}" (#${g.before} → #${g.after})`)
      .join(', ');
    pushInsight(insights, {
      type: 'ranking_gain',
      severity: 'positive',
      title: `${rankingImpact.improved} tracked keyword${rankingImpact.improved === 1 ? '' : 's'} improved in rank this period`,
      detail: gainExamples ? `Biggest gains: ${gainExamples}.` : 'See the Rank Tracking module for the full list.',
      metric: 'rankingGains',
      count: rankingImpact.improved
    });
  }
}

function buildOptimizationInsights(seoIntelligence, insights) {
  const { technicalIssueImpact, monitoringAlerts, moduleScores, topKeywords } = seoIntelligence;

  if (technicalIssueImpact) {
    const critical = technicalIssueImpact.bySeverity.critical || 0;
    const high = technicalIssueImpact.bySeverity.high || 0;
    if (critical + high > 0) {
      pushInsight(insights, {
        type: 'optimization_opportunity',
        severity: critical > 0 ? 'critical' : 'warning',
        title: `${critical + high} critical/high technical issue${critical + high === 1 ? '' : 's'} open${technicalIssueImpact.sessionsAtRisk ? `, affecting ~${technicalIssueImpact.sessionsAtRisk.toLocaleString()} sessions this period` : ''}`,
        detail: 'From the latest completed Website Audit and Technical SEO audit for this scope.',
        metric: 'technicalIssues',
        count: critical + high
      });
    }
  }

  if (monitoringAlerts && monitoringAlerts.openCount > 0) {
    const critHigh = (monitoringAlerts.bySeverity.Critical || 0) + (monitoringAlerts.bySeverity.High || 0);
    if (critHigh > 0) {
      pushInsight(insights, {
        type: 'optimization_opportunity',
        severity: monitoringAlerts.bySeverity.Critical > 0 ? 'critical' : 'warning',
        title: `${critHigh} open critical/high alert${critHigh === 1 ? '' : 's'} in Automation & Monitoring`,
        detail: 'Unresolved alerts from the monitoring module for this client scope.',
        metric: 'monitoringAlerts',
        count: critHigh
      });
    }
  }

  if (topKeywords && topKeywords.keywords?.length) {
    const pageTwoOpportunities = topKeywords.keywords.filter(k => k.currentRank != null && k.currentRank >= 11 && k.currentRank <= 20);
    if (pageTwoOpportunities.length > 0) {
      pushInsight(insights, {
        type: 'optimization_opportunity',
        severity: 'info',
        title: `${pageTwoOpportunities.length} tracked keyword${pageTwoOpportunities.length === 1 ? '' : 's'} ranking on page 2 (positions 11–20)`,
        detail: `${pageTwoOpportunities.slice(0, 3).map(k => `"${k.keyword}" (#${k.currentRank})`).join(', ')} — typically the fastest keywords to push onto page 1 with targeted on-page work.`,
        metric: 'pageTwoKeywords',
        count: pageTwoOpportunities.length
      });
    }
  }

  if (moduleScores?.aeo?.averageScore != null && moduleScores.aeo.averageScore < LOW_SCORE_THRESHOLD) {
    pushInsight(insights, {
      type: 'optimization_opportunity',
      severity: 'warning',
      title: `AEO score is low (${moduleScores.aeo.averageScore}/100)`,
      detail: 'From the latest completed AEO audit for this scope — answer-engine visibility has room to improve.',
      metric: 'aeoScore'
    });
  }

  if (moduleScores?.geo?.averageScore != null && moduleScores.geo.averageScore < LOW_SCORE_THRESHOLD) {
    pushInsight(insights, {
      type: 'optimization_opportunity',
      severity: 'warning',
      title: `GEO score is low (${moduleScores.geo.averageScore}/100)`,
      detail: 'From the latest completed GEO audit for this scope — generative-engine visibility has room to improve.',
      metric: 'geoScore'
    });
  }
}

const SEVERITY_ORDER = { critical: 0, warning: 1, info: 2, positive: 3 };

/**
 * @param {Object} metrics - the main Analytics `metrics` object (already has real trend %s)
 * @param {Object} seoIntelligence - the result of `seoIntelligence.service#buildSeoIntelligence`
 */
function buildAiInsights(metrics, seoIntelligence) {
  const insights = [];

  if (metrics) {
    buildTrafficInsights(metrics, insights);
    buildCtrInsights(metrics, insights);
  }

  if (seoIntelligence && seoIntelligence.connected) {
    buildRankingInsights(seoIntelligence.rankingImpact, insights);
    buildOptimizationInsights(seoIntelligence, insights);
  }

  insights.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4));

  return {
    generatedFrom: 'calculated-metrics',
    count: insights.length,
    insights
  };
}

module.exports = { buildAiInsights };
