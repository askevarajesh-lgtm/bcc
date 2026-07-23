import os
import re

def replace_in_files(directory):
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.git' in dirs:
            dirs.remove('.git')
        if 'dist' in dirs:
            dirs.remove('dist')
            
        for file in files:
            filepath = os.path.join(root, file)
            if not file.endswith(('.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.json', '.svg')):
                continue
                
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Replace BCC Martech with M1 Labs (case insensitive)
                new_content = re.sub(re.compile(r'bcc martech', re.IGNORECASE), 'M1 Labs', content)
                
                if file == 'favicon.svg':
                    new_content = re.sub(r'>bcc<', '>M1<', new_content)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Updated: {filepath}")
            except Exception as e:
                print(f"Error reading/writing {filepath}: {e}")

replace_in_files(r'e:\Bcc Seo')
