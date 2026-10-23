"""Update public global data in static HTML, without browser JS or a build dependency.

python maintenance/sync_site.py [--check] [--site edip_site] [--data FILE]
Markers identify only shared fields. Page copy, contextual alt text and legal
identity remain hand-authored. Only the Python standard library is needed.
"""
import argparse
from html import escape
from html.parser import HTMLParser
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
VOID = set('area base br col embed hr img input link meta param source track wbr'.split())


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__(convert_charrefs=False)
        self.source = source
        self.offsets = [0]
        for match in re.finditer('\n', source):
            self.offsets.append(match.end())
        self.nodes, self.stack = [], []
        self.feed(source)

    def source_offset(self):
        line, column = self.getpos()
        return self.offsets[line - 1] + column

    def handle_starttag(self, tag, attrs):
        start = self.source_offset()
        node = {'tag': tag, 'attrs': dict(attrs), 'start': start,
                'inner': start + len(self.get_starttag_text()), 'end': None}
        self.nodes.append(node)
        if tag not in VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.stack.pop()['end'] = self.source_offset() + len(self.get_starttag_text())

    def handle_endtag(self, tag):
        if self.stack and self.stack[-1]['tag'] == tag:
            self.stack.pop()['end'] = self.source_offset()


def attribute(tag, name, value):
    pattern = rf'(\s{re.escape(name)}\s*=\s*)([\"\x27])(.*?)\2'
    updated, count = re.subn(pattern, lambda m: m[1] + '"' + escape(str(value), quote=True) + '"', tag, count=1)
    if count:
        return updated
    return re.sub(r'(/?>)$', lambda m: f' {name}="{escape(str(value), quote=True)}"' + m[1], tag)


