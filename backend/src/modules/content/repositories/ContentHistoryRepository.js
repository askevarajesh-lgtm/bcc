const ContentHistory = require('../models/ContentHistory');

class ContentHistoryRepository {
  async log(workspaceId, contentItemId, action, actorId, details = {}) {
    const logEntry = new ContentHistory({
      workspaceId,
      contentItemId,
      action,
      actorId,
      details
    });
    return await logEntry.save();
  }

  async findByContentItem(contentItemId, workspaceId) {
    return await ContentHistory.find({ contentItemId, workspaceId }).sort({ createdAt: -1 });
  }
}

module.exports = new ContentHistoryRepository();
