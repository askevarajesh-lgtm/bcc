const WorkspaceReport = require('../models/workspaceReport.model');
const WorkspaceReportSnapshot = require('../models/workspaceReportSnapshot.model');
const WorkspaceReportMetrics = require('../models/workspaceReportMetrics.model');
const WorkspaceReportExecution = require('../models/workspaceReportExecution.model');

const reportMetricsService = require('./reportMetrics.service');
const chartBuilderService = require('./chartBuilder.service');
const reportBuilderService = require('./reportBuilder.service');
const openaiReportProvider = require('./reportProviders/openaiReportProvider');

class ReportGenerationService {
  /**
   * Main entry point for asynchronous report generation pipeline.
   * This should be called by a background job queue worker.
   */
  async generateReportPipeline(reportId, projectId, workspaceId, auditDataList) {
    const startTime = Date.now();
    let executionLog = null;
    let report = await WorkspaceReport.findById(reportId);

    try {
      if (!report) throw new Error(`Report ${reportId} not found`);

      // 1. Initialize Execution Log
      executionLog = new WorkspaceReportExecution({
        reportId, projectId,
        logs: [{ level: 'info', message: 'Pipeline started' }]
      });
      await executionLog.save();

      report.reportStatus = 'Running';
      await report.save();

      // 2. Load & Store Snapshot (Immutable)
      executionLog.logs.push({ level: 'info', message: 'Creating snapshot' });
      report.reportStatus = 'Collecting Metrics';
      await report.save();

      const snapshot = new WorkspaceReportSnapshot({
        reportId, projectId,
        auditSnapshot: auditDataList.length > 0 ? auditDataList[0] : null
        // Additional snapshots would be populated here
      });
      await snapshot.save();
      report.snapshot = snapshot._id;

      // 3. Calculate Metrics
      const metrics = reportMetricsService.calculateMetrics(snapshot);
      const metricsDoc = new WorkspaceReportMetrics({
        reportId, projectId, ...metrics
      });
      await metricsDoc.save();
      report.metrics = metricsDoc._id;

      // 4. Generate Chart Definitions
      executionLog.logs.push({ level: 'info', message: 'Building charts' });
      report.reportStatus = 'Building Charts';
      await report.save();

      const charts = chartBuilderService.buildChartDefinitions(metrics, /* historical */ []);
      report.chartDefinitions = charts;

      // 5. Generate AI Sections
      executionLog.logs.push({ level: 'info', message: 'Generating AI sections' });
      report.reportStatus = 'Generating AI';
      await report.save();

      const aiLatencyStart = Date.now();
      const aiSections = {};
      try {
        // Run AI generation asynchronously but wait for it.
        // In an advanced setup, these could run in parallel with Promise.allSettled.
        aiSections.executiveSummary = await openaiReportProvider.generateSection(metrics, 'executiveSummary', 'professional', workspaceId);
        aiSections.actionPlan = await openaiReportProvider.generateSection(metrics, 'actionPlan', 'professional', workspaceId);
      } catch (aiErr) {
        executionLog.logs.push({ level: 'warn', message: `AI generation failed: ${aiErr.message}` });
        // Fallback or partial results strategy
      }
      executionLog.aiLatencyMs = Date.now() - aiLatencyStart;

      // 6. Build Final Report
      const structuredData = reportBuilderService.buildStructuredReport(metrics, charts, aiSections);
      
      // Update report with structured data
      report.executiveSummary = structuredData.executiveSummary ? JSON.stringify(structuredData.executiveSummary) : null;
      report.actionPlan = structuredData.actionPlan ? JSON.stringify(structuredData.actionPlan) : null;

      // Legacy fallback Markdown
      report.content = reportBuilderService.buildMarkdownFallback(structuredData);

      // 7. Store & Complete
      report.reportStatus = 'Completed';
      report.status = 'completed';
      report.generatedAt = new Date();
      await report.save();

      executionLog.generationDurationMs = Date.now() - startTime;
      executionLog.logs.push({ level: 'info', message: 'Pipeline completed successfully' });
      await executionLog.save();

      // 8. (Optional) Trigger Export Queue if needed
      // reportExportService.queueExport(reportId, report.format);

      return report;
    } catch (error) {
      if (executionLog) {
        executionLog.logs.push({ level: 'error', message: `Pipeline failed: ${error.message}` });
        executionLog.failureReason = error.message;
        executionLog.generationDurationMs = Date.now() - startTime;
        await executionLog.save();
      }
      if (report) {
        report.reportStatus = 'Failed';
        report.status = 'failed';
        await report.save();
      }
      throw error;
    }
  }
}

module.exports = new ReportGenerationService();
