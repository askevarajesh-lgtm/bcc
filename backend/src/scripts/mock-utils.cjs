const fs = require('fs');
const path = require('path');

const dir = 'e:/Bcc Seo/backend/src/modules/tasks';

// We create a dummy logger and timeline helper in the tasks directory itself
const dummyLogger = `
module.exports = {
  info: console.log,
  error: console.error,
  warn: console.warn,
  debug: console.log
};
`;

const dummyTimeline = `
module.exports = {
  createTimelineEvent: async () => {}
};
`;

const dummyConfig = `
module.exports = {
  port: 3000,
  jwtSecret: 'dummy',
  corsOrigin: '*'
};
`;

fs.writeFileSync(path.join(dir, 'dummyLogger.js'), dummyLogger);
fs.writeFileSync(path.join(dir, 'dummyTimeline.js'), dummyTimeline);
fs.writeFileSync(path.join(dir, 'dummyConfig.js'), dummyConfig);

// Now search and replace in all .js files
const files = fs.readdirSync(dir);
for (const file of files) {
  if (file.endsWith('.js') && !file.startsWith('dummy')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    if (content.includes('../../utils/logger')) {
      content = content.replace(/['"]\.\.\/\.\.\/utils\/logger['"]/g, "'./dummyLogger'");
      changed = true;
    }
    if (content.includes('../../utils/timeline.helper')) {
      content = content.replace(/['"]\.\.\/\.\.\/utils\/timeline\.helper['"]/g, "'./dummyTimeline'");
      changed = true;
    }
    if (content.includes('../../config/env')) {
      content = content.replace(/['"]\.\.\/\.\.\/config\/env['"]/g, "'./dummyConfig'");
      changed = true;
    } else if (content.includes('../../config')) {
      content = content.replace(/['"]\.\.\/\.\.\/config['"]/g, "'./dummyConfig'");
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content);
      console.log('Updated ' + file);
    }
  }
}
