const MonitorBase = require('../MonitorBase');

class CWVMonitor extends MonitorBase {
  async collect(context) {
    const { project } = context;
    const cwv = project?.analytics?.cwv || {};

    // Standard thresholds: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1
    const lcp = cwv.lcp !== undefined ? cwv.lcp : 2.1; // seconds
    const inp = cwv.inp !== undefined ? cwv.inp : 150; // ms
    const cls = cwv.cls !== undefined ? cwv.cls : 0.05;
    const ttfb = cwv.ttfb !== undefined ? cwv.ttfb : 0.4; // seconds

    return { lcp, inp, cls, ttfb };
  }

  async normalize(rawData) {
    const lcpGood = rawData.lcp <= 2.5;
    const inpGood = rawData.inp <= 200;
    const clsGood = rawData.cls <= 0.1;
    const passesAll = lcpGood && inpGood && clsGood;

    return {
      lcp: rawData.lcp,
      inp: rawData.inp,
      cls: rawData.cls,
      ttfb: rawData.ttfb,
      passedCwvs: passesAll,
      status: passesAll ? 'Good' : (rawData.lcp > 4.0 || rawData.inp > 500 || rawData.cls > 0.25 ? 'Poor' : 'Needs Improvement')
    };
  }

  async analyze(normalizedData) {
    const failedMetrics = [];
    if (normalizedData.lcp > 2.5) failedMetrics.push({ metric: 'LCP', val: normalizedData.lcp, threshold: 2.5 });
    if (normalizedData.inp > 200) failedMetrics.push({ metric: 'INP', val: normalizedData.inp, threshold: 200 });
    if (normalizedData.cls > 0.1) failedMetrics.push({ metric: 'CLS', val: normalizedData.cls, threshold: 0.1 });

    return { failedMetrics, normalizedData };
  }

  async generateEvents(analysis, context) {
    const events = [];
    for (const fm of analysis.failedMetrics) {
      events.push({
        source: this.name,
        projectId: context.projectId,
        eventType: 'CWVDegraded',
        payload: {
          severity: 'High',
          metricName: fm.metric,
          currentValue: fm.val,
          threshold: fm.threshold,
          details: `Core Web Vital ${fm.metric} failed Google threshold (${fm.val} vs target <= ${fm.threshold})`
        }
      });
    }
    return events;
  }

  async generateHealthImpact(analysis) {
    if (analysis.failedMetrics.length >= 2) return { performance: -20 };
    if (analysis.failedMetrics.length === 1) return { performance: -10 };
    return { performance: 5 };
  }
}

module.exports = CWVMonitor;
