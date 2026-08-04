const reportingAgent = require('../reportingAgent.service');
const WorkspaceProject = require('../../models/workspaceProject.model');
const WorkspaceReport = require('../../models/workspaceReport.model');
const logger = require('../../../aiCore/logger.service');

const TAG = 'ActionGenerateReport';

module.exports = {
  id: 'generate_report',
  name: 'Generate Executive SEO Report',
  category: 'Reports & Exports',
  icon: 'BarChart3',
  description: 'Aggregates all project audits, keyword movements, technical fixes, and competitor shifts into an executive PDF/CSV report.',

  documentation: {
    overview: 'Assembles a multi-page executive SEO status report ready for client presentations, stakeholder digests, or automated email attachments.',
    inputsDoc: [
      { name: 'reportType', desc: 'Type of report (monthly_digest, executive_summary, technical_audit, client_presentation)', type: 'string', default: 'executive_summary' },
      { name: 'includeAiInsights', desc: 'Include AI summary commentary and top strategic priorities', type: 'boolean', default: true },
      { name: 'exportFormat', desc: 'Output file format (pdf, csv, markdown)', type: 'string', default: 'pdf' }
    ],
    outputsDoc: [
      { name: 'reportId', desc: 'WorkspaceReport record ID', type: 'string' },
      { name: 'reportPdfUrl', desc: 'Direct URL to download PDF report', type: 'string' },
      { name: 'reportCsvUrl', desc: 'Direct URL to download CSV data export', type: 'string' },
      { name: 'reportMarkdownUrl', desc: 'Direct URL to download Markdown version', type: 'string' },
      { name: 'executiveSummary', desc: 'High-level AI narrative summary string', type: 'string' },
      { name: 'sectionsCount', desc: 'Number of report data sections', type: 'number' },
      { name: 'sections', desc: 'Names of included sections', type: 'array' },
      { name: 'metrics', desc: 'Key performance indicators summary object', type: 'object' },
      { name: 'generatedAt', desc: 'Generation timestamp', type: 'string' }
    ]
  },

  capabilities: {
    supportsScheduling: true,
    supportsSimulation: true,
    supportsRetry: true
  },

  estimatedRuntimeMs: 20000,
  estimatedCost: { apiCalls: 1, aiTokens: 500, thirdPartyCalls: 0 },
  dependencies: [],
  permissions: ['seo:reports:generate'],

  getInputSchema() {
    return [
      { name: 'reportType', label: 'Report Template Type', type: 'select', defaultValue: 'executive_summary', options: [
        { label: 'Executive Leadership Summary', value: 'executive_summary' },
        { label: 'Monthly Client SEO Progress Report', value: 'monthly_digest' },
        { label: 'Technical Infrastructure Audit Report', value: 'technical_audit' },
        { label: 'Keyword Rankings & SERP Movement', value: 'rank_tracking' }
      ]},
      { name: 'includeAiInsights', label: 'Include AI Executive Insights', type: 'switch', defaultValue: true },
      { name: 'exportFormat', label: 'Export Format', type: 'select', defaultValue: 'pdf', options: [
        { label: 'Export as Branded PDF', value: 'pdf' },
        { label: 'Export as Structured CSV', value: 'csv' },
        { label: 'Export as Markdown', value: 'markdown' }
      ]}
    ];
  },

  getOutputSchema() {
    return {
      reportId: { type: 'string', description: 'Report document ID' },
      reportPdfUrl: { type: 'string', description: 'Downloadable PDF URL' },
      reportCsvUrl: { type: 'string', description: 'Downloadable CSV URL' },
      reportMarkdownUrl: { type: 'string', description: 'Downloadable Markdown URL' },
      executiveSummary: { type: 'string', description: 'AI generated summary' },
      sectionsCount: { type: 'number', description: 'Sections count' },
      sections: { type: 'array', description: 'Included sections list' },
      metrics: { type: 'object', description: 'Summary indicators' },
      generatedAt: { type: 'string', description: 'Generation timestamp' }
    };
  },

  validate(config) {
    return { valid: true };
  },

  async execute(config = {}, context = {}) {
    const projectId = context.projectId;
    logger.info(TAG, `Executing Report Generation for project ${projectId}`);

    const project = await WorkspaceProject.findById(projectId);
    const workspaceId = project?.companyId || project?.createdBy || context.userId;

    if (context.isSimulation) {
      return {
        success: true,
        reportId: `sim_rep_${Date.now()}`,
        reportPdfUrl: '',
        reportCsvUrl: '',
        reportMarkdownUrl: '',
        executiveSummary: 'Simulation: SEO performance report assembled successfully.',
        sectionsCount: 4,
        sections: ['Executive Summary', 'Audit Scores', 'Keyword Trends', 'Task Status'],
        metrics: {},
        generatedAt: new Date().toISOString()
      };
    }

    let reportDoc = null;
    try {
      if (project) {
        reportDoc = await reportingAgent.run(projectId, workspaceId, config.reportType || 'executive_summary');
      }
    } catch (err) {
      logger.warn(TAG, `Reporting agent execution error: ${err.message}`);
    }

    if (!reportDoc) {
      reportDoc = await WorkspaceReport.findOne({ projectId }).sort({ createdAt: -1 }).lean();
    }

    if (!reportDoc) {
      return {
        success: false,
        error: 'Report generation failed or no completed report record found.',
        reportId: null
      };
    }

    const reportId = reportDoc._id.toString();
    const format = config.exportFormat || 'pdf';

    return {
      success: true,
      reportId,
      reportPdfUrl: `/api/v1/seo-workspace/projects/${projectId}/reports/${reportId}/download?format=pdf`,
      reportCsvUrl: `/api/v1/seo-workspace/projects/${projectId}/reports/${reportId}/download?format=csv`,
      reportMarkdownUrl: `/api/v1/seo-workspace/projects/${projectId}/reports/${reportId}/download?format=markdown`,
      executiveSummary: reportDoc.agent?.summary || reportDoc.executiveSummary || '',
      sectionsCount: (reportDoc.sections || []).length,
      sections: reportDoc.sections || [],
      metrics: reportDoc.metrics || {},
      status: reportDoc.status || 'completed',
      generatedAt: reportDoc.completedAt ? new Date(reportDoc.completedAt).toISOString() : new Date().toISOString()
    };
  }
};
