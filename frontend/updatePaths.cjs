const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'e:/Bcc Seo/frontend/src/pages/performance/PerformanceScorecardPage.jsx',
  'e:/Bcc Seo/frontend/src/pages/performance/PerformanceHistoryPage.jsx',
  'e:/Bcc Seo/frontend/src/pages/performance/CalculatePerformancePage.jsx',
];

for (const filePath of filesToUpdate) {
  if (!fs.existsSync(filePath)) continue;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Ensure useLocation is imported from react-router-dom
  if (!content.includes('useLocation')) {
    content = content.replace(/import {([^}]*)useNavigate([^}]*)} from (['"])react-router-dom(['"]);/, (match, p1, p2, p3, p4) => {
      return `import {${p1}useNavigate, useLocation${p2}} from ${p3}react-router-dom${p4};`;
    });
  }

  // 2. Ensure `const location = useLocation();` exists
  if (!content.includes('const location = useLocation();')) {
    content = content.replace(/const navigate = useNavigate\(\);/, 'const navigate = useNavigate();\n  const location = useLocation();');
  }

  // 3. Replace all static navigate('/hrms/performance/...') paths
  content = content.replace(/navigate\(\s*["'`]\/hrms\/performance([^"'`]*)["'`]\s*\)/g, (match, suffix) => {
    return `navigate(\`\${location.pathname.startsWith("/user") ? "/user/performance" : "/hrms/performance"}${suffix}\`)`;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated ${filePath}`);
}
