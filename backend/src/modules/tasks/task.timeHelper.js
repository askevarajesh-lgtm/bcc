const TimeEntry = require('../timeTracking/timeTracking.model');

exports.recordTimerStop = async (task, diffMinutes, userId) => {
  if (!diffMinutes || diffMinutes <= 0) return;
  const diffHours = diffMinutes / 60;
  
  try {
    const timeEntry = new TimeEntry({
      employee: task.assignedTo || userId,
      task: task._id,
      date: new Date(),
      hours: diffHours,
      isBillable: true,
      moduleName: task.department || 'General',
      description: task.title,
      tenantCompanyId: task.tenantCompanyId || task.companyId,
      source: 'timer',
      createdBy: userId
    });
    
    await timeEntry.save();
    task.timeSpent = (task.timeSpent || 0) + diffHours;
  } catch (error) {
    console.error('Error recording timer stop in TimeEntry:', error);
  }
};
