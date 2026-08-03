const WorkspaceProject = require('../models/workspaceProject.model');
const WorkspaceImageSeo = require('../models/workspaceImageSeo.model');
const WorkspaceTask = require('../models/workspaceTask.model');
const CrawlService = require('../../seoIntelligence/services/crawl.service');
const auditLogService = require('./auditLog.service');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const retry = require('../../aiCore/retry.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const agentLoader = require('../../aiCore/agentLoader.service');

const AGENT_KEY = 'image-seo-agent';
const TAG = 'ImageSeoAgent';

const VALID_RECOMMENDATION_TYPES = ['alt_text', 'filename_slug', 'missing_dimensions', 'lazy_loading'];
const IMAGE_CRAWL_PAGE_LIMIT = 15; // same small, targeted pass size as schemaAgent — not a full content crawl
const MAX_PAGES_IN_PROMPT = 12;
const MAX_IMAGES_PER_RUN = 20; // cap how many image recommendations get generated per run
const ALT_TEXT_MIN_LENGTH = 8;
const ALT_TEXT_MAX_LENGTH = 125; // hard ceiling per the image-alt-text-optimization skill

const GENERIC_ALT_VALUES = new Set(['image', 'photo', 'picture', 'graphic', 'img', 'untitled', 'placeholder']);

const GENERIC_FILENAME_PATTERNS = [
  /^img[-_]?\d+$/i,
  /^dsc[-_]?\d+$/i,
  /^screenshot[-_ ]?\d*/i,
  /^image[-_]?\d*$/i,
  /^photo[-_]?\d*$/i,
  /^\d{6,}$/, // bare long numeric hash
  /^[a-f0-9]{16,}$/i // hex hash
];

function extractFilename(src) {
  try {
    const u = new URL(src);
    const last = u.pathname.split('/').filter(Boolean).pop() || '';
    return decodeURIComponent(last);
  } catch (error) {
    const parts = String(src).split('?')[0].split('/');
    return parts[parts.length - 1] || '';
  }
}

function baseName(filename) {
  const idx = filename.lastIndexOf('.');
  return idx > 0 ? filename.slice(0, idx) : filename;
}

function isGenericFilename(filename) {
  if (!filename) return false;
  const base = baseName(filename);
  if (/[\s()]/.test(filename)) return true; // raw spaces/parens break URL hygiene
  return GENERIC_FILENAME_PATTERNS.some((re) => re.test(base));
}

function isGenericAlt(alt, filename) {
  if (!alt) return false; // handled by missingAlt separately
  const normalized = alt.trim().toLowerCase();
  if (GENERIC_ALT_VALUES.has(normalized)) return true;
  const base = baseName(filename || '').toLowerCase();
  // alt text that just echoes the filename (with separators normalized)
  const normalizedBase = base.replace(/[-_]+/g, ' ').trim();
  return normalizedBase.length > 0 && normalized === normalizedBase;
}

function validateAltTextValue(value) {
  const errors = [];
  const trimmed = (value || '').trim();
  if (!trimmed) errors.push('Proposed alt text is empty');
  if (trimmed.length > ALT_TEXT_MAX_LENGTH) errors.push(`Proposed alt text exceeds ${ALT_TEXT_MAX_LENGTH} characters`);
  if (trimmed && trimmed.length < ALT_TEXT_MIN_LENGTH) errors.push(`Proposed alt text is shorter than ${ALT_TEXT_MIN_LENGTH} characters`);
  if (/^(image|picture|photo|graphic) of/i.test(trimmed)) errors.push('Proposed alt text starts with a redundant "image/picture of" phrase');
  const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  const counts = {};
  words.forEach((w) => { counts[w] = (counts[w] || 0) + 1; });
  const stuffed = Object.entries(counts).find(([w, c]) => w.length > 3 && c >= 3);
  if (stuffed) errors.push(`Proposed alt text repeats "${stuffed[0]}" ${stuffed[1]} times (keyword stuffing)`);
  return errors;
}

function validateFilenameSlugValue(value, currentFilename) {
  const errors = [];
  const trimmed = (value || '').trim();
  if (!trimmed) {
    errors.push('Proposed filename slug is empty');
    return errors;
  }
  const currentExt = (currentFilename.match(/\.[a-z0-9]+$/i) || [''])[0].toLowerCase();
  if (currentExt && !trimmed.toLowerCase().endsWith(currentExt)) {
    errors.push(`Proposed slug does not preserve the original extension "${currentExt}"`);
  }
  const stem = currentExt ? trimmed.slice(0, -currentExt.length) : trimmed;
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(stem)) {
    errors.push('Proposed slug must be lowercase, hyphen-separated, no spaces/underscores/parentheses');
  }
  if (stem.split('-').length > 6) errors.push('Proposed slug is longer than 6 words');
  return errors;
}

