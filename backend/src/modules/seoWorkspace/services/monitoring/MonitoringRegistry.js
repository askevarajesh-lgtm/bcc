/**
 * MonitoringRegistry.js
 * Central registry for all plug-and-play monitors.
 */
class MonitoringRegistry {
  constructor() {
    this.monitors = new Map();
  }

  /**
   * Register a new monitor plugin.
   * @param {MonitorBase} monitorInstance 
   */
  register(monitorInstance) {
    if (!monitorInstance || typeof monitorInstance.runLifecycle !== 'function') {
      throw new Error('Monitor must implement the MonitorBase interface');
    }
    this.monitors.set(monitorInstance.name, monitorInstance);
  }

  /**
   * Get all registered monitors.
   */
  getAllMonitors() {
    return Array.from(this.monitors.values());
  }

  /**
   * Get a specific monitor by name.
   */
  getMonitor(name) {
    return this.monitors.get(name);
  }
}

// Singleton pattern
const registry = new MonitoringRegistry();

module.exports = registry;
