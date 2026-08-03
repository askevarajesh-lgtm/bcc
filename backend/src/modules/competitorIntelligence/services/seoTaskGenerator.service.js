/**
 * SEO Task Generator — AI SEO Platform v2 §3.
 *
 * Converts `Recommendation[]` (from `competitorRecommendation.service.js`)
 * into `WorkspaceTask` docs. Reuses the existing model rather than
 * introducing a second task system — `WorkspaceTask` already has the
 * `Pending → Approved → Rejected → Implemented → Failed` lifecycle needed,
 * and is already read by `workspaceCron.service.js` and
 * `WorkspaceAutomation`'s `create_task` action, so tasks generated here are
 * automatically visible to infrastructure that already exists.
 */
const WorkspaceTask = require('../../seoWorkspace/models/workspaceTask.model');
const Recommendation = require('../models/recommendation.model');

const TASK_TYPE_BY_GAP_TYPE = {
  keyword_gap: 'Target New Keyword',
  content_gap: 'Close Content Gap',
  backlink_gap: 'Build Backlink',
  page_gap: 'Close Page Gap'
};

// Static effort lookup by taskType — matches how effort already surfaces
// elsewhere in the UI (a small lookup, not a new model).
const EFFORT_BY_TASK_TYPE = {
  'Target New Keyword': 'medium',
  'Close Content Gap': 'high', // new page/content creation
  'Build Backlink': 'high',    // outreach
  'Close Page Gap': 'high'
};

function priorityBucket(score) {
  if (score >= 500) return 'High';
  if (score >= 100) return 'Medium';
  return 'Low';
}

function describeRow(row, type) {
  if (type === 'keyword_gap') return `Target keyword "${row.keyword}" (${row.competitorDomain} ranks #${row.competitorRank ?? '?'}, you don't).`;
  if (type === 'content_gap') return `Create content covering "${row.keyword}" — ${row.competitorDomain} has a ranking page, you have none.`;
  if (type === 'page_gap') return `Build a page equivalent to ${row.competitorDomain}'s ${row.pageUrl || 'ranking page'}.`;
  if (type === 'backlink_gap') return row.referringDomain
    ? `Pursue a backlink from ${row.referringDomain} — ${row.competitorDomain} has this link, you don't.`
    : `Close the referring-domain gap with ${row.competitorDomain} (aggregate count gap).`;
  return 'Competitive gap task.';
}

/**
 * @param {string[]} recommendationIds - Recommendation._id values, status must be 'proposed'
 * @param {string} projectId
 * @param {string} [pageUrl] - WorkspaceTask.pageUrl is required by the existing schema; falls back to the project domain
 * @returns {Promise<Object[]>} created WorkspaceTask docs
 */
async function generateTasks(recommendationIds, projectId, pageUrl) {
  const recommendations = await Recommendation.find({
    _id: { $in: recommendationIds },
    projectId,
    status: 'proposed'
  });

  if (recommendations.length === 0) return [];

  const taskDocs = recommendations.map((rec) => {
    const taskType = TASK_TYPE_BY_GAP_TYPE[rec.type];
    return {
      projectId,
      pageUrl: rec.item?.pageUrl || pageUrl || 'n/a',
      taskType,
      description: describeRow(rec.item, rec.type),
      proposedChanges: { gapType: rec.type, priorityBucket: priorityBucket(rec.priorityScore), row: rec.item },
      status: 'Pending',
      source: 'competitor-intelligence-agent',
      agent: {
        agentKey: 'competitor-intelligence-agent',
        rationale: rec.rationale,
        recommendationId: rec._id,
        estimatedEffort: EFFORT_BY_TASK_TYPE[taskType] || 'medium',
        estimatedImpact: rec.estimatedTrafficImpact
      }
    };
  });

  const created = await WorkspaceTask.insertMany(taskDocs);

  await Recommendation.updateMany(
    { _id: { $in: recommendations.map((r) => r._id) } },
    { $set: { status: 'converted_to_task' } }
  );

  return created;
}

module.exports = { generateTasks };
