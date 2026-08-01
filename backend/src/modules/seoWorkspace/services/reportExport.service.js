const WorkspaceReportExport = require('../models/workspaceReportExport.model');

class ReportExportService {
  /**
   * Queues a background job for generating a heavy export file (e.g., PDF or DOCX)
   * @param {String} reportId 
   * @param {String} projectId 
   * @param {String} format - 'pdf', 'csv', 'docx', etc.
   * @param {String} userId 
   */
  async queueExport(reportId, projectId, format, userId) {
    // Check if an existing export is already processing or completed
    let exportRecord = await WorkspaceReportExport.findOne({ reportId, format });
    
    if (exportRecord && (exportRecord.status === 'completed' || exportRecord.status === 'processing')) {
      return exportRecord;
    }

    if (!exportRecord) {
      exportRecord = new WorkspaceReportExport({
        reportId,
        projectId,
        generatedBy: userId,
        format,
        status: 'queued'
      });
      await exportRecord.save();
    } else {
      exportRecord.status = 'queued';
      exportRecord.failureReason = null;
      await exportRecord.save();
    }

    // Dispatch to background job processor
    // e.g., queue.add('export-report', { exportId: exportRecord._id });
    // For now, simulate asynchronous execution
    this._simulateBackgroundWorker(exportRecord._id);

    return exportRecord;
  }

  /**
   * Simulates the background worker picking up the job
   */
  async _simulateBackgroundWorker(exportId) {
    setTimeout(async () => {
      try {
        const record = await WorkspaceReportExport.findById(exportId);
        if (!record) return;

        record.status = 'processing';
        await record.save();

        // SIMULATE: heavy generation (Puppeteer PDF generation)
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        record.fileUrl = `/exports/reports/${record.reportId}_${record.format}.pdf`;
        record.fileSize = 1024 * 1024; // 1MB simulated
        record.status = 'completed';
        await record.save();
        
      } catch (error) {
        console.error('Export generation failed:', error);
        const record = await WorkspaceReportExport.findById(exportId);
        if (record) {
          record.status = 'failed';
          record.failureReason = error.message;
          await record.save();
        }
      }
    }, 100);
  }
}

module.exports = new ReportExportService();