function validateRecommendation(rec, candidate) {
  if (rec.recommendationType === 'alt_text') return validateAltTextValue(rec.proposedValue);
  if (rec.recommendationType === 'filename_slug') return validateFilenameSlugValue(rec.proposedValue, candidate.filename);
  return []; // missing_dimensions / lazy_loading are advisory text, not format-validated
}

/**
 * @param {Object} project - a WorkspaceProject document
 * @returns {Promise<{ pages: Array, dataSource: string }>}
 */
async function collectImageSignals(project) {
  const rootUrl = /^https?:\/\//i.test(project.domain) ? project.domain : `https://${project.domain}`;

  const crawlResult = await retry.withRetry(() => new CrawlService(rootUrl, IMAGE_CRAWL_PAGE_LIMIT).run(), { retries: 1 })
    .catch((error) => {
      logger.warn(TAG, `Image-signal crawl failed for ${rootUrl}, continuing with an empty page set: ${error.message}`, { projectId: project._id });
      return { pages: [] };
    });

  const rawPages = (crawlResult.pages || []).filter((p) => p.status === 200 && p.indexable !== false);

  const pages = rawPages.map((p) => {
    const rawImages = Array.isArray(p.images) ? p.images : [];
    const images = rawImages.map((img, idx) => {
      const filename = extractFilename(img.src);
      const currentAlt = (img.alt || '').trim();
      const missingAlt = currentAlt.length === 0;
      return {
        src: img.src,
        currentAlt,
        currentTitle: (img.title || '').trim(),
        hasWidthHeight: Boolean(img.width && img.height),
        loadingAttr: img.loading || '',
        isLikelyHero: idx === 0, // first <img> encountered on the page — never a lazy-load candidate
        filename,
        missingAlt,
        genericAlt: !missingAlt && isGenericAlt(currentAlt, filename),
        genericFilename: isGenericFilename(filename)
      };
    });
    return {
      url: p.final_url || p.url,
      title: p.title || '',
      metaDescription: p.meta_description || '',
      h1: p.h1 || '',
      images
    };
  });

  return { pages, dataSource: pages.length > 0 ? 'crawl' : 'internal-only' };
}

function buildCandidates(pages) {
  const candidates = [];
  pages.forEach((page) => {
    page.images.forEach((img) => {
      const eligibleTypes = [];
      if (img.missingAlt || img.genericAlt) eligibleTypes.push('alt_text');
      if (img.genericFilename) eligibleTypes.push('filename_slug');
      if (!img.hasWidthHeight) eligibleTypes.push('missing_dimensions');
      if (!img.isLikelyHero && !img.loadingAttr) eligibleTypes.push('lazy_loading');
      if (eligibleTypes.length > 0) {
        candidates.push({
          pageUrl: page.url,
          pageTitle: page.title,
          pageH1: page.h1,
          src: img.src,
          filename: img.filename,
          currentAlt: img.currentAlt,
          eligibleTypes
        });
      }
    });
  });
  return candidates;
}

/**
 * @param {Object} project
 * @param {Array} pages - from collectImageSignals
 * @param {string} workspaceId
 * @returns {Promise<{ summary: string, images: Array }>}
 */
