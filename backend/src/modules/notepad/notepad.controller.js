const notepadService = require("./notepad.service");
const logger = console;

/**
 * Get today's note
 */
const getTodayNote = async (req, res) => {
  try {
    const userId = req.user._id;
    const note = await notepadService.getTodayNote(userId);

    res.json({
      success: true,
      data: {
        note: note || null,
      },
    });
  } catch (error) {
    logger.error("Error getting today note:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get today note",
    });
  }
};

/**
 * Create or update today's note
 */
const createOrUpdateTodayNote = async (req, res) => {
  try {
    const userId = req.user._id;
    
    if (req.user.role !== 'user') {
      return res.status(403).json({
        success: false,
        message: "Only employees can submit daily reports.",
      });
    }

    const { content } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    const note = await notepadService.createOrUpdateTodayNote(userId, content);

    res.json({
      success: true,
      data: {
        note,
      },
      message: "Note saved successfully",
    });
  } catch (error) {
    logger.error("Error creating/updating note:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to save note",
    });
  }
};

/**
 * Get notes history
 */
const getNotesHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const result = await notepadService.getNotesHistory(userId, page, limit);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error getting notes history:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get notes history",
    });
  }
};

/**
 * Get latest daily reports from all users (admin only)
 */
const getAllUsersLatestReports = async (req, res) => {
  try {
    const tenantId = req.companyId || req.user._id;
    const result = await notepadService.getAllUsersLatestReports(
      tenantId,
      req.query,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error getting all users latest reports:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get latest reports",
    });
  }
};

/**
 * Get all users' report history (admin only)
 */
const getAllUsersReportHistory = async (req, res) => {
  try {
    const tenantId = req.companyId || req.user._id;
    const result = await notepadService.getAllUsersReportHistory(
      tenantId,
      req.query,
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Error getting all users report history:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to get report history",
    });
  }
};

/**
 * Notify users who haven't submitted yesterday's daily report (admin only)
 */
const notifyMissingYesterdayReports = async (req, res) => {
  try {
    const tenantId = req.companyId || req.user._id;
    const result =
      await notepadService.notifyMissingYesterdayReports(tenantId);

    res.json({
      success: true,
      data: result,
      message: `Notifications sent to ${result.notifiedCount} user(s) who haven't submitted yesterday's report`,
    });
  } catch (error) {
    logger.error("Error notifying missing yesterday reports:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to send notifications",
    });
  }
};

module.exports = {
  getTodayNote,
  createOrUpdateTodayNote,
  getNotesHistory,
  getAllUsersLatestReports,
  getAllUsersReportHistory,
  notifyMissingYesterdayReports,
};
