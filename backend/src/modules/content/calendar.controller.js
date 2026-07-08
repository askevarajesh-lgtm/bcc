const ContentCalendarRepository = require('./repositories/ContentCalendarRepository');

exports.getCalendar = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId;
    const { year, month } = req.query; // Expecting month to be 0-indexed like JS dates
    
    const y = year ? parseInt(year) : new Date().getFullYear();
    const m = month ? parseInt(month) : new Date().getMonth();

    const items = await ContentCalendarRepository.findByMonth(workspaceId, y, m);
    return res.status(200).json({ success: true, data: { items } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.scheduleItem = async (req, res) => {
  try {
    const workspaceId = req.companyId || req.workspaceId;
    const { scheduledDate, platform, title } = req.body;
    const contentItemId = req.params.itemId;

    const calendarItem = await ContentCalendarRepository.create({
      workspaceId,
      contentItemId,
      scheduledDate,
      platform,
      title,
      status: 'Scheduled'
    });

    return res.status(201).json({ success: true, data: calendarItem });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
