"""Read-only static EDIP validation. Usage: PYTHON validate_site.py SITE --output REPORT.json.

Uses bundled lxml and Pillow; output stays outside the website. This is a structural
regression audit, not a claim of full W3C conformance or live Google validation.
"""
from pathlib import Path
from urllib.parse import urlsplit, unquote
from collections import Counter, defaultdict
import argparse
import hashlib
import json
import re
import sys
from lxml import html, etree
from PIL import Image

ap = argparse.ArgumentParser()
sys.stdout.reconfigure(encoding='utf-8')
ap.add_argument('site', type=Path)
ap.add_argument('--output', type=Path, default=Path(__file__).with_name('static-report.json'))
args = ap.parse_args()
root = args.site.resolve()
report = {'site': str(root), 'errors': [], 'warnings': [], 'pages': {}, 'assets': {}, 'external_resources': [], 'external_links': {}, 'security_matches': [], 'old_strings': [], 'counts': {}}
docs = {}
raw = {}
ids = {}
origins = set()
titles, descriptions, inbound, asset_usage = defaultdict(list), defaultdict(list), defaultdict(set), defaultdict(set)
def issue(level, page, kind, detail):
    report[level].append({'page': str(page), 'kind': kind, 'detail': str(detail)})
def err(page, kind, detail): issue('errors', page, kind, detail)
def warn(page, kind, detail): issue('warnings', page, kind, detail)
def text(el): return ' '.join(el.text_content().split())
for file in sorted(root.glob('*.html')):
    name = file.name
    raw[name] = file.read_text(encoding='utf-8-sig')
    parser = html.HTMLParser()
    try: doc = html.fromstring(raw[name], parser=parser)
    except etree.ParserError as exc:
        err(name, 'html-parse', exc)
        continue
    docs[name] = doc
    ids[name] = set(doc.xpath('//*[@id]/@id'))
    for id_, n in Counter(doc.xpath('//*[@id]/@id')).items():
        if n > 1: err(name, 'duplicate-id', id_)
    for e in parser.error_log:
        if 'redefined' in e.message or 'Unexpected end tag' in e.message: err(name, 'html-syntax', e.message)
    for canonical in doc.xpath('//link[@rel="canonical"]/@href'):
        if urlsplit(canonical).netloc: origins.add(urlsplit(canonical).netloc)

def local_target(page, url, anchor=True):
    url = url.strip()
    if not url or url == '#':
        err(page, 'empty-url', repr(url)); return
    parts = urlsplit(url)
    if parts.scheme in ('mailto', 'tel', 'data', 'blob'): return
    if parts.scheme == 'javascript':
        err(page, 'javascript-url', url); return
    if parts.netloc and parts.netloc not in origins: return
    if parts.scheme not in ('', 'http', 'https'): return
    relative = unquote(parts.path)
    if parts.netloc or relative.startswith('/'): target = root / relative.lstrip('/')
    elif relative: target = (root / page).parent / relative
    else: target = root / page
    if target.is_dir(): target /= 'index.html'
    target = target.resolve()
    try: rel = target.relative_to(root).as_posix()
    except ValueError:
        err(page, 'path-outside-site', url); return
    if not target.is_file(): err(page, 'broken-local-url', url)
    if target.suffix == '.html':
        if page != rel: inbound[rel].add(page)
        if anchor and parts.fragment and rel in ids and unquote(parts.fragment) not in ids[rel]: err(page, 'missing-anchor', url)
    if target.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.ico', '.avif'):
        asset_usage[rel].add(page)
    return rel

