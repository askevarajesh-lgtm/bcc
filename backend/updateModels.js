const fs = require('fs');
const path = require('path');

const updateSettingsModel = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/whatsapp: \{ type: Boolean, default: false \},/g, 'whatsapp: { type: Boolean, default: false },\n      sms: { type: Boolean, default: false },');
  content = content.replace(/whatsapp: \{ type: Boolean, default: true \},/g, 'whatsapp: { type: Boolean, default: true },\n      sms: { type: Boolean, default: false },'); // just in case
  fs.writeFileSync(filePath, content);
};

const updateNotificationModel = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/\/\/ Future: sms, push, etc\./, 'sms: {\n        type: Boolean,\n        default: false,\n      },\n      // Future: push, etc.');
  fs.writeFileSync(filePath, content);
};

updateSettingsModel('e:/Office Projects/Bcc/bcc/backend/src/modules/tasks/notificationSettings.model.js');
updateSettingsModel('e:/Office Projects/Bcc/bcc/backend/src/modules/tasks/companyNotificationSettings.model.js');
updateNotificationModel('e:/Office Projects/Bcc/bcc/backend/src/modules/tasks/notification.model.js');

console.log('Models updated successfully.');
