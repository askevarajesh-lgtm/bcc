const cheerio = require('cheerio');
const Blog = require('../../blogs/blog.model');
const BlogPost = require('../../blogs/blog-post.model');
const WorkspaceBlogSeo = require('../models/blogSeo.model');

const aiEngine = require('../../aiCore/aiEngine.service');
const executionQueue = require('../../aiCore/executionQueue.service');
const logger = require('../../aiCore/logger.service');
const sharedMemory = require('../../aiCore/sharedMemory.service');
const agentLoader = require('../../aiCore/agentLoader.service');

const AGENT_KEY = 'blog-seo-agent';
const TAG = 'BlogSeoAgent';

const VALID_FINDING_TYPES = [
  'missing_title', 'title_too_short', 'title_too_long', 'duplicate_title',
  'missing_meta_description', 'meta_description_too_short', 'meta_description_too_long', 'duplicate_meta_description',
  'missing_h1', 'multiple_h1', 'skipped_heading_level', 'thin_content', 'missing_excerpt'
];

const METADATA_FINDING_TYPES = new Set([
  'missing_title', 'title_too_short', 'title_too_long', 'duplicate_title',
  'missing_meta_description', 'meta_description_too_short', 'meta_description_too_long', 'duplicate_meta_description',
  'missing_excerpt'
]);

const SEVERITY_BY_FINDING_TYPE = {
  missing_title: 'high',
  missing_meta_description: 'high',
  missing_h1: 'high',
  multiple_h1: 'high',
  title_too_short: 'medium',
  title_too_long: 'medium',
  duplicate_title: 'medium',
  meta_description_too_short: 'medium',
  meta_description_too_long: 'medium',
  duplicate_meta_description: 'medium',
  skipped_heading_level: 'low',
  missing_excerpt: 'low',
  thin_content: 'low'
};

const TITLE_MIN_LENGTH = 30;
const TITLE_MAX_LENGTH = 60;
const META_DESCRIPTION_MIN_LENGTH = 70;
const META_DESCRIPTION_MAX_LENGTH = 160;
const EXCERPT_MAX_LENGTH = 200;
const THIN_CONTENT_WORD_THRESHOLD = 150;
const MAX_SIBLING_POSTS_SCANNED = 200; // a single blog's post list — not a cross-blog crawl

const HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

function validateTitleValue(value, currentValue) {
  const errors = [];
  const trimmed = (value || '').trim();
  if (!trimmed) { errors.push('Proposed title is empty'); return errors; }
  if (trimmed.length > TITLE_MAX_LENGTH + 15) errors.push(`Proposed title is far longer than the ${TITLE_MAX_LENGTH}-character guideline`);
  if (currentValue && trimmed.toLowerCase() === currentValue.trim().toLowerCase()) errors.push('Proposed title is identical to the flagged current title');
  const words = trimmed.toLowerCase().split(/\s+/).filter(Boolean);
  const counts = {};
  words.forEach((w) => { counts[w] = (counts[w] || 0) + 1; });
  const stuffed = Object.entries(counts).find(([w, c]) => w.length > 3 && c >= 3);
  if (stuffed) errors.push(`Proposed title repeats "${stuffed[0]}" ${stuffed[1]} times (keyword stuffing)`);
  return errors;
}

function validateMetaDescriptionValue(value, currentValue, titleValue) {
  const errors = [];
  const trimmed = (value || '').trim();
  if (!trimmed) { errors.push('Proposed meta description is empty'); return errors; }
  if (trimmed.length > META_DESCRIPTION_MAX_LENGTH + 30) errors.push(`Proposed meta description is far longer than the ${META_DESCRIPTION_MAX_LENGTH}-character guideline`);
  if (currentValue && trimmed.toLowerCase() === currentValue.trim().toLowerCase()) errors.push('Proposed meta description is identical to the flagged current description');
  if (titleValue && trimmed.toLowerCase() === titleValue.trim().toLowerCase()) errors.push('Proposed meta description just restates the title');
  return errors;
}

