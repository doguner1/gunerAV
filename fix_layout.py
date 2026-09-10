import re
with open('src/app/[locale]/layout.tsx', 'r') as f:
    content = f.read()

content = re.sub(
    r'export default async function LocaleLayout\(\{\s*children,\s*params:\s*\{\s*locale\s*\}\s*,?\s*\}\)',
    'export default async function LocaleLayout({\n  children,\n  params,\n})',
    content
)

with open('src/app/[locale]/layout.tsx', 'w') as f:
    f.write(content)
