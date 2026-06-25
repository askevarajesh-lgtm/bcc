const fs = require('fs');
const path = require('path');

const dir = 'e:/Bcc Seo/backend/src/modules/tasks';

// ─── 1. Create all missing shims inside the tasks folder ──────────────────────

// Already exists: dummyLogger, dummyTimeline, dummyConfig, auth/user.model, integrations/integration.model

// date.helper
fs.writeFileSync(path.join(dir, 'shimDateHelper.js'), `
const moment = require('moment');
module.exports = {
  formatDateToIST: (d) => d ? new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : null,
  normalizeTaskDateFields: (task) => task,
  toIST: (d) => d ? new Date(d) : null,
  getStartOfDay: (d) => { const dt = d ? new Date(d) : new Date(); dt.setHours(0,0,0,0); return dt; },
  getEndOfDay: (d) => { const dt = d ? new Date(d) : new Date(); dt.setHours(23,59,59,999); return dt; },
  formatDate: (d, fmt) => d ? new Date(d).toISOString() : null,
  parseDateString: (s) => s ? new Date(s) : null,
  isSameDay: (a, b) => new Date(a).toDateString() === new Date(b).toDateString(),
};
`);

// pagination.helper
fs.writeFileSync(path.join(dir, 'shimPagination.js'), `
module.exports = {
  getPaginationParams: (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;
    return { page, limit, skip };
  },
  buildPaginationMeta: (total, page, limit) => ({
    total, page, limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
  }),
};
`);

// dropdown.helper
fs.writeFileSync(path.join(dir, 'shimDropdown.js'), `
module.exports = {
  buildDropdownOptions: (items, labelField, valueField) =>
    (items || []).map(i => ({ label: i[labelField], value: i[valueField] || i._id })),
};
`);

// companyIntegrations
fs.writeFileSync(path.join(dir, 'shimCompanyIntegrations.js'), `
module.exports = {
  getCompanyIntegrations: async () => ([]),
  hasIntegration: async () => false,
};
`);

// socket
fs.writeFileSync(path.join(dir, 'shimSocket.js'), `
module.exports = {
  getIO: () => ({ emit: () => {}, to: () => ({ emit: () => {} }) }),
  emitToUser: () => {},
  emitToRoom: () => {},
};
`);

// response
fs.writeFileSync(path.join(dir, 'shimResponse.js'), `
module.exports = {
  sendSuccess: (res, data, message = 'Success', statusCode = 200) =>
    res.status(statusCode).json({ success: true, message, data }),
  sendError: (res, message = 'Error', statusCode = 400) =>
    res.status(statusCode).json({ success: false, message }),
  sendPaginatedSuccess: (res, data, meta, message = 'Success') =>
    res.status(200).json({ success: true, message, data, meta }),
};
`);

// project.model shim (empty mongoose schema)
fs.writeFileSync(path.join(dir, 'shimProjectModel.js'), `
const mongoose = require('mongoose');
const schema = new mongoose.Schema({}, { strict: false });
module.exports = mongoose.models.Project || mongoose.model('Project', schema);
`);

// project.service shim
fs.writeFileSync(path.join(dir, 'shimProjectService.js'), `
module.exports = {
  getProject: async () => null,
  updateProject: async () => null,
};
`);

// integration.service shim
fs.writeFileSync(path.join(dir, 'shimIntegrationService.js'), `
module.exports = {
  getIntegration: async () => null,
  sendNotification: async () => null,
};
`);

// correction.model shim
fs.writeFileSync(path.join(dir, 'shimCorrectionModel.js'), `
const mongoose = require('mongoose');
const schema = new mongoose.Schema({}, { strict: false });
module.exports = mongoose.models.Correction || mongoose.model('Correction', schema);
`);

// department.model shim
fs.writeFileSync(path.join(dir, 'shimDepartmentModel.js'), `
const mongoose = require('mongoose');
const schema = new mongoose.Schema({}, { strict: false });
module.exports = mongoose.models.Department || mongoose.model('Department', schema);
`);

console.log('All shims created.');

// ─── 2. Now rewrite all requires in every task-module .js file ─────────────────

const replacementMap = {
  // utils
  '../../utils/logger':               './dummyLogger',
  '../../utils/timeline.helper':      './dummyTimeline',
  '../../utils/date.helper':          './shimDateHelper',
  '../../utils/pagination.helper':    './shimPagination',
  '../../utils/dropdown.helper':      './shimDropdown',
  '../../utils/companyIntegrations':  './shimCompanyIntegrations',
  '../../utils/socket':               './shimSocket',
  '../../utils/response':             './shimResponse',
  // config
  '../../config/env':                 './dummyConfig',
  '../../config':                     './dummyConfig',
  // cross-module models / services that don't exist
  '../companies/company.model':       '../auth/user.model',
  '../company/company.model':         '../auth/user.model',
  '../users/user.model':              '../auth/user.model',
  '../projects/project.model':        './shimProjectModel',
  '../projects/project.service':      './shimProjectService',
  '../integrations/integration.service': './shimIntegrationService',
  '../corrections/correction.model':  './shimCorrectionModel',
  '../access-control/department.model': './shimDepartmentModel',
  // events
  '../events/event-config.service':   './dummyConfig', // stubbed already via inline object
};

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.js') || file.startsWith('shim') || file.startsWith('dummy')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [oldPath, newPath] of Object.entries(replacementMap)) {
    // Match both single and double quoted requires
    const escaped = oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(['"])${escaped}\\1`, 'g');
    if (regex.test(content)) {
      content = content.replace(new RegExp(`(['"])${escaped}\\1`, 'g'), `'${newPath}'`);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Patched: ' + file);
  }
}

console.log('Done patching all requires.');
