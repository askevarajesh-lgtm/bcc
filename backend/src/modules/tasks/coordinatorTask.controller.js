const coordinatorTaskService = require("./coordinatorTask.service");
const logger = require('./dummyLogger');

/**
 * Get all coordinator tasks
 */
const getAllCoordinatorTasks = async (req, res) => {
  try {
    const tenantCompanyId = req.companyId;
    const result = await coordinatorTaskService.getAllCoordinatorTasks(
      req.query,
      tenantCompanyId,
    );

    res.status(200).json(result);
  } catch (error) {
    logger.error("Error in getAllCoordinatorTasks controller:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create coordinator task
 */
const createCoordinatorTask = async (req, res) => {
  try {
    const tenantCompanyId = req.companyId;
    const createdByUserId = req.user._id;

    const task = await coordinatorTaskService.createCoordinatorTask(
      req.body,
      tenantCompanyId,
      createdByUserId,
    );

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    logger.error("Error in createCoordinatorTask controller:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get coordinator task by ID
 */
const getCoordinatorTaskById = async (req, res) => {
  try {
    const tenantCompanyId = req.companyId;
    const task = await coordinatorTaskService.getCoordinatorTaskById(
      req.params.id,
      tenantCompanyId,
    );

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    logger.error("Error in getCoordinatorTaskById controller:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update coordinator task
 */
const updateCoordinatorTask = async (req, res) => {
  try {
    const tenantCompanyId = req.companyId;
    const task = await coordinatorTaskService.updateCoordinatorTask(
      req.params.id,
      req.body,
      tenantCompanyId,
    );

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    logger.error("Error in updateCoordinatorTask controller:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete coordinator task
 */
const deleteCoordinatorTask = async (req, res) => {
  try {
    const tenantCompanyId = req.companyId;
    const taskId = req.params.id;

    // Fetch task first to check permissions
    const task = await coordinatorTaskService.getCoordinatorTaskById(
      taskId,
      tenantCompanyId,
    );

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // Only admin or the person who assigned the task can delete it
    if (
      req.user.role !== "admin" &&
      task.assignedBy?._id?.toString() !== req.user._id?.toString()
    ) {
      return res
        .status(403)
        .json({
          success: false,
          message:
            "Access denied: Only the assigner or admin can delete this task",
        });
    }

    await coordinatorTaskService.deleteCoordinatorTask(taskId, tenantCompanyId);

    res
      .status(200)
      .json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    logger.error("Error in deleteCoordinatorTask controller:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getTodayCoordinatorTaskStats = async (req, res) => {
  try {
    const stats = await coordinatorTaskService.getTodayCoordinatorTaskStats(
      req.user._id,
      req.companyId,
    );
    res.status(200).json({
      success: true,
      message: "Today's coordinator task stats retrieved successfully",
      data: stats,
    });
  } catch (error) {
    logger.error("Error in getTodayCoordinatorTaskStats controller:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllCoordinatorTasks,
  createCoordinatorTask,
  getCoordinatorTaskById,
  updateCoordinatorTask,
  deleteCoordinatorTask,
  getTodayCoordinatorTaskStats,
};
