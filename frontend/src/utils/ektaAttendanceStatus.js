/**
 * ektaAttendanceStatus utility
 * Helpers related to the Ekta HR integration attendance statuses.
 * (Ekta is not connected in the new project — these are safe stubs.)
 */

const PRESENT_STATUSES = ['present', 'work_from_home', 'wfh', 'half_day', 'late'];

/**
 * Returns true if the given attendance status counts as "present".
 * @param {string} status
 */
export function isPresentAttendanceStatus(status) {
  if (!status) return false;
  return PRESENT_STATUSES.includes(status.toLowerCase().trim());
}

/**
 * Returns a human-readable label for an attendance status.
 * @param {string} status
 */
export function getAttendanceStatusLabel(status) {
  const labels = {
    present: 'Present',
    work_from_home: 'Work From Home',
    wfh: 'WFH',
    half_day: 'Half Day',
    late: 'Late',
    absent: 'Absent',
    leave: 'On Leave',
    holiday: 'Holiday',
  };
  return labels[(status || '').toLowerCase()] || status;
}

export default { isPresentAttendanceStatus, getAttendanceStatusLabel };