function validateExcerptValue(value, currentValue) {
  const errors = [];
  const trimmed = (value || '').trim();
  if (!trimmed) { errors.push('Proposed excerpt is empty'); return errors; }
  if (trimmed.length > EXCERPT_MAX_LENGTH + 40) errors.push(`Proposed excerpt is far longer than the ${EXCERPT_MAX_LENGTH}-character guideline`);
  if (currentValue && trimmed.toLowerCase() === currentValue.trim().toLowerCase()) errors.push('Proposed excerpt is identical to the flagged current excerpt');
  return errors;
}

function validateFinding(finding, candidate) {
  if (finding.findingType === 'missing_excerpt') {
    return validateExcerptValue(finding.proposedValue, candidate.currentExcerpt);
  }
  if (!METADATA_FINDING_TYPES.has(finding.findingType)) {
    return (finding.rationale || '').trim() ? [] : ['Missing rationale for structural finding'];
  }
  if (finding.findingType.startsWith('title') || finding.findingType === 'duplicate_title') {
    return validateTitleValue(finding.proposedValue, candidate.currentMetaTitle);
  }
  return validateMetaDescriptionValue(finding.proposedValue, candidate.currentMetaDescription, finding.findingType.startsWith('meta') ? candidate.currentMetaTitle : null);
}

function parseBodySignals(html, plainContent) {
  const result = { h1Texts: [], headingSequence: [], wordCount: 0 };
  if (html) {
    try {
      const $ = cheerio.load(html);
      const body = $('body').length ? $('body') : $.root();

      body.find(HEADING_TAGS.join(', ')).each((_, el) => {
        const tag = el.tagName ? el.tagName.toLowerCase() : el.name;
        if (!HEADING_TAGS.includes(tag)) return;
        result.headingSequence.push(tag);
        if (tag === 'h1') result.h1Texts.push($(el).text().trim());
      });

      const bodyClone = body.clone();
      bodyClone.find('script, style, noscript').remove();
      const text = bodyClone.text().replace(/\s+/g, ' ').trim();
      result.wordCount = text.length ? text.split(' ').length : 0;
    } catch (error) {
      logger.warn(TAG, `Failed to parse post html: ${error.message}`);
    }
  }
  if (result.wordCount === 0 && plainContent) {
    const text = String(plainContent).replace(/\s+/g, ' ').trim();
    result.wordCount = text.length ? text.split(' ').length : 0;
  }
  return result;
}

function headingSequenceSkipsLevel(headingSequence) {
  let maxSeen = 0;
  for (const tag of headingSequence) {
    const level = Number(tag.slice(1));
    if (level > maxSeen + 1) return true;
    if (level > maxSeen) maxSeen = level;
  }
  return false;
}

/**
 * @param {Object} post - a BlogPost document
 * @param {Object} blog - the owning Blog document
 * @returns {Promise<Object>} signals matching WorkspaceBlogSeo.inputs
 */
async function collectBlogPostSeoSignals(post, blog) {
  const body = parseBodySignals(post.html, post.content);

  const siblings = await BlogPost.find({
    blogId: blog._id,
    _id: { $ne: post._id },
    isDeleted: false
  }).select('_id metaTitle metaDescription').limit(MAX_SIBLING_POSTS_SCANNED).lean();

  let duplicateMetaTitleOfPostId = null;
  let duplicateMetaDescriptionOfPostId = null;
  if (post.metaTitle || post.metaDescription) {
    for (const sibling of siblings) {
      if (!duplicateMetaTitleOfPostId && post.metaTitle && sibling.metaTitle
        && sibling.metaTitle.trim().toLowerCase() === post.metaTitle.trim().toLowerCase()) {
        duplicateMetaTitleOfPostId = sibling._id;
      }
      if (!duplicateMetaDescriptionOfPostId && post.metaDescription && sibling.metaDescription
        && sibling.metaDescription.trim().toLowerCase() === post.metaDescription.trim().toLowerCase()) {
        duplicateMetaDescriptionOfPostId = sibling._id;
      }
      if (duplicateMetaTitleOfPostId && duplicateMetaDescriptionOfPostId) break;
    }
  }

  return {
    slug: post.slug,
    postTitle: post.title,
    currentMetaTitle: post.metaTitle || '',
    currentMetaDescription: post.metaDescription || '',
    currentExcerpt: post.excerpt || '',
    h1Count: body.h1Texts.length,
    h1Texts: body.h1Texts,
    headingSequence: body.headingSequence,
    skippedHeadingLevel: headingSequenceSkipsLevel(body.headingSequence),
    wordCount: body.wordCount,
    duplicateMetaTitleOfPostId,
    duplicateMetaDescriptionOfPostId,
    dataSource: 'stored-content'
  };
}

