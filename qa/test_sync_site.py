"""Integration checks for the optional maintenance tool; never edits the live site."""
import hashlib
from html import escape
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / 'maintenance/sync_site.py'
DATA = ROOT / 'maintenance/site-data.json'


def snapshot(root):
    return {p.relative_to(root).as_posix(): (hashlib.sha256(p.read_bytes()).hexdigest(), p.stat().st_mtime_ns)
            for p in root.rglob('*') if p.is_file()}


class Synchronization(unittest.TestCase):
    def test_check_is_read_only_and_current(self):
        before = snapshot(ROOT / 'edip_site')
        result = subprocess.run([sys.executable, str(SCRIPT), '--check'], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0, result.stderr + result.stdout)
        self.assertEqual(before, snapshot(ROOT / 'edip_site'))

    def test_changes_propagate_and_second_run_is_idempotent(self):
        with tempfile.TemporaryDirectory(prefix='edip-sync-qa-') as directory:
            root = Path(directory)
            site = root / 'site'
            shutil.copytree(ROOT / 'edip_site', site)
            data = json.loads(DATA.read_text(encoding='utf-8'))
            original_maps = data['maps']
            original_reviews = data['maps_reviews']
            original_embed = data['maps_embed']
            data['maps_embed'] = 'https://www.google.com/maps/embed?pb=qa-only-not-a-live-map'
            data.update(name='Centre QA & prova', base_url='https://edip-test.invalid', phone='+34611111111', phone_display='+34 611 111 111',
                        email='contacte@edip-test.invalid', maps='https://maps.app.goo.gl/test', maps_reviews='https://www.google.com/maps/reviews-test',
                        instagram='https://www.instagram.com/edip_test/', whatsapp='https://wa.me/34611111111')
            data['street'] = 'Carrer de prova, 1'
            data['address'] = f"{data['street']} · {data['postal_code']} {data['city']}, {data['region']}"
            original_portraits = {key: data['images'][key] for key in ('judith', 'ester', 'maria', 'teresa')}
            for key, original in original_portraits.items():
                new_image = f'assets/images/{key}-test.webp'
                shutil.copyfile(site / original, site / new_image)
                data['images'][key] = new_image
            config = root / 'data.json'
            config.write_text(json.dumps(data), encoding='utf-8')
            command = [sys.executable, str(SCRIPT), '--site', str(site), '--data', str(config)]
            before = snapshot(site)
            check = subprocess.run(command + ['--check'], capture_output=True, text=True)
            self.assertEqual(check.returncode, 1)
            self.assertEqual(before, snapshot(site))
            result = subprocess.run(command, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            for file in site.glob('*.html'):
                source = file.read_text(encoding='utf-8')
                for old in ['https://www.ediptarrega.com/', 'mailto:edip@ediptarrega.com', 'tel:+34654298745', original_maps, original_reviews]:
                    self.assertNotIn(old, source, file.name)
                self.assertIn('mailto:contacte@edip-test.invalid', source)
                self.assertIn(data['address'], source)
                self.assertIn(escape(data['name']) + '</span>. Tots els drets reservats.', source)
            self.assertIn(data['maps_reviews'], (site / 'index.html').read_text(encoding='utf-8'))
            contact = (site / 'contacte.html').read_text(encoding='utf-8')
            self.assertIn(data['maps_embed'], contact)
            self.assertNotIn(original_embed, contact)
            team = (site / 'equip.html').read_text(encoding='utf-8')
            for key, original in original_portraits.items():
                self.assertNotIn(original, team)
                self.assertIn('"image":"' + data['base_url'] + '/' + data['images'][key] + '"', team)
            self.assertIn(data['street'] + '.</h2>', (site / 'centre.html').read_text(encoding='utf-8'))
            legal = (site / 'avis-legal.html').read_text(encoding='utf-8')
            self.assertIn(data['address'] + '</span>. Contacte del centre:', legal)
            self.assertIn('judithfaurapsicologa@gmail.com', legal)
            self.assertIn('Judith Faura Alsina', legal)
            self.assertIn(data['base_url'], (site / 'sitemap.xml').read_text())
            self.assertIn(data['base_url'], (site / 'robots.txt').read_text())
            after = snapshot(site)
            again = subprocess.run(command, capture_output=True, text=True)
            self.assertEqual(again.returncode, 0, again.stderr)
            self.assertEqual(after, snapshot(site))
            self.assertEqual(subprocess.run(command + ['--check'], capture_output=True).returncode, 0)
            # A hostile URL is rejected before any site writes.
            data['maps'] = 'javascript:alert(1)'
            config.write_text(json.dumps(data), encoding='utf-8')
            self.assertNotEqual(subprocess.run(command, capture_output=True).returncode, 0)
            self.assertEqual(after, snapshot(site))

    def test_untrusted_map_embed_rejected_without_writes(self):
        with tempfile.TemporaryDirectory(prefix='edip-map-config-qa-') as directory:
            root = Path(directory)
            site = root / 'site'
            shutil.copytree(ROOT / 'edip_site', site)
            before = snapshot(site)
            data = json.loads(DATA.read_text(encoding='utf-8'))
            config = root / 'data.json'
            for url in ['javascript:alert(1)', 'http://www.google.com/maps/embed?pb=x',
                        'https://www.google.com.evil.invalid/maps/embed?pb=x',
                        'https://user@www.google.com/maps/embed?pb=x',
                        'https://www.google.com/maps/other?pb=x']:
                with self.subTest(url=url):
                    data['maps_embed'] = url
                    config.write_text(json.dumps(data), encoding='utf-8')
                    result = subprocess.run([sys.executable, str(SCRIPT), '--site', str(site), '--data', str(config)], capture_output=True)
                    self.assertNotEqual(result.returncode, 0)
                    self.assertEqual(before, snapshot(site))


if __name__ == '__main__':
    unittest.main(verbosity=2)
