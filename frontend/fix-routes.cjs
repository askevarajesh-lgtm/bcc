const fs = require('fs');
const path = require('path');
const dir = './src/pages/performance';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

const target = 'location.pathname.startsWith("/user") ? "/user/performance" : "/hrms/performance"';
const replacement = 'location.pathname.startsWith("/agency") ? "/agency/hrms/performance" : location.pathname.startsWith("/client") ? "/client/hrms/performance" : location.pathname.startsWith("/user") ? "/user/performance" : "/hrms/performance"';

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(target)) {
    content = content.split(target).join(replacement);
    fs.writeFileSync(filePath, content);
    console.log('Updated', file);
  }
});