for name, doc in docs.items():
    title = doc.xpath('//head/title')
    description = doc.xpath('//meta[@name="description"]/@content')
    h1 = doc.xpath('//h1')
    canonical = doc.xpath('//link[@rel="canonical"]/@href')
    robots = ','.join(doc.xpath('//meta[@name="robots"]/@content')).lower()
    noindex = 'noindex' in robots
    legacy = name == 'judith-faura.html' and any(urlsplit(c).path.endswith('/equip.html') for c in canonical)
    special = name == '404.html' or legacy
    indexable = not noindex and not special
    if doc.get('lang') != 'ca': err(name, 'language', doc.get('lang'))
    if len(title) != 1: err(name, 'title-count', len(title))
    if len(description) != 1: err(name, 'description-count', len(description))
    if len(h1) != 1: err(name, 'h1-count', len(h1))
    if len(canonical) != 1 and indexable: err(name, 'canonical-count', len(canonical))
    if noindex and not special: err(name, 'accidental-noindex', robots)
    if name == '404.html' and not noindex: err(name, '404-indexable', '404 should be noindex')
    if doc.xpath('//meta[@name="keywords"]'): err(name, 'meta-keywords', 'Unnecessary keywords tag')
    if title:
        titles[text(title[0])].append(name)
    if description: descriptions[description[0]].append(name)
    if canonical:
        local_target(name, canonical[0])
        expected = '/' if name == 'index.html' else '/' + name
        actual = urlsplit(canonical[0]).path
        if indexable and actual not in (expected, '/index.html' if name == 'index.html' else expected): err(name, 'canonical-wrong-page', canonical[0])
        if urlsplit(canonical[0]).scheme != 'https': err(name, 'canonical-not-https', canonical[0])
    for prop in ['og:title', 'og:description', 'og:url', 'og:image']:
        values = doc.xpath(f'//meta[@property="{prop}"]/@content')
        if len(values) != 1 and indexable: err(name, 'og-count', f'{prop}: {len(values)}')
        if values:
            if prop in ('og:url', 'og:image'): local_target(name, values[0])
            if prop == 'og:url' and canonical and values[0] != canonical[0]: err(name, 'og-url-canonical', values[0])
            if prop == 'og:title' and title and values[0] != text(title[0]): warn(name, 'og-title-differs', values[0])
    headings = [(int(e.tag[1]), text(e)) for e in doc.xpath('//h1|//h2|//h3|//h4|//h5|//h6')]
    previous = 0
    for level, label in headings:
        if previous and level > previous + 1: warn(name, 'heading-skip', f'H{previous} → H{level}: {label}')
        previous = level
    for e in doc.xpath('//*[@aria-controls or @aria-labelledby or @aria-describedby or @for]'):
        for attr in ['aria-controls', 'aria-labelledby', 'aria-describedby', 'for']:
            for id_ in e.get(attr, '').split():
                if id_ not in ids[name]: err(name, 'missing-id-reference', f'{attr}={id_}')
    for e in doc.xpath('//input[not(@type="hidden")]|//select|//textarea'):
        labelled = e.get('aria-label') or e.get('aria-labelledby') or e.xpath('ancestor::label') or (e.get('id') and doc.xpath('//label[@for=$id]', id=e.get('id')))
        if not labelled: err(name, 'missing-input-label', e.get('id') or e.get('name') or e.tag)
    for button in doc.xpath('//button'):
        if not (text(button) or button.get('aria-label') or button.get('aria-labelledby')): err(name, 'unnamed-button', etree.tostring(button, encoding='unicode'))
    for element in doc.iter():
        for attr, value in element.attrib.items():
            if attr.lower().startswith('on'): err(name, 'inline-event-handler', attr)
            if attr in ('href', 'src', 'poster'):
                local_target(name, value)
                parts = urlsplit(value)
                if parts.netloc:
                    if element.tag in ('script', 'iframe', 'img', 'source') or (element.tag == 'link' and element.get('rel') in ('stylesheet', 'preload', 'preconnect')):
                        if parts.netloc not in origins: report['external_resources'].append({'page':name,'tag':element.tag,'url':value,'deferred':bool(element.xpath('ancestor::template'))})
                    elif element.tag == 'a': report['external_links'].setdefault(value, []).append(name)
                if element.tag == 'a' and element.get('target') == '_blank' and 'noopener' not in element.get('rel', '').split(): err(name, 'blank-without-noopener', value)
            if attr == 'srcset':
                for src in value.split(','): local_target(name, src.strip().split()[0])
    for img in doc.xpath('//img'):
        if img.get('alt') is None: err(name, 'missing-alt', img.get('src'))
        if not img.get('width') or not img.get('height'): err(name, 'missing-image-dimensions', img.get('src'))
        src = local_target(name, img.get('src', ''))
        if src and (root / src).exists():
            try:
                with Image.open(root / src) as im:
                    if img.get('width') and img.get('height'):
                        width, height = int(img.get('width')), int(img.get('height'))
                        if width < 1 or height < 1: err(name, 'invalid-image-dimensions', src)
                        if abs(width / height - im.width / im.height) > .02: warn(name, 'image-ratio-mismatch', f'{src}: attributes {width}×{height}, pixels {im.width}×{im.height}')
            except Exception as exc:
                if not src.endswith('.svg'): err(name, 'invalid-image', f'{src}: {exc}')
        if img.get('loading') == 'lazy' and img.get('fetchpriority') == 'high': err(name, 'lazy-critical-image', img.get('src'))
    schemas = []
    for script in doc.xpath('//script[@type="application/ld+json"]'):
        try: data = json.loads(script.text or ''); schemas.append(data)
        except json.JSONDecodeError as exc: err(name, 'invalid-json-ld', exc); continue
        def visit(value):
            if isinstance(value, dict):
                if value.get('@type') == 'PostalAddress' and 'Entresol 1a' not in value.get('streetAddress', ''): err(name, 'schema-address', value)
                if 'aggregateRating' in value: err(name, 'self-rating-schema', value)
                if value.get('@type') == 'FAQPage':
                    for q in value.get('mainEntity', []):
                        visible = re.sub(r'\s+', ' ', doc.text_content())
                        for s in [q.get('name', ''), q.get('acceptedAnswer', {}).get('text', '')]:
                            if s and re.sub(r'\s+', ' ', s) not in visible: warn(name, 'faq-schema-mismatch', s)
                for key, child in value.items():
                    # Schema entity identifiers are IRIs, not necessarily DOM anchors.
                    if key in ('url', 'logo', 'image', 'item', '@id') and isinstance(child, str) and child.startswith(('http:', 'https:', '/')): local_target(name, child, anchor=key != '@id')
                    visit(child)
            elif isinstance(value, list):
                for child in value: visit(child)
        visit(data)
        if isinstance(data, dict) and data.get('@type') == 'BreadcrumbList':
            visible_crumbs = doc.xpath('//nav[contains(concat(" ",normalize-space(@class)," ")," breadcrumbs ")]//li')
            structured_crumbs = data.get('itemListElement', [])
            if len(visible_crumbs) != len(structured_crumbs): err(name, 'breadcrumb-count-mismatch', len(structured_crumbs))
            for position, (visible, structured) in enumerate(zip(visible_crumbs, structured_crumbs), 1):
                if structured.get('position') != position or text(visible) != structured.get('name'): err(name, 'breadcrumb-text-mismatch', structured)
                hrefs = visible.xpath('.//a/@href')
                if hrefs:
                    visible_path = urlsplit(hrefs[0]).path or name
                    schema_path = urlsplit(structured.get('item', '')).path.lstrip('/') or 'index.html'
                    if visible_path != schema_path: err(name, 'breadcrumb-url-mismatch', structured)
    inline_js = [s.text or '' for s in doc.xpath('//script[not(@src) and not(@type="application/ld+json")]')]
    inline_styles = doc.xpath('//*[@style]/@style')
    policies = doc.xpath('//meta[@http-equiv="Content-Security-Policy"]/@content')
    if len(policies) != 1: err(name, 'missing-csp', len(policies))
    elif any(directive not in policies[0] for directive in ["default-src 'self'", "script-src 'self'", "object-src 'none'", "base-uri 'none'"]): err(name, 'incomplete-csp', policies[0])
    if inline_js or inline_styles or doc.xpath('//style'): err(name, 'inline-code-blocked-by-csp', 'Executable inline JS or CSS')
    for frame in doc.xpath('//iframe'):
        if not frame.get('title'): err(name, 'unnamed-iframe', frame.get('src'))
        reviews_frame = name == 'index.html' and frame.get('src') == 'assets/widgets/google-reviews.html'
        if (name != 'contacte.html' and not reviews_frame) or (reviews_frame and not frame.xpath('ancestor::template')):
            err(name, 'unexpected-active-iframe', frame.get('src'))
        if reviews_frame:
            if not policies or "frame-src 'self'" not in policies[0]: err(name, 'reviews-frame-csp-blocked', frame.get('src'))
            continue
        url = urlsplit(frame.get('src', ''))
        if url.scheme != 'https' or url.netloc != 'www.google.com' or url.path != '/maps/embed':
            err(name, 'unexpected-map-origin', frame.get('src'))
        if not policies or 'frame-src https://www.google.com' not in policies[0]:
            err(name, 'map-csp-blocked', frame.get('src'))
    if doc.xpath('//meta[@name="referrer"]/@content') != ['strict-origin-when-cross-origin']: err(name, 'referrer-policy', 'Missing or inconsistent policy')
    if doc.xpath('//*[@data-cookie-accept] | //input[@data-analytics-consent and not(@disabled)]'): err(name, 'obsolete-analytics-consent', 'There is no analytics installed')
    report['pages'][name] = {'title':text(title[0]) if title else None,'description':description[0] if description else None,'canonical':canonical,'noindex':noindex,'indexable':indexable,'headings':headings,'images':len(doc.xpath('//img')),'jsonld_blocks':len(schemas),'inline_js':inline_js,'inline_style_attributes':inline_styles,'inline_style_blocks':len(doc.xpath('//style'))}
    for old in ['Preparar sol·licitud', '55 €', '40 €', 'Brief inicial', 'Atendeu', 'recursos.html', 'recurs-ansietat.html', 'recurs-primera-visita.html', 'La confiança no és un element decoratiu', 'google.com/maps/search/', 'pendent de completar', 'example.com']:
        if old.casefold() in raw[name].casefold(): err(name, 'obsolete-string', old)
    for contextual in ['Demanar visita', 'Recursos', 'Parella i família', 'Famílies', 'Plaça del Carme, 17']:
        matches = [text(e) for e in doc.xpath('//*[not(*)]') if contextual.casefold() in text(e).casefold()]
        if matches: report['old_strings'].append({'page':name,'search':contextual,'matches':matches})
    for a in doc.xpath('//header//a'):
        if text(a) == 'Demanar visita': err(name, 'old-header-cta', a.get('href'))
        if text(a) == 'Recursos': err(name, 'old-navigation', a.get('href'))
