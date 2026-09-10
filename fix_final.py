import os

def fix_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()
    for old, new in replacements:
        content = content.replace(old, new)
    with open(filepath, 'w') as f:
        f.write(content)

fix_file('src/app/[locale]/layout.tsx', [
    ('children, params: { locale }', 'children, params'),
])

fix_file('src/app/[locale]/products/[slug]/page.tsx', [
    ('const { locale, slug } = await params;\n  const { locale } = await params;', 'const { locale, slug } = await params;'),
])
