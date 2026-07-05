export const COMPLETED_TASK_STATUSES = [
  "review",
  "in_review",
  "in review",
  "reviewing",
  "done",
  "completed",
  "validated",
  "complete",
];

export const CORRECTION_CATEGORIES = [
  "Correction",
  "Internal Correction",
  "Client Correction",
  "Hosting",
];
export const REDESIGN_CATEGORIES = ["Redesign"];

export const isCompletedTask = (status) =>
  COMPLETED_TASK_STATUSES.includes(status);

export const isDurationTrackingTask = (task) => !!task?.department;

export const isCorrectionTask = (task) =>
  CORRECTION_CATEGORIES.includes(task?.taskCategory);

export const isRedesignTask = (task) =>
  REDESIGN_CATEGORIES.includes(task?.taskCategory);

export const formatMinutesAsDuration = (minutes) => {
  if (minutes == null || Number.isNaN(Number(minutes))) return null;

  const totalMinutes = Math.max(0, Math.round(Number(minutes)));
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }

  return `${remainingMinutes}m`;
};

export const getTaskLiveDurationMinutes = (task) => {
  if (!task) return 0;
  const accumulated = Number(task.workDurationMinutes) || 0;
  if (task.status === "in_progress" && task.workStartedAt) {
    const elapsedMs = Date.now() - new Date(task.workStartedAt).getTime();
    const elapsedMins = Math.max(0, Math.round(elapsedMs / 60000));
    return accumulated + elapsedMins;
  }
  return accumulated;
};

export const getTaskDurationLabel = (task) => {
  if (!isDurationTrackingTask(task)) return null;
  const liveMins = getTaskLiveDurationMinutes(task);
  return formatMinutesAsDuration(liveMins);
};
