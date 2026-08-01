const ContentTrend = require('../models/ContentTrend');

class ContentTrendRepository {
  async create(data) {
    const item = new ContentTrend(data);
    return await item.save();
  }

  async findByChannel(workspaceId, channel) {
    return await ContentTrend.find({ workspaceId, channel }).sort({ trendScore: -1 });
  }

  async update(id, workspaceId, updateData) {
    return await ContentTrend.findOneAndUpdate(
      { _id: id, workspaceId },
      { $set: updateData },
      { returnDocument: 'after' }
    );
  }

  async clearChannel(workspaceId, channel) {
    return await ContentTrend.deleteMany({ workspaceId, channel, isSavedIdea: false });
  }
}

module.exports = new ContentTrendRepository();
