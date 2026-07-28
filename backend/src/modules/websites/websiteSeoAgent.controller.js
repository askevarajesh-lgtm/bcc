/**
 * Website Builder SEO Agent — controller wiring.
 *
 * Thin pass-through to `seoWorkspace/services/websiteBuilderSeoAgent.service.js`
 * (own prompt, own execution history, own logs, retry, human approval,
 * shared memory integration — see that file's header). No UI consumes
 * these endpoints yet, same "route exists, nothing renders it" pattern
 * already established for the other eight agents in
 * `seoWorkspace.controller.js` (e.g. `runImageSeoAgent`).
 *
 * Reuses `buildWebsiteAuthQuery` from `website.controller.js` (additively
 * exported there) for the exact same tenant-scoping check every other
 * website/page route in this module already applies — not a second copy
 * of that logic.
 */
const Website = require('./website.model');
const Page = require('./page.model');
const { buildWebsiteAuthQuery } = require('./website.controller');
const websiteBuilderSeoAgent = require('../seoWorkspace/services/websiteBuilderSeoAgent.service');

async function loadAuthorizedPage(req) {
  const { websiteId, pageId } = req.params;
  const query = buildWebsiteAuthQuery(req, { _id: websiteId });
  const website = await Website.findOne(query);
  if (!website) return { website: null, page: null };

  const page = await Page.findOne({ _id: pageId, websiteId, isDeleted: false });
  return { website, page };
}

exports.runWebsiteSeoAgent = async (req, res) => {
  try {
    const { websiteId, pageId } = req.params;
    const { website, page } = await loadAuthorizedPage(req);
    if (!website) return res.status(404).json({ success: false, error: 'Website not found' });
    if (!page) return res.status(404).json({ success: false, error: 'Page not found' });

    const workspaceId = req.workspaceId;
    const result = await websiteBuilderSeoAgent.run(pageId, websiteId, workspaceId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[runWebsiteSeoAgent] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.approveWebsiteSeoFindings = async (req, res) => {
  try {
    const { pageId, runId } = req.params;
    const { website, page } = await loadAuthorizedPage(req);
    if (!website) return res.status(404).json({ success: false, error: 'Website not found' });
    if (!page) return res.status(404).json({ success: false, error: 'Page not found' });

    const result = await websiteBuilderSeoAgent.approveFindings(runId, pageId, req.user._id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[approveWebsiteSeoFindings] Error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.rejectWebsiteSeoFindings = async (req, res) => {
  try {
    const { pageId, runId } = req.params;
    const { reason } = req.body;
    const { website, page } = await loadAuthorizedPage(req);
    if (!website) return res.status(404).json({ success: false, error: 'Website not found' });
    if (!page) return res.status(404).json({ success: false, error: 'Page not found' });

    const result = await websiteBuilderSeoAgent.rejectFindings(runId, pageId, req.user._id, reason);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('[rejectWebsiteSeoFindings] Error:', error.message);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getWebsiteSeoExecutionHistory = async (req, res) => {
  try {
    const { pageId } = req.params;
    const { website, page } = await loadAuthorizedPage(req);
    if (!website) return res.status(404).json({ success: false, error: 'Website not found' });
    if (!page) return res.status(404).json({ success: false, error: 'Page not found' });

    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 20;
    const history = await websiteBuilderSeoAgent.getExecutionHistory(pageId, limit);
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('[getWebsiteSeoExecutionHistory] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
