const fs = require('fs');
const path = require('path');

const dir = 'e:/Bcc Seo/frontend/src/pages/Tasks';
const missing = new Set();
const files = fs.readdirSync(dir);

for (const file of files) {
  if (!file.endsWith('.jsx') && !file.endsWith('.js')) continue;
  const content = fs.readFileSync(path.join(dir, file), 'utf8');
  // find all from "..." imports
  const matches = content.match(/from ["'][^"']+["']/g) || [];
  for (const m of matches) {
    const mod = m.replace(/^from ["']/, '').replace(/["']$/, '');
    if (mod.startsWith('../../hooks/') || mod.startsWith('../../utils/')) {
      missing.add(mod);
    }
  }
}

for (const m of missing) console.log(m);
