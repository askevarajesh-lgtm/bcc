const fs = require('fs');
const path = require('path');

const pagesDir = path.join('E:', 'Bcc Seo', 'frontend', 'src', 'pages');

function fixColSpansInFile(filepath) {
    const original = fs.readFileSync(filepath, 'utf8');
    let content = original;

    // Regex to match <Col ...> blocks inside the file
    content = content.replace(/<Col([^>]+)(?=>)/g, (match, colContent) => {
        // Only modify if it looks like a KPI card column (has minWidth: 200 or flex: '1 1 200px')
        // Or if it's the specific columns from SEO tabs that are used for KPI cards and have kpi variable
        if (colContent.includes("minWidth: 200") || colContent.includes("flex: '1 1 200px'")) {
            // Remove responsive span properties
            // Handle curly braces first
            let newContent = colContent.replace(/\b(xs|sm|md|lg|xl|xxl|span)=\{[^}]+\}/g, '');
            // Handle string attributes
            newContent = newContent.replace(/\b(xs|sm|md|lg|xl|xxl|span)="[^"]+"/g, '');
            // Clean up extra spaces
            newContent = newContent.replace(/\s+/g, ' ');
            return '<Col' + newContent;
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Fixed: ${filepath}`);
    }
}

function walkSync(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        const stat = fs.statSync(filepath);
        if (stat.isDirectory()) {
            walkSync(filepath);
        } else if (file.endsWith('.jsx') || file.endsWith('.tsx')) {
            fixColSpansInFile(filepath);
        }
    }
}

walkSync(pagesDir);
