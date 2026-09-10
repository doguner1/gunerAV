import os
import re

filepath = 'src/app/[locale]/products/[slug]/page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace parameter destructing
new_content = re.sub(
    r'\{\s*params:\s*\{\s*locale,\s*slug\s*\}\s*,?\s*\}',
    '{ params }',
    content
)

# Replace type annotation
new_content = re.sub(
    r'\{\s*params\s*:\s*\{\s*locale\s*:\s*string;\s*slug\s*:\s*string\s*\}\s*,?\s*\}',
    '{ params: Promise<{ locale: string; slug: string }> }',
    new_content
)

# Insert await
pattern = re.compile(
    r'(\{\s*params\s*\}\s*:\s*\{\s*params:\s*Promise<\{\s*locale:\s*string;\s*slug:\s*string\s*\}>\s*\}\s*\)(?:\s*:\s*Promise<[^>]+>)?\s*\{)',
    re.MULTILINE
)

new_content = pattern.sub(r'\1\n  const { locale, slug } = await params;', new_content)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)
print(f"Updated {filepath}")