async function generateImageSeoRecommendations(project, pages, workspaceId) {
  const candidates = buildCandidates(pages).slice(0, MAX_IMAGES_PER_RUN);
  if (candidates.length === 0) {
    return { summary: 'No images with missing/generic alt text, generic filenames, or missing dimensions were found.', images: [] };
  }

  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: project._id });
  const promptPages = pages.slice(0, MAX_PAGES_IN_PROMPT);

  const prompt = `You are the Image SEO Agent for ${project.name} (${project.domain}). For each flagged image below, propose recommendations ONLY for the recommendation type(s) listed in its "eligibleTypes" — do not propose a type that isn't listed for that image, and do not invent an image that isn't in the list.

Flagged images (grounded in what the crawl actually measured — do not invent scene content beyond the page's title/H1):
${JSON.stringify(candidates, null, 2)}

Page context (for grounding alt text / filename descriptions only):
${JSON.stringify(promptPages.map((p) => ({ url: p.url, title: p.title, metaDescription: p.metaDescription, h1: p.h1 })), null, 2)}
${skillsBlock}
${memoryBlock}

Respond with a JSON object of this exact shape:
{
  "summary": "2-4 sentence summary of what was generated and why",
  "images": [
    {
      "pageUrl": "must exactly match one candidate's pageUrl above",
      "src": "must exactly match that candidate's src above",
      "recommendationType": "alt_text | filename_slug | missing_dimensions | lazy_loading — must be in that candidate's eligibleTypes",
      "currentValue": "the current alt text or filename, empty string if none",
      "proposedValue": "the new alt text (8-125 chars, no keyword stuffing) or new filename slug (lowercase-hyphenated, extension preserved); for missing_dimensions/lazy_loading, a short actionable instruction instead of a value",
      "rationale": "1-2 sentence justification grounded in the page context given"
    }
  ]
}
One recommendation object per (image, recommendationType) pair — an image with two eligible types can produce two objects. Respond ONLY with valid JSON, no markdown formatting or commentary.`;

  const raw = await aiEngine.complete({
    workspaceId,
    agentKey: AGENT_KEY,
    projectId: project._id,
    messages: [{ role: 'user', content: prompt }],
    model: agentConfig.modelName,
    temperature: 0.3,
    maxTokens: 2500,
    jsonMode: true,
    retryOptions: { retries: 2 }
  });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logger.error(TAG, `Failed to parse AI image-seo-generation JSON for project ${project._id}: ${error.message}`, { projectId: project._id });
    parsed = { summary: 'Automated generation did not return structured output; manual review recommended.', images: [] };
  }

  const candidateByKey = new Map(candidates.map((c) => [`${c.pageUrl}=>${c.src}`, c]));
  const generated = (Array.isArray(parsed.images) ? parsed.images : [])
    .filter((r) => r.pageUrl && r.src && VALID_RECOMMENDATION_TYPES.includes(r.recommendationType))
    .filter((r) => {
      const candidate = candidateByKey.get(`${r.pageUrl}=>${r.src}`);
      return candidate && candidate.eligibleTypes.includes(r.recommendationType);
    })
    .slice(0, MAX_IMAGES_PER_RUN)
    .map((r) => {
      const candidate = candidateByKey.get(`${r.pageUrl}=>${r.src}`);
      const validationErrors = validateRecommendation(r, candidate);
      return {
        pageUrl: r.pageUrl,
        src: r.src,
        recommendationType: r.recommendationType,
        currentValue: r.currentValue || candidate.currentAlt || candidate.filename || '',
        proposedValue: r.proposedValue || '',
        rationale: (r.rationale || '') + (validationErrors.length ? ` [VALIDATION: ${validationErrors.join('; ')}]` : ''),
        isValid: validationErrors.length === 0
      };
    });

  return { summary: parsed.summary || '', images: generated };
}

/**
 * @param {string} projectId
 * @param {string} [workspaceId]
 * @returns {Promise<Object>} the saved WorkspaceImageSeo document
 */
async function run(projectId, workspaceId) {
  const project = await WorkspaceProject.findById(projectId);
  if (!project) throw new Error('Project not found');

  const agencyId = workspaceId || project.createdBy || project.companyId;

  return executionQueue.run(`image-seo-agent:${projectId}`, async () => {
    const executionId = `imageSeoAgent:${projectId}:${Date.now()}`;
    const startedAt = Date.now();

    logger.logExecution({ executionId, source: 'imageSeoAgent', agentKey: AGENT_KEY, projectId, status: 'started' });

    try {
      const { pages: pageSignals, dataSource } = await collectImageSignals(project);
      const { summary, images } = await generateImageSeoRecommendations(project, pageSignals, agencyId);

      const imageSeoRun = await WorkspaceImageSeo.create({
        projectId: project._id,
        agencyId,
        status: 'completed',
        inputs: { pages: pageSignals, dataSource },
        completedAt: new Date(),
        agent: {
          agentKey: AGENT_KEY,
          summary,
          images,
          approvalStatus: images.length > 0 ? 'Pending Approval' : 'Not Requested'
        }
      });

      logger.logExecution({
        executionId, source: 'imageSeoAgent', agentKey: AGENT_KEY, projectId,
        status: 'succeeded', durationMs: Date.now() - startedAt,
        meta: {
          imageSeoRunId: imageSeoRun._id, recommendationCount: images.length,
          invalidCount: images.filter((i) => !i.isValid).length
        }
      });

      return imageSeoRun;
    } catch (error) {
      logger.logExecution({
        executionId, source: 'imageSeoAgent', agentKey: AGENT_KEY, projectId,
        status: 'failed', durationMs: Date.now() - startedAt, error: error.message
      });
      throw error;
    }
  });
}