function buildEligibleFindingTypes(signals) {
  const eligible = [];

  if (!signals.currentMetaTitle) eligible.push('missing_title');
  else if (signals.currentMetaTitle.length < TITLE_MIN_LENGTH) eligible.push('title_too_short');
  else if (signals.currentMetaTitle.length > TITLE_MAX_LENGTH) eligible.push('title_too_long');
  if (signals.duplicateMetaTitleOfPostId) eligible.push('duplicate_title');

  if (!signals.currentMetaDescription) eligible.push('missing_meta_description');
  else if (signals.currentMetaDescription.length < META_DESCRIPTION_MIN_LENGTH) eligible.push('meta_description_too_short');
  else if (signals.currentMetaDescription.length > META_DESCRIPTION_MAX_LENGTH) eligible.push('meta_description_too_long');
  if (signals.duplicateMetaDescriptionOfPostId) eligible.push('duplicate_meta_description');

  if (signals.h1Count === 0) eligible.push('missing_h1');
  if (signals.h1Count > 1) eligible.push('multiple_h1');
  if (signals.skippedHeadingLevel) eligible.push('skipped_heading_level');
  if (signals.wordCount < THIN_CONTENT_WORD_THRESHOLD) eligible.push('thin_content');
  if (!signals.currentExcerpt) eligible.push('missing_excerpt');

  return eligible;
}

/**
 * @param {Object} blog
 * @param {Object} post
 * @param {Object} signals - from collectBlogPostSeoSignals
 * @param {string} workspaceId
 * @returns {Promise<{ summary: string, findings: Array }>}
 */
async function generateBlogSeoFindings(blog, post, signals, workspaceId) {
  const eligibleFindingTypes = buildEligibleFindingTypes(signals);
  if (eligibleFindingTypes.length === 0) {
    return { summary: 'No on-page metadata or heading-structure issues were found for this blog post.', findings: [] };
  }

  const agentConfig = await agentLoader.resolve(AGENT_KEY);
  const skillsBlock = agentLoader.loadSkillsForAgent(agentConfig);
  const memoryBlock = await sharedMemory.recallAsPromptContext({ agencyId: workspaceId, projectId: blog._id });

  const prompt = `You are the Blog SEO Agent for the blog post "${post.title}" (/${signals.slug}) on the blog "${blog.name}". Propose recommendations ONLY for the finding type(s) listed below — do not propose a finding type that isn't listed, and do not invent one.

Eligible finding types for this post: ${JSON.stringify(eligibleFindingTypes)}

Current measured state (grounded in what was actually stored/parsed for this post — do not invent content beyond this):
${JSON.stringify({
    slug: signals.slug,
    postTitle: signals.postTitle,
    currentMetaTitle: signals.currentMetaTitle,
    currentMetaDescription: signals.currentMetaDescription,
    currentExcerpt: signals.currentExcerpt,
    h1Texts: signals.h1Texts,
    headingSequence: signals.headingSequence,
    wordCount: signals.wordCount
  }, null, 2)}
${skillsBlock}
${memoryBlock}

Respond with a JSON object of this exact shape:
{
  "summary": "2-4 sentence summary of what was generated and why",
  "findings": [
    {
      "findingType": "must be one of the eligible finding types listed above",
      "currentValue": "the current metaTitle/metaDescription/excerpt, empty string if none or not applicable",
      "proposedValue": "for missing_title/title_too_short/title_too_long/duplicate_title: a new SEO title (30-60 chars). For missing_meta_description/meta_description_too_short/meta_description_too_long/duplicate_meta_description: a new meta description (70-160 chars). For missing_excerpt: a new short excerpt/teaser (under 200 chars) grounded in the post's own heading/content signals. For every other finding type: empty string.",
      "rationale": "1-2 sentence justification grounded in the measured state given"
    }
  ]
}
One finding object per eligible finding type. Respond ONLY with valid JSON, no markdown formatting or commentary.`;

  const raw = await aiEngine.complete({
    workspaceId,
    agentKey: AGENT_KEY,
    projectId: post._id,
    messages: [{ role: 'user', content: prompt }],
    model: agentConfig.modelName,
    temperature: 0.3,
    maxTokens: 1500,
    jsonMode: true,
    retryOptions: { retries: 2 }
  });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    logger.error(TAG, `Failed to parse AI blog-seo-generation JSON for post ${post._id}: ${error.message}`, { projectId: post._id });
    parsed = { summary: 'Automated generation did not return structured output; manual review recommended.', findings: [] };
  }

  const candidate = {
    currentMetaTitle: signals.currentMetaTitle,
    currentMetaDescription: signals.currentMetaDescription,
    currentExcerpt: signals.currentExcerpt
  };

  const generated = (Array.isArray(parsed.findings) ? parsed.findings : [])
    .filter((f) => f.findingType && VALID_FINDING_TYPES.includes(f.findingType) && eligibleFindingTypes.includes(f.findingType))
    .map((f) => {
      const validationErrors = validateFinding(f, candidate);
      const isMetadata = METADATA_FINDING_TYPES.has(f.findingType);
      const fallbackCurrentValue = f.findingType === 'missing_excerpt'
        ? candidate.currentExcerpt
        : (f.findingType.startsWith('title') || f.findingType === 'duplicate_title' ? candidate.currentMetaTitle : candidate.currentMetaDescription);

      return {
        findingType: f.findingType,
        severity: SEVERITY_BY_FINDING_TYPE[f.findingType],
        currentValue: f.currentValue || (isMetadata ? fallbackCurrentValue : '') || '',
        proposedValue: isMetadata ? (f.proposedValue || '') : '',
        rationale: (f.rationale || '') + (validationErrors.length ? ` [VALIDATION: ${validationErrors.join('; ')}]` : ''),
        isValid: validationErrors.length === 0
      };
    });

  return { summary: parsed.summary || '', findings: generated };
}

