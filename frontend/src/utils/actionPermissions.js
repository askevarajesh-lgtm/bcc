/**
 * PERMISSION_ACTIONS constants
 * Maps action names to their permission keys used throughout the app.
 */
export const PERMISSION_ACTIONS = {
  // Task actions
  CREATE_TASK: 'create-task',
  EDIT_TASK: 'edit-task',
  DELETE_TASK: 'delete-task',
  VIEW_TASK: 'view-task',
  ASSIGN_TASK: 'assign-task',
  COMPLETE_TASK: 'complete-task',
  VALIDATE_TASK: 'validate-task',
  REOPEN_TASK: 'reopen-task',

  // Coordinator task actions
  CREATE_COORDINATOR_TASK: 'create-coordinator-task',
  EDIT_COORDINATOR_TASK: 'edit-coordinator-task',
  DELETE_COORDINATOR_TASK: 'delete-coordinator-task',

  // Settings
  MANAGE_SETTINGS: 'manage-settings',
  VIEW_ANALYTICS: 'view-analytics',
};

export default PERMISSION_ACTIONS;