/**
 * @param {string} imageSeoRunId
 * @param {string} projectId
 * @param {string} userId
 */
async function approveImageSeoRecommendations(imageSeoRunId, projectId, userId) {
  const imageSeoRun = await WorkspaceImageSeo.findOne({ _id: imageSeoRunId, projectId });
  if (!imageSeoRun) throw new Error('Image SEO run not found');

  if (!imageSeoRun.agent || imageSeoRun.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Publish Gate Blocked: Image SEO recommendations must be 'Pending Approval' to approve. Current status is '${imageSeoRun.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  imageSeoRun.agent.approvalStatus = 'Approved';
  imageSeoRun.agent.approvedBy = userId;
  imageSeoRun.agent.approvedAt = new Date();
  imageSeoRun.agent.rejectionReason = null;

  const tasksToCreate = (imageSeoRun.agent.images || []).map((r) => ({
    projectId,
    pageUrl: r.pageUrl,
    taskType: 'Image Optimization',
    description: `[Image SEO Agent] ${r.recommendationType.replace(/_/g, ' ')} for ${r.src} on ${r.pageUrl}: "${r.proposedValue}"`,
    proposedChanges: { src: r.src, recommendationType: r.recommendationType, currentValue: r.currentValue, proposedValue: r.proposedValue, rationale: r.rationale },
    status: 'Pending'
  }));

  let createdTasks = [];
  if (tasksToCreate.length > 0) {
    createdTasks = await WorkspaceTask.insertMany(tasksToCreate);
    imageSeoRun.agent.generatedTaskIds = createdTasks.map((t) => t._id);
  }

  await imageSeoRun.save();

  auditLogService.record({
    targetType: 'ImageSeo', targetId: imageSeoRun._id, projectId,
    action: 'image_seo_recommendations_approved', fromValue: 'Pending Approval', toValue: 'Approved', userId
  });

  return { imageSeoRun, createdTasks };
}

/**
 * Human Approval Gate — reject path.
 */
async function rejectImageSeoRecommendations(imageSeoRunId, projectId, userId, reason) {
  const imageSeoRun = await WorkspaceImageSeo.findOne({ _id: imageSeoRunId, projectId });
  if (!imageSeoRun) throw new Error('Image SEO run not found');

  if (!imageSeoRun.agent || imageSeoRun.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Image SEO recommendations must be 'Pending Approval' to reject. Current status is '${imageSeoRun.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  imageSeoRun.agent.approvalStatus = 'Rejected';
  imageSeoRun.agent.rejectionReason = reason || null;
  await imageSeoRun.save();

  auditLogService.record({
    targetType: 'ImageSeo', targetId: imageSeoRun._id, projectId,
    action: 'image_seo_recommendations_rejected', fromValue: 'Pending Approval', toValue: 'Rejected', userId
  });

  await recordExcludedImagesIfAny(imageSeoRun, projectId, userId, reason);

  return imageSeoRun;
}

async function recordExcludedImagesIfAny(imageSeoRun, projectId, userId, reason) {
  try {
    const images = imageSeoRun.agent?.images || [];
    if (images.length === 0) return;

    const project = await WorkspaceProject.findById(projectId);
    const agencyId = project?.createdBy || project?.companyId || userId;

    for (const r of images.slice(0, 5)) {
      await sharedMemory.remember({
        agencyId,
        projectId,
        title: `Rejected image SEO recommendation: ${r.recommendationType} for ${r.src}`,
        description: `The Image SEO Agent's ${r.recommendationType} recommendation for ${r.src} on ${r.pageUrl} was rejected.`,
        content: reason
          ? `Do not propose ${r.recommendationType} for ${r.src} again. Reason given: ${reason}`
          : `Do not propose ${r.recommendationType} for ${r.src} again.`,
        type: 'do_not_do'
      });
    }
  } catch (error) {
    logger.warn(TAG, `Failed to record excluded-image memory for project ${projectId}: ${error.message}`, { projectId });
  }
}

/**
 * @param {string} projectId
 * @param {number} [limit=20]
 */
async function getExecutionHistory(projectId, limit = 20) {
  const ExecutionLog = require('../../aiCore/executionLog.model');

  return ExecutionLog.find({
    projectId,
    $or: [{ agentKey: AGENT_KEY }, { source: 'imageSeoAgent' }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  AGENT_KEY,
  run,
  collectImageSignals,
  generateImageSeoRecommendations,
  validateAltTextValue,
  validateFilenameSlugValue,
  approveImageSeoRecommendations,
  rejectImageSeoRecommendations,
  getExecutionHistory
};
