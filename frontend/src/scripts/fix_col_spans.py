import os
import re

pages_dir = r"E:\Bcc Seo\frontend\src\pages"

def fix_col_spans_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content

    # Find <Col tags that contain style={{ flex: '1 1 200px', minWidth: 200}} or similar minWidth: 200
    # and strip out xs, sm, md, lg, xl, xxl, span properties.
    def replace_col(m):
        col_content = m.group(1)
        # Check if it has minWidth: 200
        if "minWidth: 200" in col_content:
            # Remove responsive props. They can look like xs={24} or xl={kpi.label === 'POSTS PUBLISHED' ? 8 : 4}
            # This regex finds propName={...} or propName="..."
            col_content = re.sub(r'\b(xs|sm|md|lg|xl|xxl|span)=\{.*?\}', '', col_content, flags=re.DOTALL)
            col_content = re.sub(r'\b(xs|sm|md|lg|xl|xxl|span)=".*?"', '', col_content)
            
            # Clean up multiple spaces
            col_content = re.sub(r'\s+', ' ', col_content)
            
            # Ensure it has style={{ flex: 1, minWidth: 200 }} or flex="1 1 200px"
            # It already has it if it reached here
            return f"<Col {col_content.strip()}"
        return m.group(0)

    # We match from <Col up to the closing >
    content = re.sub(r'<Col(.*?)(?=>)', replace_col, content, flags=re.DOTALL)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed: {filepath}")

for root, dirs, files in os.walk(pages_dir):
    for filename in files:
        if filename.endswith(".jsx") or filename.endswith(".tsx"):
            fix_col_spans_in_file(os.path.join(root, filename))
