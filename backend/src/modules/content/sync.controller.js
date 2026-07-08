const ContentItemRepository = require('./repositories/ContentItemRepository');
const ContentToSeoBridgeService = require('./services/ContentToSeoBridgeService');
const ContentToBlogBridgeService = require('./services/ContentToBlogBridgeService');
const PublishBridgeService = require('./services/PublishBridgeService');

exports.syncSeo = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId;
    const item = await ContentItemRepository.findById(req.params.id, workspaceId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    
    const seoId = await ContentToSeoBridgeService.sync(item);
    await ContentItemRepository.updateSyncStatus(item._id, workspaceId, 'seo', 'success', seoId);
    
    return res.status(200).json({ success: true, message: 'Synced to SEO successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.syncBlog = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId;
    const item = await ContentItemRepository.findById(req.params.id, workspaceId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });
    
    if (item.type !== 'blog') {
      return res.status(400).json({ success: false, message: 'Only blog items can be synced to Website Blog' });
    }
    
    const blogData = await ContentToBlogBridgeService.sync(item);
    await ContentItemRepository.updateSyncStatus(item._id, workspaceId, 'blog', 'success', blogData.websitePageId);
    
    return res.status(200).json({ success: true, message: 'Synced to Blog successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.syncPublish = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId;
    // Assuming websiteId might be passed in body or inferred
    const { websiteId } = req.body;
    
    if (!websiteId) {
      return res.status(400).json({ success: false, message: 'websiteId is required to publish' });
    }
    
    await PublishBridgeService.publish(websiteId);
    
    return res.status(200).json({ success: true, message: 'Publish triggered successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
