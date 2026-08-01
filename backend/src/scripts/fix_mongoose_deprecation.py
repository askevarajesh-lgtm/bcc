import os
import re

count = 0
for root, _, files in os.walk(r'e:\Bcc Seo\backend\src'):
    for file in files:
        if file.endswith('.js') or file.endswith('.cjs'):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                new_content = re.sub(r'\{\s*upsert\s*:\s*true\s*,\s*new\s*:\s*true\s*\}', r"{ upsert: true, returnDocument: 'after' }", content)
                new_content = re.sub(r'\{\s*new\s*:\s*true\s*,\s*upsert\s*:\s*true\s*\}', r"{ returnDocument: 'after', upsert: true }", new_content)
                new_content = re.sub(r'\{\s*new\s*:\s*true\s*,\s*runValidators\s*:\s*true\s*\}', r"{ returnDocument: 'after', runValidators: true }", new_content)
                new_content = re.sub(r'\{\s*new\s*:\s*true\s*\}', r"{ returnDocument: 'after' }", new_content)
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    count += 1
            except Exception as e:
                pass
print(f'Replaced in {count} files')
