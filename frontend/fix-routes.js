
const fs = require('fs');
const fp = 'e:\\\\Bcc Seo\\\\frontend\\\\src\\\\pages\\\\Marketplace\\\\SEOWorkspace.jsx';
let content = fs.readFileSync(fp, 'utf8');

// Using purely literal strings to replace the broken urls
content = content.split('\/api/seo-intelligence/websites//analytics\').join('\/api/seo-intelligence/websites//analytics\');
content = content.split('\/api/seo-intelligence/websites//tasks\').join('\/api/seo-intelligence/websites//tasks\');
content = content.split('\/api/seo-intelligence/tasks//status\').join('\/api/seo-intelligence/tasks//status\');
content = content.split('\/api/seo-intelligence/websites//reports\').join('\/api/seo-intelligence/websites//reports\');
content = content.split('\/api/seo-intelligence/websites//generate-report\').join('\/api/seo-intelligence/websites//generate-report\');
content = content.split('\/api/seo-intelligence/websites//settings\').join('\/api/seo-intelligence/websites//settings\');
content = content.split('\/api/seo-intelligence/websites//audit\').join('\/api/seo-intelligence/websites//audit\');
content = content.split('\/api/seo-intelligence/websites//strategies/generate\').join('\/api/seo-intelligence/websites//strategies/generate\');
content = content.split('\/api/seo-intelligence/websites//strategies//publish\').join('\/api/seo-intelligence/websites//strategies//publish\');

fs.writeFileSync(fp, content);
console.log('Fixed URLs');

