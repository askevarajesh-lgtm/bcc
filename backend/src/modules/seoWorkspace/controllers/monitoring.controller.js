const WorkspaceMonitoringSnapshot = require('../models/workspaceMonitoringSnapshot.model');
const WorkspaceMonitoringAlert = require('../models/workspaceMonitoringAlert.model');
const WorkspaceMonitoringSettings = require('../models/workspaceMonitoringSettings.model');
const monitoringEngine = require('../services/monitoring/monitoringEngine.service');
const monitoringHistory = require('../services/monitoring/monitoringHistory.service');
const response = require('../../../utils/response');

/**
 * Get the latest Snapshot (Single Source of Truth)
 */
exports.getDashboardOverview = async (req, res) => {
  try {
    const { projectId } = req.params;
    const snapshot = await WorkspaceMonitoringSnapshot.findOne({ projectId }).sort({ timestamp: -1 }).lean();
    if (!snapshot) return response.sendSuccess(res, { healthScore: 100, isPlaceholder: true }, 'No data yet');
    
    response.sendSuccess(res, snapshot);
  } catch (error) {
    response.sendError(res, error.message);
  }
};

/**
 * Trigger Manual Scan
 */
exports.triggerScan = async (req, res) => {
  try {
    const { projectId } = req.params;
    const result = await monitoringEngine.runScan(projectId, { priority: 10 });
    
    if (result.alreadyRunning) {
      return res.status(202).json({ success: true, message: 'Scan already running', ...result });
    }
    
    response.sendSuccess(res, result, 'Scan Queued successfully');
  } catch (error) {
    response.sendError(res, error.message);
  }
};

/**
 * Get Scan Status
 */
exports.getScanStatus = async (req, res) => {
  try {
    const { scanId } = req.params;
    const status = await monitoringEngine.getScanStatus(scanId);
    if (!status) return res.status(404).json({ success: false, error: 'Scan not found' });
    
    response.sendSuccess(res, status);
  } catch (error) {
    response.sendError(res, error.message);
  }
};

/**
 * Get Alerts
 */
exports.getAlerts = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status = 'Open' } = req.query;
    
    const alerts = await WorkspaceMonitoringAlert.find({ projectId, status }).sort({ lastDetected: -1 }).lean();
    response.sendSuccess(res, alerts);
  } catch (error) {
    response.sendError(res, error.message);
  }
};

/**
 * Acknowledge or Resolve Alert
 */
exports.updateAlertStatus = async (req, res) => {
  try {
    const { projectId, alertId } = req.params;
    const { status, resolutionNotes } = req.body;
    
    if (!['Acknowledged', 'Resolved', 'Dismissed'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }
    
    const update = { status };
    if (status === 'Resolved') update.resolvedAt = new Date();
    if (status === 'Acknowledged') update.acknowledgedAt = new Date();
    if (resolutionNotes) update.resolutionNotes = resolutionNotes;
    
    const alert = await WorkspaceMonitoringAlert.findOneAndUpdate(
      { _id: alertId, projectId },
      { $set: update },
      { new: true }
    );
    
    response.sendSuccess(res, alert, 'Alert updated');
  } catch (error) {
    response.sendError(res, error.message);
  }
};

/**
 * Get History (for charts)
 */
exports.getHistory = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { timeframeDays = 30 } = req.query;
    
    const history = await monitoringHistory.getHistory(projectId, timeframeDays);
    response.sendSuccess(res, history);
  } catch (error) {
    response.sendError(res, error.message);
  }
};

/**
 * Get/Update Settings
 */
exports.getSettings = async (req, res) => {
  try {
    const { projectId } = req.params;
    let settings = await WorkspaceMonitoringSettings.findOne({ projectId }).lean();
    if (!settings) settings = {}; // Provide defaults on frontend
    
    response.sendSuccess(res, settings);
  } catch (error) {
    response.sendError(res, error.message);
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const { projectId } = req.params;
    const settings = await WorkspaceMonitoringSettings.findOneAndUpdate(
      { projectId },
      { $set: req.body },
      { new: true, upsert: true }
    );
    response.sendSuccess(res, settings, 'Settings updated');
  } catch (error) {
    response.sendError(res, error.message);
  }
};
