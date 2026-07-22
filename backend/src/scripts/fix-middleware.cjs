const fs = require('fs');
const path = require('path');

const dir = 'e:/Bcc Seo/backend/src/modules/tasks';
const middlewaresDir = '../../middlewares';

// Map old middleware paths → actual paths in this project
const replacementMap = {
  '../../middleware/auth.middleware':       `${middlewaresDir}/authMiddleware`,
  '../../middleware/tenant.middleware':     `${middlewaresDir}/authMiddleware`,  // tenant = same as auth here
  '../../middleware/permission.middleware': `${middlewaresDir}/rbac.middleware`,
  '../../middleware/rbac.middleware':       `${middlewaresDir}/rbac.middleware`,
  '../../middleware/upload.middleware':     `${middlewaresDir}/upload`,
};

const files = fs.readdirSync(dir);
for (const file of files) {
  if (!file.endsWith('.js') || file.startsWith('shim') || file.startsWith('dummy')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [oldPath, newPath] of Object.entries(replacementMap)) {
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

console.log('Done patching middleware paths.');
