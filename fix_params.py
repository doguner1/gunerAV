import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Replace the parameter destructing
    new_content = re.sub(
        r'\{\s*params:\s*\{\s*locale\s*\}\s*,?\s*\}',
        '{ params }',
        content
    )
    
    # 2. Replace the type annotation
    new_content = re.sub(
        r'\{\s*params\s*:\s*\{\s*locale\s*:\s*string\s*\}\s*,?\s*\}',
        '{ params: Promise<{ locale: string }> }',
        new_content
    )
    
    # 3. Add const { locale } = await params;
    # Find { params }: { params: Promise<{ locale: string }> } ... {
    # and insert right after it.
    
    # It might have `): Promise<Metadata> {` or just `) {`
    
    pattern = re.compile(
        r'(\{\s*params\s*\}\s*:\s*\{\s*params:\s*Promise<\{\s*locale:\s*string\s*\}>\s*\}\s*\)(?:\s*:\s*Promise<[^>]+>)?\s*\{)',
        re.MULTILINE
    )
    
    new_content = pattern.sub(r'\1\n  const { locale } = await params;', new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src/app'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

