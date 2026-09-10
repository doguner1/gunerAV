import os
import glob
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # We want to make sure the type is Promise<{ ... }>
    content = content.replace("params: { locale: string };", "params: Promise<{ locale: string }>;")
    content = content.replace("params: { locale: string }", "params: Promise<{ locale: string }>")
    content = content.replace("params: { locale: string, slug: string }", "params: Promise<{ locale: string, slug: string }>")
    content = content.replace("params: { locale: string; slug: string };", "params: Promise<{ locale: string; slug: string }>;")
    content = content.replace("params: { locale: string; slug: string }", "params: Promise<{ locale: string; slug: string }>")

    with open(filepath, 'w') as f:
        f.write(content)

for root, _, files in os.walk('src/app'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))

