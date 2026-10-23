from pathlib import Path
from PIL import Image
from lxml import html
import json

root = Path('C:/Users/Administrador/Documents/ChatGPT/EDIP/edip_site')
pages = ['psicologia-adults.html', 'psicologia-infantil-juvenil.html', 'pedagogia-reeducacions.html', 'logopedia.html', 'parella-familia.html', 'tallers-formacions.html', 'centre.html']
expected = {
    'psicologia-adults.html': ['Primera visita: 60 €', 'Seguiment: 50 €', 'Atenció presencial a Tàrrega i online'],
    'psicologia-infantil-juvenil.html': ['Primera visita: 60 €', 'Seguiment: 50 €'],
    'pedagogia-reeducacions.html': ['Reeducació: 38 €', 'Durada orientativa: 45 min', 'Discalcúlia.', 'TEA i altres trastorns del neurodesenvolupament.', 'Atenció i memòria.'],
    'logopedia.html': ['Sessió: 38 €'],
    'parella-familia.html': ['Primera visita: 70 €', 'Seguiment: 60 €', 'Tarifes per a teràpia de parella i teràpia familiar.'],
    'tallers-formacions.html': ['1. Reunió inicial'],
    'centre.html': ['Adults', 'Adolescents', 'Infants', 'Psicopedagogia i logopèdia', 'Tallers i formacions', 'Plaça del Carme, 17, Entresol 1a.'],
}
issues = []
checked = 0
for page in pages:
    content = (root / page).read_text(encoding='utf-8')
    document = html.fromstring(content)
    main = document.xpath('//main')[0]
    visible = main.text_content()
    for term in expected[page]:
        if term not in visible:
            issues.append(f'{page}: missing {term}')
    for old in ['55 €', '40 €', '1. Brief inicial']:
        if old in visible:
            issues.append(f'{page}: old content {old}')
    if page == 'pedagogia-reeducacions.html':
        answer = main.xpath('//details[summary="La família rep orientacions?"]/div')[0].text_content()
        if not answer.startswith('Sí.'):
            issues.append('Pedagogia family FAQ does not start with Sí.')
    for image in document.xpath('//img'):
        checked += 1
        path = root / image.get('src', '')
        if not path.is_file():
            issues.append(f'{page}: missing image {path.name}')
            continue
        if not image.get('alt'):
            issues.append(f'{page}: image without alt')
        with Image.open(path) as decoded:
            if (image.get('width'), image.get('height')) != tuple(str(n) for n in decoded.size):
                issues.append(f'{page}: incorrect intrinsic image dimensions {path.name}')
    if page == 'centre.html' and len(main.xpath('//div[contains(@class, "room-gallery")]/figure/figcaption')) != 5:
        issues.append('Centre gallery does not contain five captioned rooms')

assets = []
for path in sorted((root / 'assets/images').iterdir()):
    references = [p.name for p in root.glob('*.html') if path.name in p.read_text(encoding='utf-8')]
    with Image.open(path) as im:
        assets.append({'asset': 'assets/images/' + path.name, 'width': im.width, 'height': im.height, 'bytes': path.stat().st_size, 'pages': references, 'has_exif': bool(im.getexif()), 'has_xmp': bool(im.info.get('xmp'))})
    if path.name.startswith('sala-') and not references:
        issues.append(f'Unreferenced new asset {path.name}')
for path in root.rglob('*'):
    if path.is_file() and path.name in {f'foto{n}.jpeg' for n in range(1, 5)}:
        issues.append(f'Reference capture copied into project: {path.name}')
report = {'pages_checked': len(pages), 'images_checked': checked, 'issues': issues, 'assets': assets}
Path(__file__).with_name('assets-services-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps(report, ensure_ascii=False, indent=2))
raise SystemExit(bool(issues))
