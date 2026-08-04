const schemaAgent = require('../schemaAgent.service');
const WorkspaceProject = require('../../models/workspaceProject.model');
const WorkspaceSchemaMarkup = require('../../models/workspaceSchemaMarkup.model');
const logger = require('../../../aiCore/logger.service');

const TAG = 'ActionGenerateSchema';

module.exports = {
  id: 'generate_schema',
  name: 'Generate Structured Data / Schema Markup',
  category: 'Schema & Structured Data',
  icon: 'Code',
  description: 'Generates valid JSON-LD structured data (Article, FAQ, Product, Organization, BreadcrumbList) validated against Schema.org standards.',

  documentation: {
    overview: 'Produces Schema.org valid JSON-LD blocks ready for injection into HTML headers to achieve rich snippet SERP features.',
    inputsDoc: [
      { name: 'schemaType', desc: 'Target Schema.org Type (Article, FAQPage, Organization, Product, BreadcrumbList)', type: 'string', default: 'Article' },
      { name: 'targetUrl', desc: 'Page URL for which schema is generated', type: 'string', required: false },
      { name: 'autoValidate', desc: 'Verify JSON-LD against Google Rich Results standards', type: 'boolean', default: true }
    ],
    outputsDoc: [
      { name: 'schemaId', desc: 'WorkspaceSchemaMarkup record ID', type: 'string' },
      { name: 'jsonLd', desc: 'Full JSON-LD structured markup object', type: 'object' },
      { name: 'validationStatus', desc: 'Validation outcome (Valid, Warnings, Errors)', type: 'string' },
      { name: 'scriptTagHtml', desc: 'Ready-to-paste script tag HTML snippet', type: 'string' },
      { name: 'pagesCount', desc: 'Number of pages schema is generated for', type: 'number' },
      { name: 'errors', desc: 'List of validation errors', type: 'array' },
      { name: 'warnings', desc: 'List of validation warnings', type: 'array' }
    ]
  },

  capabilities: {
    supportsScheduling: true,
    supportsSimulation: true,
    supportsRetry: true
  },

  estimatedRuntimeMs: 15000,
  estimatedCost: { apiCalls: 1, aiTokens: 300, thirdPartyCalls: 0 },
  dependencies: [],
  permissions: ['seo:schema:generate'],

  getInputSchema() {
    return [
      { name: 'schemaType', label: 'Schema Type', type: 'select', defaultValue: 'Article', options: [
        { label: 'Article / BlogPosting', value: 'Article' },
        { label: 'FAQPage', value: 'FAQPage' },
        { label: 'Organization & Brand', value: 'Organization' },
        { label: 'Product & Offer', value: 'Product' },
        { label: 'BreadcrumbList', value: 'BreadcrumbList' },
        { label: 'SoftwareApplication', value: 'SoftwareApplication' }
      ]},
      { name: 'targetUrl', label: 'Page URL', type: 'text', placeholder: 'https://askeva.io/blog/seo-automation' },
      { name: 'autoValidate', label: 'Validate Rich Snippet Compliance', type: 'switch', defaultValue: true }
    ];
  },

  getOutputSchema() {
    return {
      schemaId: { type: 'string', description: 'Schema record ID' },
      jsonLd: { type: 'object', description: 'Structured JSON-LD object' },
      validationStatus: { type: 'string', description: 'Validation status' },
      scriptTagHtml: { type: 'string', description: 'HTML script tag string' },
      pagesCount: { type: 'number', description: 'Pages processed count' },
      errors: { type: 'array', description: 'Validation errors list' },
      warnings: { type: 'array', description: 'Validation warnings list' }
    };
  },

  validate(config) {
    return { valid: true };
  },

  async execute(config = {}, context = {}) {
    const projectId = context.projectId;
    logger.info(TAG, `Executing Schema Generator for project ${projectId}`);

    const project = await WorkspaceProject.findById(projectId);
    const workspaceId = project?.companyId || project?.createdBy || context.userId;

    if (context.isSimulation) {
      return {
        success: true,
        schemaId: `sim_schema_${Date.now()}`,
        jsonLd: {},
        validationStatus: 'Valid',
        scriptTagHtml: '',
        pagesCount: 1,
        errors: [],
        warnings: []
      };
    }

    try {
      if (project) {
        await schemaAgent.run(projectId, workspaceId);
      }
    } catch (err) {
      logger.warn(TAG, `Schema agent execution error: ${err.message}`);
    }

    const schemaDoc = await WorkspaceSchemaMarkup.findOne({ projectId }).sort({ createdAt: -1 }).lean();

    if (!schemaDoc) {
      return {
        success: false,
        error: 'Schema generation failed or no schema record found for this project.',
        schemaId: null
      };
    }

    const pages = schemaDoc.agent?.pages || [];
    // Extract the primary page's schema matches targetUrl or the first page
    const targetUrl = config.targetUrl || '';
    const cleanTargetUrl = targetUrl.replace(/\/$/, '').toLowerCase();

    let matchedPage = pages.find(p => {
      const pUrl = (p.pageUrl || '').replace(/\/$/, '').toLowerCase();
      return pUrl && pUrl.includes(cleanTargetUrl);
    });

    if (!matchedPage && pages.length > 0) {
      matchedPage = pages[0];
    }

    const jsonLd = matchedPage?.jsonLd || {};
    const validation = matchedPage?.validation || { isValid: false, errors: [], warnings: [] };
    const validationStatus = validation.errors?.length > 0 ? 'Errors' : (validation.warnings?.length > 0 ? 'Warnings' : 'Valid');
    const scriptTagHtml = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n</script>`;

    return {
      success: true,
      schemaId: schemaDoc._id.toString(),
      jsonLd,
      validationStatus,
      scriptTagHtml,
      pagesCount: pages.length,
      errors: validation.errors || [],
      warnings: validation.warnings || [],
      richResultEligibility: validation.richResultEligibility || [],
      pages: pages.map(p => ({
        pageUrl: p.pageUrl,
        pageType: p.pageType,
        schemaTypes: p.schemaTypes,
        jsonLd: p.jsonLd,
        validation: p.validation,
        rationale: p.rationale
      })),
      completedAt: schemaDoc.completedAt ? new Date(schemaDoc.completedAt).toISOString() : null
    };
  }
};
