const fs = require('fs');
const path = require('path');

const directory = 'e:/Bcc Seo/frontend/src/pages/Tasks';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (content.includes('navigate("/tasks') || content.includes("navigate('/tasks")) {
    content = content.replace(/navigate\(['"]\/tasks([^'"]*)['"]\)/g, 'navigate("/workspace/tasks$1")');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Updated navigate in ' + filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

walkDir(directory);
