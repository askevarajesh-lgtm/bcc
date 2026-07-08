const ContentCalendarItem = require('../models/ContentCalendarItem');

class ContentCalendarRepository {
  async create(data) {
    const item = new ContentCalendarItem(data);
    return await item.save();
  }

  async findByMonth(workspaceId, year, month) {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    return await ContentCalendarItem.find({
      workspaceId,
      scheduledDate: { $gte: startDate, $lte: endDate }
    }).populate('contentItemId', 'title type status platform');
  }

  async update(id, workspaceId, updateData) {
    return await ContentCalendarItem.findOneAndUpdate(
      { _id: id, workspaceId },
      { $set: updateData },
      { new: true }
    );
  }

  async delete(id, workspaceId) {
    return await ContentCalendarItem.findOneAndDelete({ _id: id, workspaceId });
  }
}

module.exports = new ContentCalendarRepository();
