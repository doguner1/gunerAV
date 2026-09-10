import os
import re

for root, _, files in os.walk('src/app'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()

            new_content = re.sub(r'(const \{ locale \} = await params;\s*)+', 'const { locale } = await params;\n  ', content)
            
            # also fix admin page `export default function` -> `export default async function`
            new_content = new_content.replace('export default function AdminPage', 'export default async function AdminPage')

            # fix layout.tsx `children, params: { locale }` -> `children, params`
            new_content = new_content.replace('children, params: { locale }', 'children, params')

            with open(filepath, 'w') as f:
                f.write(new_content)

