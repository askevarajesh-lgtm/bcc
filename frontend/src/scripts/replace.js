const fs = require('fs');
const path = require('path');

const PRIMARY_COLOR_REGEX = /#3b82f6/gi;
const SECONDARY_COLOR_REGEX = /#0ea5e9/gi;
const PRIMARY_VAR = 'var(--accent-primary)';
const SECONDARY_VAR = 'var(--accent-secondary)';

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (!dirFile.includes('node_modules') && !dirFile.includes('.git') && !dirFile.includes('dist')) {
        filelist = walkSync(dirFile, filelist);
      }
    } else {
      if (dirFile.endsWith('.js') || dirFile.endsWith('.jsx') || dirFile.endsWith('.css')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync(path.join(__dirname, '..'));
let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  content = content.replace(PRIMARY_COLOR_REGEX, PRIMARY_VAR);
  content = content.replace(SECONDARY_COLOR_REGEX, SECONDARY_VAR);
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`Total files updated: ${changedFiles}`);