for mapping, kind in [(titles, 'duplicate-title'), (descriptions, 'duplicate-description')]:
    for value, names in mapping.items():
        if len(names) > 1: err(', '.join(names), kind, value)

if 'index.html' in docs:
    def links(doc, xpath):
        return [(a.get('href'), text(a)) for a in doc.xpath(xpath)]
    for name, doc in docs.items():
        for selector in ['//header//nav[@class="desktop-nav"]//a', '//header//nav[@aria-label="Navegació mòbil"]//a', '//footer//a']:
            if links(doc, selector) != links(docs['index.html'], selector): err(name, 'shared-navigation-drift', selector)

sitemap = root / 'sitemap.xml'
sitemap_pages = set()
if sitemap.exists():
    try:
        tree = etree.parse(str(sitemap))
        for url in tree.xpath('//*[local-name()="loc"]/text()'):
            rel = local_target('sitemap.xml', url)
            if rel:
                sitemap_pages.add(rel)
                if rel in report['pages'] and not report['pages'][rel]['indexable']: err('sitemap.xml', 'noncanonical-or-noindex', rel)
                if rel in report['pages'] and report['pages'][rel]['canonical'] != [url]: err('sitemap.xml', 'canonical-mismatch', url)
    except etree.XMLSyntaxError as exc: err('sitemap.xml', 'invalid-xml', exc)
