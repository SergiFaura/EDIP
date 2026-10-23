"""Checks for credential detection; fixtures are synthesized, never real keys."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location('guard', Path(__file__).parents[1] / 'maintenance/check_staged_secrets.py')
guard = importlib.util.module_from_spec(spec)
spec.loader.exec_module(guard)


class StagedSecrets(unittest.TestCase):
    def test_credential_in_unexpected_file(self):
        key = b'AIza' + b'A' * 35
        self.assertIn('Google API key', guard.inspect_blob('qa/report.json', b'{"value":"' + key + b'"}'))
        self.assertIn('configured local API key', guard.inspect_blob('notes.txt', b'prefix-local-value', b'local-value'))

    def test_configuration_path_is_forbidden_even_empty(self):
        self.assertTrue(guard.inspect_blob('edip_site/assets/js/google-reviews-config.js', b''))
        self.assertTrue(guard.inspect_blob('API_GOOGLE.txt', b''))

    def test_blank_example_is_safe(self):
        self.assertEqual(guard.inspect_blob('google-reviews-config.example.js', b"apiKey: '', placeId: ''"), [])

    def test_private_key_header(self):
        data = b'-----BEGIN ' + b'RSA PRIVATE KEY-----'
        self.assertIn('private key', guard.inspect_blob('backup.txt', data))


if __name__ == '__main__':
    unittest.main(verbosity=2)
