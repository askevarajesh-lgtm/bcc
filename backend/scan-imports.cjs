const fs = require('fs');
const path = require('path');

const dir = 'e:/Bcc Seo/backend/src/modules/tasks';

// Collect all missing util/config imports across all .js files
const missingPatterns = new Set();
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.js') && !file.startsWith('dummy')) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const matches = content.match(/require\(['"][^'"]*['"]\)/g) || [];
    for (const m of matches) {
      const mod = m.replace(/require\(['"]/, '').replace(/['"]\)/, '');
      if (mod.startsWith('../..') || mod.startsWith('..')) {
        missingPatterns.add(mod);
      }
    }
  }
}

console.log('External requires found:');
for (const p of missingPatterns) {
  console.log(' ', p);
}
