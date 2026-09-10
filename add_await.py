import os
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find { params }: { params: Promise<{ locale: string }> }
    # and insert const { locale } = await params;
    
    # Let's just search for the function opening brace that has params Promise
    pattern = re.compile(r'(export\s+(?:default\s+)?(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*(?::\s*Promise<[^>]+>\s*)?\{)')
    
    def replacer(match):
        orig = match.group(1)
        if 'Promise<{ locale: string; slug: string }>' in orig or 'Promise<{ locale: string, slug: string }>' in orig:
            return orig + '\n  const { locale, slug } = await params;'
        elif 'Promise<{ locale: string }>' in orig:
            return orig + '\n  const { locale } = await params;'
        return orig

    new_content = pattern.sub(replacer, content)
    
    with open(filepath, 'w') as f:
        f.write(new_content)

for root, _, files in os.walk('src/app'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

