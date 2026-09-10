import re
with open('src/app/[locale]/layout.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    "  const { locale } = await params;\n  setRequestLocale(locale);", 
    "  setRequestLocale(locale);"
)

with open('src/app/[locale]/layout.tsx', 'w') as f:
    f.write(content)
