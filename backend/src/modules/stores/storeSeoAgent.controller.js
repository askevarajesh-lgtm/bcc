/**
 * Store SEO Agent — controller wiring.
 *
 * Thin pass-through to `seoWorkspace/services/storeSeoAgent.service.js` (own
 * prompt, own execution history, own logs, retry, human approval, shared
 * memory integration — see that file's header). No UI consumes these
 * endpoints yet, same "route exists, nothing renders it" pattern already
 * established for `blogSeoAgent.controller.js`/`websiteSeoAgent.controller.js`
 * and the other agents in `seoWorkspace.controller.js`.
 *
 * Reuses the same tenant-scoping shape `store.controller.js` already applies
 * everywhere (`Store.findOne({ _id, workspaceId: req.workspaceId, isDeleted:
 * false })`) rather than writing a second auth check.
 */
const Store = require('./store.model');
const storeSeoAgent = require('../seoWorkspace/services/storeSeoAgent.service');

async function loadAuthorizedStore(req) {
  const { storeId } = req.params;
  return Store.findOne({ _id: storeId, workspaceId: req.workspaceId, isDeleted: false });
}

exports.runStoreSeoAgent = async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await loadAuthorizedStore(req);
    if (!store) return res.status(404).json({ success: false, error: 'Store not found' });

    const workspaceId = req.workspaceId;
    const result = await storeSeoAgent.run(storeId, workspaceId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[runStoreSeoAgent] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.approveStoreSeoFindings = async (req, res) => {
  try {
    const { storeId, runId } = req.params;
    const store = await loadAuthorizedStore(req);
    if (!store) return res.status(404).json({ success: false, error: 'Store not found' });

    const result = await storeSeoAgent.approveFindings(runId, storeId, req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[approveStoreSeoFindings] Error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.rejectStoreSeoFindings = async (req, res) => {
  try {
    const { storeId, runId } = req.params;
    const { reason } = req.body;
    const store = await loadAuthorizedStore(req);
    if (!store) return res.status(404).json({ success: false, error: 'Store not found' });

    const result = await storeSeoAgent.rejectFindings(runId, storeId, req.user._id, reason);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[rejectStoreSeoFindings] Error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getStoreSeoExecutionHistory = async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await loadAuthorizedStore(req);
    if (!store) return res.status(404).json({ success: false, error: 'Store not found' });

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const history = await storeSeoAgent.getExecutionHistory(storeId, limit);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[getStoreSeoExecutionHistory] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
