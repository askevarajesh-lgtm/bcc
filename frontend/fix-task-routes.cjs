const fs = require('fs');
const path = require('path');

const dir = 'e:/Bcc Seo/frontend/src/pages/Tasks';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (!file.endsWith('.jsx') && !file.endsWith('.js')) continue;
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix the one remaining bad navigate path: "/tasks" should be "/workspace/tasks"
  // but only for absolute task paths, not nested ones
  if (content.includes('navigate("/tasks"') || content.includes("navigate('/tasks'")) {
    content = content.replace(/navigate\(["']\/tasks["'],/g, 'navigate("/workspace/tasks",');
    content = content.replace(/navigate\(["']\/tasks["']\)/g, 'navigate("/workspace/tasks")');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed routes in: ' + file);
  }
}

console.log('Done.');
