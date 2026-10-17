import re
from pathlib import Path

def count_visible_words(filepath):
    content = Path(filepath).read_text(encoding='utf-8')
    lines = content.splitlines()
    body = '\n'.join([l for l in lines if not l.strip().startswith('import ') and not l.strip().startswith('export type ') and not l.strip().startswith('export interface ')])
    
    # Extract JSX text outside tags
    jsx_text = re.findall(r'>([^<>{}\n]+)<', body)
    
    # Extract common string literals
    raw_strings = re.findall(r'"([^"{\n]{3,})"', body) + re.findall(r"'([^'{\n]{3,})'", body)
    # Filter out Tailwind CSS classes and filepaths
    clean_strings = []
    for s in raw_strings:
        if any(cls in s for cls in ['bg-', 'text-', 'p-', 'm-', 'flex', 'grid', 'rounded', 'border', 'w-', 'h-', 'hover:']):
            continue
        if s.startswith('/') or s.startswith('./') or s.endswith('.png') or s.endswith('.svg') or s.endswith('.css'):
            continue
        clean_strings.append(s)
        
    combined = ' '.join(jsx_text + clean_strings)
    words = [w for w in combined.split() if re.search(r'[a-zA-Z0-9]', w)]
    return len(words)

if __name__ == '__main__':
    frontend = Path('frontend/src')
    print("=== PAGES TEXT AUDIT ===")
    pages_total = 0
    for p in sorted(frontend.glob('pages/*.tsx')):
        w = count_visible_words(p)
        pages_total += w
        print(f"{p.name}: {w} words")
    print(f"Total Pages words: {pages_total}\n")

    print("=== COMPONENTS TEXT AUDIT ===")
    comp_total = 0
    for p in sorted(frontend.glob('components/**/*.tsx')):
        rel = p.relative_to(frontend / 'components')
        w = count_visible_words(p)
        comp_total += w
        print(f"{str(rel)}: {w} words")
    print(f"Total Components words: {comp_total}\n")
    print(f"GRAND TOTAL: {pages_total + comp_total} words")
