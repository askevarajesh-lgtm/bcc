const fs = require('fs');
const path = require('path');

const pagesDir = path.join('E:', 'Bcc Seo', 'frontend', 'src', 'pages');

function fixKpiColsInFile(filepath) {
    const original = fs.readFileSync(filepath, 'utf8');
    let content = original;

    // Look for `.map((kpi, i) => (` or similar followed by `<Col ... >`
    // We'll replace the `<Col ...>` with `<Col style={{ flex: '1 1 200px', minWidth: 200 }} key={i}>`
    
    // Using a regex to find `.map((xxx) => (` and then the `<Col ...>`
    const regex = /(\.map\([^)]*\)\s*=>\s*\(?\s*)(<Col[^>]*>)/gs;
    
    content = content.replace(regex, (match, prefix, colTag) => {
        // If it's a kpi map or issue map
        if (prefix.includes('kpi') || prefix.includes('issue')) {
            // Find what key is used, usually `key={i}` or `key={idx}` or `key={kpi.label}`
            const keyMatch = colTag.match(/key=\{[^}]+\}/);
            const keyStr = keyMatch ? keyMatch[0] : 'key={i}';
            
            return `${prefix}<Col style={{ flex: '1 1 200px', minWidth: 200 }} ${keyStr}>`;
        }
        return match;
    });

    // Also handle `.map((kpi, i) => {\n  return (\n <Col ...>`
    const regexBlock = /(\.map\([^)]*\)\s*=>\s*\{[^}]*return\s*\(\s*)(<Col[^>]*>)/gs;
    content = content.replace(regexBlock, (match, prefix, colTag) => {
        if (prefix.includes('kpi') || prefix.includes('issue')) {
            const keyMatch = colTag.match(/key=\{[^}]+\}/);
            const keyStr = keyMatch ? keyMatch[0] : 'key={i}';
            return `${prefix}<Col style={{ flex: '1 1 200px', minWidth: 200 }} ${keyStr}>`;
        }
        return match;
    });

    if (content !== original) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`Fixed KPI Col in: ${filepath}`);
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
            fixKpiColsInFile(filepath);
        }
    }
}

walkSync(pagesDir);
