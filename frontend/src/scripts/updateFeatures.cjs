const fs = require('fs');
const path = require('path');

const dir = 'e:/Bcc Seo/frontend/src';

function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && (filePath.endsWith('.js') || filePath.endsWith('.jsx'))) {
            callback(filePath, stat);
        } else if (stat.isDirectory() && name !== 'node_modules') {
            walkSync(filePath, callback);
        }
    });
}

walkSync(dir, function(filePath, stat) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('const availableFeatures = [')) {
        console.log('Found in:', filePath);
        if (content.includes("{ id: 'hrms', label: 'HRMS' }")) {
           console.log('  -> Already has hrms');
        } else {
           const newContent = content.replace(
              /const availableFeatures = \[/,
              "const availableFeatures = [\n  { id: 'hrms', label: 'HRMS' },"
           );
           fs.writeFileSync(filePath, newContent, 'utf8');
           console.log('  -> Updated');
        }
    }
});