def render(source, filename, data):
    doc = Document(source)
    values = {k: v for k, v in data.items() if isinstance(v, str)}
    values.update({'images.' + k: v for k, v in data['images'].items()})
    values.update(phone_href='tel:' + data['phone'], email_href='mailto:' + data['email'])
    values['street_heading'] = data['street'] + '.'
    canonical = next((n['attrs'].get('href', '') for n in doc.nodes if n['tag'] == 'link' and n['attrs'].get('rel') == 'canonical'), '')
    old_base = urlsplit(canonical)
    canonical_path = urlsplit(canonical).path or ('/' if filename == 'index.html' else '/' + filename)
    values['page_url'] = data['base_url'] + canonical_path
    values['og_image_url'] = data['base_url'] + '/' + data['og_image']
    edits = []
    text_keys = ['name', 'phone_display', 'email', 'address']
    image_keys = ['logo', 'business_image'] + ['images.' + k for k in data['images']]

    def schema(value):
        if isinstance(value, list):
            return [schema(v) for v in value]
        if not isinstance(value, dict):
            if isinstance(value, str) and old_base.netloc and value.startswith(old_base.scheme + '://' + old_base.netloc + '/'):
                return data['base_url'] + value[len(old_base.scheme + '://' + old_base.netloc):]
            return value
        result = {k: schema(v) for k, v in value.items()}
        if result.get('@type') == 'Person':
            # Profile anchors share the image key; retain Judith's existing URL.
            profile = urlsplit(result.get('@id', '')).fragment
            image_key = 'judith' if profile == 'judith-faura' else profile
            if image_key in data['images']:
                result['image'] = data['base_url'] + '/' + data['images'][image_key]
        if result.get('@type') in ('MedicalBusiness', 'LocalBusiness', 'Organization'):
            result.update(name=data['name'], url=data['base_url'] + '/', telephone=data['phone'], email=data['email'],
                          logo=data['base_url'] + '/' + data['logo'], image=data['base_url'] + '/' + data['business_image'],
                          sameAs=[data['instagram']], hasMap=data['maps'])
            result['address'] = {'@type': 'PostalAddress', 'streetAddress': data['street'], 'postalCode': data['postal_code'],
                                 'addressLocality': data['city'], 'addressRegion': data['region'], 'addressCountry': data['country']}
        return result

    for node in doc.nodes:
        tag, attrs = node['tag'], node['attrs']
        original = source[node['start']:node['inner']]
        updated = original
        markers = {k: v for k, v in attrs.items() if k.startswith('data-site-')}
        # Bootstrap known exact fields once. Subsequent updates use the saved markers.
        for attr in ('href', 'action'):
            keys = ['phone_href', 'email_href', 'maps', 'maps_reviews', 'instagram', 'whatsapp']
            key = next((k for k in keys if attrs.get(attr) == values[k]), None)
            if tag == 'link' and attr == 'href':
                if attrs.get('rel') == 'canonical': key = 'page_url'
                if attrs.get('rel') == 'icon': key = 'favicon'
            if key: markers.setdefault('data-site-' + attr, key)
        if tag == 'img':
            key = next((k for k in image_keys if attrs.get('src') == values[k]), None)
            if key: markers.setdefault('data-site-src', key)
        if tag == 'meta':
            key = {'og:url': 'page_url', 'og:image': 'og_image_url', 'og:site_name': 'name'}.get(attrs.get('property'))
            if key: markers.setdefault('data-site-content', key)
        if node['end'] is not None and tag not in ('script', 'style'):
            content = source[node['inner']:node['end']]
            key = next((k for k in text_keys if content == values[k]), None)
            if key: markers.setdefault('data-site-text', key)
        for marker, key in markers.items():
            if key not in values: raise ValueError(f'{filename}: unknown global field {key}')
            updated = attribute(updated, marker, key)
            target = marker.removeprefix('data-site-')
            if target not in ('text', 'href', 'src', 'content', 'action'):
                raise ValueError(f'{filename}: unsupported global marker {marker}')
            if target == 'text':
                if node['end'] is None or '<' in source[node['inner']:node['end']]:
                    raise ValueError(f'{filename}: text marker must be on a plain text element')
                replacement = escape(values[key], quote=False)
                if replacement != source[node['inner']:node['end']]: edits.append((node['inner'], node['end'], replacement))
            else:
                updated = attribute(updated, target, values[key])
        if updated != original: edits.append((node['start'], node['inner'], updated))
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            original_json = source[node['inner']:node['end']]
            parsed = json.loads(original_json)
            result = schema(parsed)
            if result != parsed:
                edits.append((node['inner'], node['end'], json.dumps(result, ensure_ascii=False, separators=(',', ':')).replace('<', '\\u003c')))
    for start, end, replacement in sorted(edits, reverse=True):
        source = source[:start] + replacement + source[end:]
    return source


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--check', action='store_true', help='Report drift without writing')
    ap.add_argument('--site', type=Path, default=ROOT / 'edip_site')
    ap.add_argument('--data', type=Path, default=Path(__file__).with_name('site-data.json'))
    args = ap.parse_args()
    data = json.loads(args.data.read_text(encoding='utf-8'))
    if not re.fullmatch(r'\+[0-9]{8,15}', data['phone']):
        raise ValueError('phone must use international format, e.g. +34 followed by nine digits')
    if re.sub(r'\s', '', data['phone_display']) != data['phone']:
        raise ValueError('phone_display must match phone')
    if not re.fullmatch(r'[^\s@<>?&#]+@[^\s@<>?&#]+\.[^\s@<>?&#]+', data['email']):
        raise ValueError('email must be a plain public email address')
    expected_address = f"{data['street']} · {data['postal_code']} {data['city']}, {data['region']}"
    if data['address'] != expected_address:
        raise ValueError('address must match the structured street/postal_code/city/region')
    base = urlsplit(data['base_url'])
    if base.scheme != 'https' or not base.hostname or base.username or base.password or base.path or base.query or base.fragment:
        raise ValueError('base_url must be an HTTPS origin without a trailing slash')
    for key in ['maps', 'maps_reviews', 'instagram', 'whatsapp']:
        if urlsplit(data[key]).scheme != 'https': raise ValueError(f'{key} must use HTTPS')
    embed = urlsplit(data['maps_embed'])
    if (embed.scheme != 'https' or embed.netloc != 'www.google.com'
            or embed.path != '/maps/embed' or not embed.query.startswith('pb=') or embed.fragment):
        raise ValueError('maps_embed must be an official https://www.google.com/maps/embed?pb= URL')
    for asset in [data[k] for k in ('logo', 'favicon', 'og_image', 'business_image')] + list(data['images'].values()):
        target = (args.site / asset).resolve()
        if not target.is_relative_to(args.site.resolve()) or not target.is_file(): raise ValueError(f'Missing local asset: {asset}')
    outputs = {f: render(f.read_text(encoding='utf-8'), f.name, data) for f in sorted(args.site.glob('*.html'))}
    for name in ('sitemap.xml', 'robots.txt'):
        path = args.site / name
        source = path.read_text(encoding='utf-8')
        outputs[path] = re.sub(r'https://[^\s<]+?(?=/)', data['base_url'], source)
    path = args.site / 'site.webmanifest'
    manifest = json.loads(path.read_text(encoding='utf-8'))
    manifest['name'] = data['name']
    manifest['icons'][0]['src'] = data['favicon']
    outputs[path] = json.dumps(manifest, ensure_ascii=False, indent=2) + '\n'
    changed = []
    for path, result in outputs.items():
        if path.read_text(encoding='utf-8') != result:
            changed.append(path.name)
            if not args.check: path.write_text(result, encoding='utf-8', newline='\n')
    print(json.dumps({'mode': 'check' if args.check else 'write', 'changed': changed}, ensure_ascii=False))
    return 1 if args.check and changed else 0


if __name__ == '__main__':
    raise SystemExit(main())