else: err('sitemap.xml', 'missing', 'sitemap.xml')
for name, page in report['pages'].items():
    if page['indexable'] and name not in sitemap_pages: err(name, 'missing-sitemap-url', name)
    if page['indexable'] and name != 'index.html' and not inbound[name]: err(name, 'orphan-page', name)
robots = (root / 'robots.txt').read_text(encoding='utf-8') if (root / 'robots.txt').exists() else ''
if re.search(r'^Disallow:\s*/\s*$', robots, re.M): err('robots.txt', 'blocks-site', '/')
for pattern in ['assets', '*.css', '*.js', '*.webp']:
    if any(line.lower().startswith('disallow:') and pattern in line for line in robots.splitlines()): err('robots.txt', 'blocks-assets', pattern)

binary_hashes = defaultdict(list)
security_pattern = re.compile(r'http://|javascript:|\beval\s*\(|innerHTML|outerHTML|document\.write|localStorage|sessionStorage|target=[\"\x27]_blank|API_KEY|SECRET|TOKEN|PASSWORD|\.env\b|localhost|127\.0\.0\.1', re.I)
for file in sorted(root.rglob('*')):
    if not file.is_file(): continue
    rel = file.relative_to(root).as_posix()
    if any(part in ('.git', 'node_modules', '__pycache__') for part in file.parts): continue
    if re.search(r'(^|/)(\.env|.*\.(bak|old|zip|log|dump))$|(^|/)backup', rel, re.I): warn(rel, 'possibly-exposed-file', rel)
    if file.suffix.lower() in ('.png', '.jpeg', '.jpg', '.webp', '.ico', '.gif'):
        digest = hashlib.sha256(file.read_bytes()).hexdigest();binary_hashes[digest].append(rel)
        with Image.open(file) as im:
            report['assets'][rel] = {'bytes':file.stat().st_size,'width':im.width,'height':im.height,'format':im.format,'pages':sorted(asset_usage[rel]),'sha256':digest}
        if re.search(r'foto[1-4]', file.name, re.I): err(rel, 'reference-screenshot-in-production', rel)
    elif file.suffix.lower() in ('.html', '.css', '.js', '.json', '.xml', '.txt', '.md', '.webmanifest'):
        source = file.read_text(encoding='utf-8-sig')
        for n, line in enumerate(source.splitlines(), 1):
            matches = sorted(set(security_pattern.findall(line)))
            if matches: report['security_matches'].append({'file':rel,'line':n,'matches':matches,'context':line[:400]})
        if file.suffix == '.css':
            for url in re.findall(r'url\(\s*[\"\x27]?([^\)\"\x27]+)', source): local_target(rel, url)
        if file.suffix == '.js' and re.search(r'\beval\s*\(|new\s+Function\s*\(|document\.write|outerHTML', source): err(rel, 'unsafe-js-sink', 'Review evaluator or DOM injection sink')
        if re.search(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bAKIA[0-9A-Z]{16}\b|\bgh[pousr]_[A-Za-z0-9]{30,}', source): err(rel, 'potential-secret', 'High-confidence secret pattern; do not publish')
        if file.suffix == '.webmanifest':
            try:
                for icon in json.loads(source).get('icons', []): local_target(rel, icon.get('src', ''))
            except json.JSONDecodeError as exc: err(rel, 'manifest-json', exc)
report['duplicate_assets'] = [names for names in binary_hashes.values() if len(names)>1]
report['unreferenced_assets'] = [rel for rel in report['assets'] if not asset_usage[rel]]
report['counts'] = {'html_pages':len(docs),'indexable_pages':sum(p['indexable'] for p in report['pages'].values()),'sitemap_urls':len(sitemap_pages),'images':len(report['assets']),'errors':len(report['errors']),'warnings':len(report['warnings'])}
args.output.parent.mkdir(parents=True, exist_ok=True)
args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'report':str(args.output.resolve()),**report['counts'],'errors':report['errors'],'warnings':report['warnings']},ensure_ascii=False,indent=2))
raise SystemExit(1 if report['errors'] else 0)
