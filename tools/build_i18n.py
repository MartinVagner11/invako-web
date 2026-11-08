"""Build the EN/DE/PL versions of the site from the Czech pages.

Czech pages in the site root are the source. Translations live in i18n/<lang>.json
as {"czech text": "translation"}. Run from the web folder:

    python3 tools/build_i18n.py

It (re)writes en/, de/ and pl/, refreshes the language switcher on every page,
and lists any Czech text that has no translation yet.
"""
import json
import pathlib
import re
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
from i18n_common import LANGS, PAGES, norm, strings  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Text that stays the same in every language (names, numbers, contact details).
KEEP = {
    'INVAKO', '©', '/', '01', '02', '03', '04', '13', '500+', 'PVC', 'MDF', 'E-mail', 'Web',
    'Google Maps', 'Apple Maps', 'Waze', '+420 775 565 671', 'franzova.hana@invako.cz',
    'Podnásepní 450/1a', 'Trnitá, 602 00 Brno', '01783564', 'CZ01783564',
    'Street View – Podnásepní 450/1a, Brno', 'CZ', 'EN', 'DE', 'PL',
    'Čeština', 'English', 'Deutsch', 'Polski',
    'CZ +420', 'SK +421', 'DE +49', 'AT +43', 'PL +48', 'HU +36', 'GB +44',
}

# code, short label, flag file, language name in that language
SWITCH_LANGS = [
    ('cs', 'CZ', 'cz', 'Čeština'),
    ('en', 'EN', 'gb', 'English'),
    ('de', 'DE', 'de', 'Deutsch'),
    ('pl', 'PL', 'pl', 'Polski'),
]
SWITCH_RE = re.compile(r'\n? *<(nav|details) class="lang".*?</\1>', re.S)


def switcher(page, current):
    """Language dropdown for one page; `current` is the language of the page being written."""
    prefix = '' if current == 'cs' else '../'
    cur = next(l for l in SWITCH_LANGS if l[0] == current)
    items = []
    for code, label, flag, name in SWITCH_LANGS:
        href = prefix + (page if code == 'cs' else f'{code}/{page}')
        attrs = ' aria-current="true"' if code == current else f' hreflang="{code}"'
        items.append(f'\n          <li><a href="{href}" lang="{code}"{attrs}>'
                     f'<img src="images/flags/{flag}.svg" alt="" width="20" height="14">{name}</a></li>')
    return ('\n      <details class="lang">'
            f'\n        <summary aria-label="Jazyk"><img src="images/flags/{cur[2]}.svg" alt="" width="20" height="14">{cur[1]}</summary>'
            '\n        <ul class="lang__menu">' + ''.join(items) + '\n        </ul>'
            '\n      </details>')


def with_switcher(html, page, current):
    html = SWITCH_RE.sub('', html)
    anchor = '      </div>\n    </div>\n  </div>\n\n  <!-- HLAVIČKA -->'
    if anchor not in html:
        raise SystemExit(f'{page}: top bar layout changed, cannot place the language switcher')
    return html.replace(anchor, '      </div>' + switcher(page, current) + '\n    </div>\n  </div>\n\n  <!-- HLAVIČKA -->', 1)


def flexible(text):
    """Regex for `text` that tolerates any whitespace between words."""
    return r'\s+'.join(re.escape(w) for w in text.split())


def translate(html, table):
    # Longest keys first so a short key never eats part of a longer one.
    for key in sorted(table, key=len, reverse=True):
        val = table[key]
        pat = flexible(key)
        html = re.sub(r'>(\s*)' + pat + r'(\s*)<', lambda m: f'>{m.group(1)}{val}{m.group(2)}<', html)
        html = re.sub(r'\b(content|alt|placeholder|aria-label|title)="' + pat + '"',
                      lambda m: f'{m.group(1)}="{val}"', html)
        html = re.sub(r'(<title>)' + pat + '(</title>)', lambda m: f'{m.group(1)}{val}{m.group(2)}', html)
    return html


def relocate_assets(html):
    """Pages in a language folder sit one level down; point shared files one level up."""
    html = re.sub(r'(href|src)="(styles\.css|script\.js|images/)', r'\1="../\2', html)
    return html.replace("url('images/", "url('../images/")


def main():
    missing = {}
    for page in PAGES:
        src_path = ROOT / page
        src = with_switcher(src_path.read_text(encoding='utf8'), page, 'cs')
        src_path.write_text(src, encoding='utf8')

        for lang in LANGS:
            table = json.loads((ROOT / 'i18n' / f'{lang}.json').read_text(encoding='utf8'))
            html = with_switcher(src, page, lang)
            html = html.replace('<html lang="cs">', f'<html lang="{lang}">', 1)
            html = relocate_assets(html)
            html = translate(html, table)
            done = set(table.values())
            for s in strings(html):
                if s in table or s in KEEP or s in done:
                    continue
                if norm(s) in {norm(k) for k in table}:
                    continue
                if any(ch in s for ch in 'ěščřžýáíéůúťďň') or s in table:
                    missing.setdefault(lang, set()).add(s)
            out = ROOT / lang / page
            out.parent.mkdir(exist_ok=True)
            out.write_text(html, encoding='utf8')

    for lang in LANGS:
        left = sorted(missing.get(lang, ()))
        print(f'{lang}: {len(PAGES)} pages written' + (f', {len(left)} untranslated:' if left else ', all text translated'))
        for s in left:
            print('   -', s)


if __name__ == '__main__':
    main()
