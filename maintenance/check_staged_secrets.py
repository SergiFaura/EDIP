"""Check the exact Git index before commit. Never print credential values."""
import json
from pathlib import Path
import re
import subprocess


PATTERNS = (
    ("Google API key", rb"AIza[A-Za-z0-9_-]{35}"),
    ("GitHub token", rb"(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})"),
    ("AWS access key", rb"(?:AKIA|ASIA)[A-Z0-9]{16}"),
    ("private key", rb"-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----"),
)


def inspect_blob(name, data, local_key=b''):
    reasons = []
    leaf = name.replace('\\', '/').rsplit('/', 1)[-1].lower()
    if leaf in {'google-reviews-config.js', 'api_google.txt', '.env'}:
        reasons.append('local configuration must not be tracked')
    if local_key and local_key in data:
        reasons.append('configured local API key')
    for label, pattern in PATTERNS:
        if re.search(pattern, data):
            reasons.append(label)
    return reasons


def main():
    root = Path(__file__).resolve().parents[1]
    git = ['git', '-c', f'safe.directory={root.as_posix()}', '-C', str(root)]
    # Read only the known local config, without printing or copying its contents.
    config = root / 'edip_site/assets/js/google-reviews-config.js'
    match = re.search(rb"\bapiKey\s*:\s*(['\"])(.*?)\1", config.read_bytes()) if config.exists() else None
    key = match.group(2).strip() if match else b''
    paths = subprocess.check_output(git + ['ls-files', '--cached', '-z']).split(b'\0')
    findings = []
    count = 0
    for raw in filter(None, paths):
        name = raw.decode('utf-8')
        data = subprocess.check_output(git + ['show', ':' + name])
        count += 1
        reasons = inspect_blob(name, data, key)
        if reasons:
            findings.append({'file': name, 'reasons': reasons})
    print(json.dumps({'indexed_files_checked': count, 'findings': findings}, ensure_ascii=True))
    return 1 if findings else 0


if __name__ == '__main__':
    raise SystemExit(main())