/**
 * @param {string} postId
 * @param {string} blogId
 * @param {string} [workspaceId]
 * @returns {Promise<Object>} the saved WorkspaceBlogSeo document
 */
async function run(postId, blogId, workspaceId) {
  const blog = await Blog.findOne({ _id: blogId, isDeleted: false });
  if (!blog) throw new Error('Blog not found');

  const post = await BlogPost.findOne({ _id: postId, blogId, isDeleted: false });
  if (!post) throw new Error('Blog post not found');

  const agencyId = workspaceId || blog.workspaceId;

  return executionQueue.run(`blog-seo-agent:${postId}`, async () => {
    const executionId = `blogSeoAgent:${postId}:${Date.now()}`;
    const startedAt = Date.now();

    logger.logExecution({ executionId, source: 'blogSeoAgent', agentKey: AGENT_KEY, projectId: postId, status: 'started' });

    try {
      const signals = await collectBlogPostSeoSignals(post, blog);
      const { summary, findings } = await generateBlogSeoFindings(blog, post, signals, agencyId);

      const savedRun = await WorkspaceBlogSeo.create({
        blogId: blog._id,
        postId: post._id,
        agencyId,
        status: 'completed',
        inputs: signals,
        completedAt: new Date(),
        agent: {
          agentKey: AGENT_KEY,
          summary,
          findings,
          approvalStatus: findings.length > 0 ? 'Pending Approval' : 'Not Requested'
        }
      });

      logger.logExecution({
        executionId, source: 'blogSeoAgent', agentKey: AGENT_KEY, projectId: postId,
        status: 'succeeded', durationMs: Date.now() - startedAt,
        meta: { runId: savedRun._id, findingCount: findings.length, invalidCount: findings.filter((f) => !f.isValid).length }
      });

      return savedRun;
    } catch (error) {
      logger.logExecution({
        executionId, source: 'blogSeoAgent', agentKey: AGENT_KEY, projectId: postId,
        status: 'failed', durationMs: Date.now() - startedAt, error: error.message
      });
      throw error;
    }
  });
}

/**
 * @param {string} runId
 * @param {string} postId
 * @param {string} userId
 */
