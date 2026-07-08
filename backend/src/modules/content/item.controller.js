const ContentItemRepository = require('./repositories/ContentItemRepository');
const ContentToSeoBridgeService = require('./services/ContentToSeoBridgeService');
const ContentToBlogBridgeService = require('./services/ContentToBlogBridgeService');

exports.getItems = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId;
    const { items, total } = await ContentItemRepository.findAll({ workspaceId });
    return res.status(200).json({ success: true, data: { items, total } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getItem = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId;
    const item = await ContentItemRepository.findById(req.params.id, workspaceId);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId;
    const item = await ContentItemRepository.update(req.params.id, workspaceId, req.body);
    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId;
    await ContentItemRepository.delete(req.params.id, workspaceId);
    return res.status(200).json({ success: true, message: 'Deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.approveItem = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId;
    const item = await ContentItemRepository.update(req.params.id, workspaceId, { status: 'Approved' });
    
    // Auto-sync downstream if approved based on content type
    if (item && (item.type === 'blog' || item.type === 'landing')) {
      const seoId = await ContentToSeoBridgeService.sync(item);
      await ContentItemRepository.updateSyncStatus(item._id, workspaceId, 'seo', 'success', seoId);
      
      if (item.type === 'blog') {
        const blogData = await ContentToBlogBridgeService.sync(item);
        await ContentItemRepository.updateSyncStatus(item._id, workspaceId, 'blog', 'success', blogData.websitePageId);
      }
    }
    
    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
