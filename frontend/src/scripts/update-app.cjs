const fs = require('fs');

let content = fs.readFileSync('e:/Bcc Seo/frontend/src/App.jsx', 'utf8');

// Replace standard <Tasks /> imports with TasksPage and TaskForm
content = content.replace(/import Tasks from '\.\/pages\/Tasks\/Tasks';/g, "import TasksPage from './pages/Tasks/TasksPage';\nimport TaskForm from './pages/Tasks/TaskForm';");

// Replace routes inside workspace and client
content = content.replace(/<Route path="workspace\/tasks" element=\{<Tasks \/>\} \/>/g, '<Route path="workspace/tasks" element={<TasksPage />} />\n          <Route path="workspace/tasks/new" element={<TaskForm />} />');
content = content.replace(/<Route path="tasks" element=\{<Tasks \/>\} \/>/g, '<Route path="tasks" element={<TasksPage />} />\n          <Route path="tasks/new" element={<TaskForm />} />');

fs.writeFileSync('e:/Bcc Seo/frontend/src/App.jsx', content);
console.log('App.jsx updated');
