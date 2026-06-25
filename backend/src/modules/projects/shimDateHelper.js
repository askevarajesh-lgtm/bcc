
module.exports = {
  formatDateToIST: (d) => d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null,
  normalizeTaskDateFields: (task) => task,
  toIST: (d) => d ? new Date(d) : null,
  getStartOfDay: (d) => { const dt = d ? new Date(d) : new Date(); dt.setHours(0,0,0,0); return dt; },
  getEndOfDay: (d) => { const dt = d ? new Date(d) : new Date(); dt.setHours(23,59,59,999); return dt; },
  formatDate: (d) => d ? new Date(d).toISOString() : null,
  parseDateString: (s) => s ? new Date(s) : null,
  isSameDay: (a, b) => new Date(a).toDateString() === new Date(b).toDateString(),
};
