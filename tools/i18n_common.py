"""Shared helpers for the language build: find translatable strings in a Czech page."""
import re

PAGES = [
    'index.html', 'sluzby.html', 'sluzba-frezovani.html', 'sluzba-laser.html',
    'sluzba-ohybani-plexi.html', 'sluzba-kompletace.html', 'realizace.html',
    'chranena-dilna.html', 'o-nas.html', 'kontakt.html',
]
LANGS = ['en', 'de', 'pl']

TEXT_RE = re.compile(r'>([^<>]*[^<>\s][^<>]*)<')
ATTR_RE = re.compile(r'\b(content|alt|placeholder|aria-label|title)="([^"]*[^"\s][^"]*)"')
SKIP_BLOCKS = re.compile(r'<(script|style)\b.*?</\1>', re.S)


def norm(s):
    return ' '.join(s.split())


def strings(html):
    """Yield every visible text node and translatable attribute value (normalized)."""
    body = SKIP_BLOCKS.sub('', html)
    for m in TEXT_RE.finditer(body):
        yield norm(m.group(1))
    for m in ATTR_RE.finditer(body):
        if m.group(1) == 'content' and 'name="description"' not in body[max(0, m.start() - 40):m.start()]:
            continue
        yield norm(m.group(2))
