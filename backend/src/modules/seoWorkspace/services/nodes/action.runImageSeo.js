const imageSeoAgent = require('../imageSeoAgent.service');
const WorkspaceProject = require('../../models/workspaceProject.model');
const WorkspaceImageSeo = require('../../models/workspaceImageSeo.model');
const logger = require('../../../aiCore/logger.service');

const TAG = 'ActionRunImageSeo';

module.exports = {
  id: 'run_image_seo',
  name: 'Run Image SEO Optimizer',
  category: 'Image SEO',
  icon: 'Image',
  description: 'Scans image assets, identifies missing or non-descriptive ALT text, checks file size bloat, and generates AI alt tags.',

  documentation: {
    overview: 'Analyzes all embedded images on crawled pages, generating descriptive, accessible, keyword-aligned alt text and image title tags.',
    inputsDoc: [
      { name: 'maxImages', desc: 'Maximum images to scan and optimize', type: 'number', default: 30 },
      { name: 'autoGenerateAltText', desc: 'Generate AI alt text for images with missing tags', type: 'boolean', default: true }
    ],
    outputsDoc: [
      { name: 'imagesScanned', desc: 'Total images analyzed', type: 'number' },
      { name: 'missingAltCount', desc: 'Images lacking alt text', type: 'number' },
      { name: 'optimizedAltCount', desc: 'Images with AI-generated alt tags ready for approval', type: 'number' },
      { name: 'images', desc: 'Full image optimization findings list with pageUrl, src, recommendationType, currentValue, proposedValue', type: 'array' }
    ]
  },

  capabilities: {
    supportsScheduling: true,
    supportsSimulation: true,
    supportsRetry: true
  },

  estimatedRuntimeMs: 20000,
  estimatedCost: { apiCalls: 1, aiTokens: 300, thirdPartyCalls: 0 },
  dependencies: [],
  permissions: ['seo:images:optimize'],

  getInputSchema() {
    return [
      { name: 'maxImages', label: 'Max Images to Scan', type: 'number', defaultValue: 30, min: 1, max: 200 },
      { name: 'autoGenerateAltText', label: 'Auto-Generate AI Alt Text', type: 'switch', defaultValue: true }
    ];
  },

  getOutputSchema() {
    return {
      imagesScanned: { type: 'number', description: 'Total images analyzed' },
      missingAltCount: { type: 'number', description: 'Count with missing alt text' },
      optimizedAltCount: { type: 'number', description: 'Count of generated alt tags' },
      images: { type: 'array', description: 'Detailed image SEO recommendations' }
    };
  },

  validate(config) {
    return { valid: true };
  },

  async execute(config = {}, context = {}) {
    const projectId = context.projectId;
    logger.info(TAG, `Executing Image SEO Optimizer for project ${projectId}`);

    const project = await WorkspaceProject.findById(projectId);
    const workspaceId = project?.companyId || project?.createdBy || context.userId;

    if (context.isSimulation) {
      return {
        success: true,
        imagesScanned: Number(config.maxImages) || 28,
        missingAltCount: 4,
        optimizedAltCount: 4,
        images: []
      };
    }

    try {
      if (project) {
        await imageSeoAgent.run(projectId, workspaceId);
      }
    } catch (err) {
      logger.warn(TAG, `Image SEO agent execution error: ${err.message}`);
    }

    const imageSeoDoc = await WorkspaceImageSeo.findOne({ projectId }).sort({ createdAt: -1 }).lean();

    if (!imageSeoDoc) {
      return {
        success: false,
        error: 'Image SEO optimization failed or no completed record found.',
        imagesScanned: 0,
        missingAltCount: 0,
        optimizedAltCount: 0
      };
    }

    const recs = imageSeoDoc.agent?.images || [];
    const missingAltCount = recs.filter(r => r.recommendationType === 'alt_text' && !r.currentValue).length;
    const optimizedAltCount = recs.filter(r => r.proposedValue && r.recommendationType === 'alt_text').length;
    
    // Count unique image sources scanned from input pages
    const pages = imageSeoDoc.inputs?.pages || [];
    const imagesScanned = pages.reduce((sum, p) => sum + (p.images?.length || 0), 0);

    return {
      success: true,
      imageSeoId: imageSeoDoc._id.toString(),
      imagesScanned: imagesScanned || recs.length,
      missingAltCount,
      optimizedAltCount,
      recommendationsCount: recs.length,
      images: recs.map(r => ({
        pageUrl: r.pageUrl,
        src: r.src,
        recommendationType: r.recommendationType,
        currentValue: r.currentValue || '',
        proposedValue: r.proposedValue || '',
        rationale: r.rationale || ''
      })),
      approvalStatus: imageSeoDoc.agent?.approvalStatus || '',
      completedAt: imageSeoDoc.completedAt ? new Date(imageSeoDoc.completedAt).toISOString() : null
    };
  }
};