async function approveFindings(runId, postId, userId) {
  const run = await WorkspaceBlogSeo.findOne({ _id: runId, postId });
  if (!run) throw new Error('Blog SEO run not found');

  if (!run.agent || run.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Publish Gate Blocked: Findings must be 'Pending Approval' to approve. Current status is '${run.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  run.agent.approvalStatus = 'Approved';
  run.agent.approvedBy = userId;
  run.agent.approvedAt = new Date();
  run.agent.rejectionReason = null;

  const taskTypeByFindingType = {
    missing_title: 'Update Meta Tags', title_too_short: 'Update Meta Tags', title_too_long: 'Update Meta Tags', duplicate_title: 'Update Meta Tags',
    missing_meta_description: 'Update Meta Tags', meta_description_too_short: 'Update Meta Tags', meta_description_too_long: 'Update Meta Tags', duplicate_meta_description: 'Update Meta Tags',
    missing_h1: 'Fix Heading Structure', multiple_h1: 'Fix Heading Structure', skipped_heading_level: 'Fix Heading Structure',
    thin_content: 'Expand Thin Content',
    missing_excerpt: 'Add Excerpt'
  };

  run.agent.generatedTasks = (run.agent.findings || [])
    .filter((f) => f.isValid)
    .map((f) => ({
      taskType: taskTypeByFindingType[f.findingType],
      description: `[Blog SEO Agent] ${f.findingType.replace(/_/g, ' ')} on /${run.inputs.slug}${f.proposedValue ? `: "${f.proposedValue}"` : ` — ${f.rationale}`}`,
      proposedChanges: { findingType: f.findingType, currentValue: f.currentValue, proposedValue: f.proposedValue, rationale: f.rationale },
      status: 'Pending'
    }));

  await run.save();

  logger.info(TAG, `Findings approved for post ${postId}`, { runId, postId, userId, taskCount: run.agent.generatedTasks.length });

  return { run, createdTasks: run.agent.generatedTasks };
}

/**
 * Human Approval Gate — reject path.
 */
async function rejectFindings(runId, postId, userId, reason) {
  const run = await WorkspaceBlogSeo.findOne({ _id: runId, postId });
  if (!run) throw new Error('Blog SEO run not found');

  if (!run.agent || run.agent.approvalStatus !== 'Pending Approval') {
    throw new Error(`Findings must be 'Pending Approval' to reject. Current status is '${run.agent?.approvalStatus || 'Not Requested'}'.`);
  }

  run.agent.approvalStatus = 'Rejected';
  run.agent.rejectionReason = reason || null;
  await run.save();

  logger.info(TAG, `Findings rejected for post ${postId}`, { runId, postId, userId, reason });

  await recordRejectedFindingsIfAny(run, userId, reason);

  return run;
}

async function recordRejectedFindingsIfAny(run, userId, reason) {
  try {
    const findings = run.agent?.findings || [];
    if (findings.length === 0) return;

    const agencyId = run.agencyId || userId;

    for (const f of findings.slice(0, 5)) {
      await sharedMemory.remember({
        agencyId,
        projectId: run.blogId,
        title: `Rejected on-page SEO finding: ${f.findingType} on /${run.inputs.slug}`,
        description: `The Blog SEO Agent's ${f.findingType} finding for post /${run.inputs.slug} was rejected.`,
        content: reason
          ? `Do not propose ${f.findingType} for post /${run.inputs.slug} again. Reason given: ${reason}`
          : `Do not propose ${f.findingType} for post /${run.inputs.slug} again.`,
        type: 'do_not_do'
      });
    }
  } catch (error) {
    logger.warn(TAG, `Failed to record rejected-finding memory for post ${run.postId}: ${error.message}`, { postId: run.postId });
  }
}

/**
 * @param {string} postId
 * @param {number} [limit=20]
 */
async function getExecutionHistory(postId, limit = 20) {
  const ExecutionLog = require('../../aiCore/executionLog.model');

  return ExecutionLog.find({
    projectId: postId,
    $or: [{ agentKey: AGENT_KEY }, { source: 'blogSeoAgent' }]
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

module.exports = {
  AGENT_KEY,
  run,
  collectBlogPostSeoSignals,
  generateBlogSeoFindings,
  validateTitleValue,
  validateMetaDescriptionValue,
  validateExcerptValue,
  approveFindings,
  rejectFindings,
  getExecutionHistory
};
