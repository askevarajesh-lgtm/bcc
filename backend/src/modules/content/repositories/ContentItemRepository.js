const ContentItem = require('../models/ContentItem');
const ContentHistory = require('../models/ContentHistory');

class ContentItemRepository {
  async create(data) {
    const item = new ContentItem(data);
    return await item.save();
  }

  async findById(id, workspaceId) {
    return await ContentItem.findOne({ _id: id, workspaceId });
  }

  async findAll(query, options = {}) {
    const { skip = 0, limit = 50, sort = { createdAt: -1 } } = options;
    const items = await ContentItem.find(query).sort(sort).skip(skip).limit(limit);
    const total = await ContentItem.countDocuments(query);
    return { items, total };
  }

  async update(id, workspaceId, updateData) {
    return await ContentItem.findOneAndUpdate(
      { _id: id, workspaceId },
      { $set: updateData },
      { returnDocument: 'after' }
    );
  }

  async delete(id, workspaceId) {
    return await ContentItem.findOneAndDelete({ _id: id, workspaceId });
  }

  async updateSyncStatus(id, workspaceId, type, status, linkedId = null) {
    const updateFields = { [`${type}SyncStatus`]: status };
    if (linkedId) {
      if (type === 'seo') updateFields.linkedSeoContentId = linkedId;
      if (type === 'blog') updateFields.linkedWebsitePageId = linkedId;
    }
    return await this.update(id, workspaceId, updateFields);
  }
}

module.exports = new ContentItemRepository();
