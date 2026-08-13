const CoordinatorTask = require("./coordinatorTask.model");
const logger = require('./dummyLogger');

/**
 * Get all coordinator tasks with filtering and population
 */
const getAllCoordinatorTasks = async (query, tenantCompanyId) => {
  const { status, assignedTo, companyId, date, limit = 1000, skip = 0 } = query;

  const filters = { tenantCompanyId };

  if (status) filters.status = status;
  if (assignedTo) filters.assignedTo = assignedTo;
  if (companyId) filters.companyId = companyId;
  if (query.isManual !== undefined)
    filters.isManual = query.isManual === "true" || query.isManual === true;

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    filters.taskDate = { $gte: startOfDay, $lte: endOfDay };
  }

  const tasks = await CoordinatorTask.find(filters)
    .populate("companyId", "name email phone address")
    .populate("assignedTo", "name email role profileImage")
    .populate("assignedBy", "name email")
    .populate("createdBy", "name email")
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(parseInt(skip));

  const total = await CoordinatorTask.countDocuments(filters);

  return {
    success: true,
    data: {
      tasks,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip),
    },
  };
};

/**
 * Create a new coordinator task
 */
const createCoordinatorTask = async (
  taskData,
  tenantCompanyId,
  createdByUserId,
) => {
  const newTask = new CoordinatorTask({
    ...taskData,
    tenantCompanyId,
    createdBy: createdByUserId,
    assignedBy: createdByUserId || taskData.assignedBy,
  });

  const savedTask = await newTask.save();

  // Return populated task
  return await CoordinatorTask.findById(savedTask._id)
    .populate("companyId", "name email phone address")
    .populate("assignedTo", "name email role profileImage")
    .populate("assignedBy", "name email")
    .populate("createdBy", "name email");
};

/**
 * Get coordinator task by ID
 */
const getCoordinatorTaskById = async (id, tenantCompanyId) => {
  return await CoordinatorTask.findOne({ _id: id, tenantCompanyId })
    .populate("companyId", "name email phone address")
    .populate("assignedTo", "name email role profileImage")
    .populate("assignedBy", "name email")
    .populate("createdBy", "name email");
};

/**
 * Update coordinator task
 */
const updateCoordinatorTask = async (id, updateData, tenantCompanyId) => {
  return await CoordinatorTask.findOneAndUpdate(
    { _id: id, tenantCompanyId },
    { $set: updateData },
    { returnDocument: 'after' },
  )
    .populate("companyId", "name email phone address")
    .populate("assignedTo", "name email role profileImage");
};

/**
 * Delete coordinator task
 */
const deleteCoordinatorTask = async (id, tenantCompanyId) => {
  return await CoordinatorTask.findOneAndDelete({ _id: id, tenantCompanyId });
};

/**
 * Get today's coordinator task completion stats for a user
 */
const getTodayCoordinatorTaskStats = async (userId, tenantCompanyId) => {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  // 1. All active (incomplete) tasks
  const activeTasksCount = await CoordinatorTask.countDocuments({
    assignedTo: new (require("mongoose").Types.ObjectId)(userId),
    tenantCompanyId: new (require("mongoose").Types.ObjectId)(tenantCompanyId),
    status: { $ne: "completed" },
  });

  // 2. All tasks completed by the user TODAY
  const completedTodayCount = await CoordinatorTask.countDocuments({
    assignedTo: new (require("mongoose").Types.ObjectId)(userId),
    tenantCompanyId: new (require("mongoose").Types.ObjectId)(tenantCompanyId),
    status: "completed",
    updatedAt: { $gte: todayStart, $lte: todayEnd },
  });

  const totalToday = activeTasksCount + completedTodayCount;
  const completedToday = completedTodayCount;

  return {
    totalToday,
    completedToday,
    remainingToday: activeTasksCount,
  };
};

module.exports = {
  getAllCoordinatorTasks,
  createCoordinatorTask,
  getCoordinatorTaskById,
  updateCoordinatorTask,
  deleteCoordinatorTask,
  getTodayCoordinatorTaskStats,
};
