/**
 * MonitorBase.js
 * The standard interface for all Monitoring Plugins (KeywordMonitor, CWVMonitor, etc.).
 * Ensures all monitors follow the exact same lifecycle.
 */
class MonitorBase {
  constructor(options = {}) {
    this.name = this.constructor.name;
    this.options = options;
    this.logger = require('../../../aiCore/logger.service');
  }

  /**
   * Initialize any required clients or configurations before collection.
   */
  async initialize(context) {
    this.logger.debug(this.name, `Initializing monitor`);
    return true;
  }

  /**
   * Collect raw data from providers (DataForSEO, Search Console, etc.).
   */
  async collect(context) {
    throw new Error(`${this.name} must implement collect()`);
  }

  /**
   * Validate the collected raw data.
   */
  async validate(rawData) {
    return true;
  }

  /**
   * Normalize the raw provider data into the unified Snapshot structure.
   */
  async normalize(rawData) {
    throw new Error(`${this.name} must implement normalize()`);
  }

  /**
   * Analyze the normalized data for specific insights (e.g., trend drops).
   */
  async analyze(normalizedData, previousSnapshot) {
    return {};
  }

  /**
   * Generate events (e.g., 'KeywordDropped') based on the analysis.
   */
  async generateEvents(analysis, context) {
    return [];
  }

  /**
   * Generate the health impact score delta based on the analysis.
   * E.g., return { technicalSeo: -5 } if robots.txt failed.
   */
  async generateHealthImpact(analysis) {
    return {};
  }

  /**
   * Cleanup any resources.
   */
  async cleanup(context) {
    this.logger.debug(this.name, `Cleanup complete`);
    return true;
  }

  /**
   * The template method that executes the full lifecycle for this monitor.
   */
  async runLifecycle(context) {
    await this.initialize(context);
    
    const rawData = await this.collect(context);
    await this.validate(rawData);
    
    const normalizedData = await this.normalize(rawData);
    const analysis = await this.analyze(normalizedData, context.previousSnapshot);
    const events = await this.generateEvents(analysis, context);
    const healthImpact = await this.generateHealthImpact(analysis);
    
    await this.cleanup(context);

    return {
      normalizedData,
      analysis,
      events,
      healthImpact
    };
  }
}

module.exports = MonitorBase;
