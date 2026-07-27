/**
 * AI Core — Shared Memory
 *
 * Deliberately NOT a new collection/model. Wraps the existing
 * `seoWorkspace/models/workspaceMemory.model.js` (`WorkspaceMemory`), which
 * was already built for exactly this purpose — cross-session best
 * practices, brand voice, do-not-do rules, approved terminology, recurring
 * issues — and is currently defined but never read anywhere in the codebase
 * (per `marketplace-seo-platform-architecture.md` §0 finding #... and
 * `seo-mongodb-schema-plan.md`'s note that its collection has no explicit
 * name today). This service is the first reusable read/write surface for it.
 *
 * `remember`/`recall` naming is deliberate: it gives AI Engine callers a
 * memory-shaped API without introducing a second memory schema.
 */
// BUGFIX (SEO Auditor Agent pass): same one-level-too-many issue as
// agentLoader.service.js's skillLoader require — see that file's note.
const WorkspaceMemory = require('../seoWorkspace/models/workspaceMemory.model');
const logger = require('./logger.service');

/**
 * @param {Object} entry
 * @param {string} entry.agencyId - required, ref User
 * @param {string} [entry.projectId] - omit for a cross-client shared best practice
 * @param {string} entry.title
 * @param {string} entry.description
 * @param {string} entry.content
 * @param {string} [entry.type] - best_practice | brand_voice | do_not_do | approved_terminology | recurring_issue
 */
async function remember(entry) {
  const memory = new WorkspaceMemory({
    agencyId: entry.agencyId,
    projectId: entry.projectId || undefined,
    title: entry.title,
    description: entry.description,
    content: entry.content,
    type: entry.type || 'best_practice',
    isActive: entry.isActive !== false
  });
  await memory.save();
  logger.debug('SharedMemory', `remembered "${entry.title}"`, { agencyId: entry.agencyId, projectId: entry.projectId, type: memory.type });
  return memory;
}

/**
 * @param {Object} filter
 * @param {string} filter.agencyId - required
 * @param {string} [filter.projectId] - if provided, includes both this project's memories
 *   AND cross-client shared ones (projectId: null); if omitted, returns only
 *   cross-client shared memories for the agency.
 * @param {string} [filter.type]
 * @param {boolean} [filter.includeInactive] - default false
 */
async function recall(filter) {
  const query = { agencyId: filter.agencyId };
  if (!filter.includeInactive) query.isActive = true;
  if (filter.type) query.type = filter.type;

  if (filter.projectId) {
    query.$or = [{ projectId: filter.projectId }, { projectId: null }, { projectId: { $exists: false } }];
  } else {
    query.$or = [{ projectId: null }, { projectId: { $exists: false } }];
  }

  return WorkspaceMemory.find(query).sort({ createdAt: -1 }).lean();
}

async function deactivate(memoryId) {
  return WorkspaceMemory.findByIdAndUpdate(memoryId, { isActive: false }, { new: true });
}

/**
 * Convenience for AI Engine prompt-building: recalls memories and flattens
 * them into a plain-text block, the same shape agentLoader/skillLoader
 * already produce for skills, so a caller can concatenate both consistently.
 */
async function recallAsPromptContext(filter) {
  const memories = await recall(filter);
  if (!memories.length) return '';
  let block = '\n--- SHARED MEMORY (prior context for this agency/project) ---\n';
  memories.forEach(m => {
    block += `\n# ${m.title} (${m.type})\n${m.content}\n`;
  });
  return block;
}

module.exports = { remember, recall, deactivate, recallAsPromptContext };