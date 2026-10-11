#!/usr/bin/env python3
"""Verify and package the repository using only Python's standard library.

The allowlist avoids copying installed dependencies, secrets and old releases.
Every entry is hashed; timestamps/order/permissions are fixed for repeatability.
No browser-test pass is inferred from successful packaging.
"""
import argparse
import hashlib
import json
from pathlib import Path
import shutil
import subprocess
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DIRECTORIES = ('src', 'tools', 'tests', 'examples', 'schema', 'docs', 'dist', '.github')
FILES = (
    'README.md', 'CONTRIBUTING.md', 'SECURITY.md', 'LICENSE', 'LICENSING.md',
    'VERSION', 'package.json', 'package-lock.json', 'requirements-dev.txt',
    '.editorconfig', '.gitattributes', '.gitignore',
)
EXCLUDED_PARTS = {'__pycache__', 'node_modules', '.venv', '.git', 'local', 'ci'}
FORBIDDEN_SUFFIXES = {'.ttf', '.otf', '.woff', '.woff2', '.pem', '.key', '.pyc', '.zip'}
ZIP_TIME = (1980, 1, 1, 0, 0, 0)


def repository_files():
    """Yield known repository paths only; reject links instead of following them."""
    paths = [ROOT / name for name in FILES]
    for path in paths:
        if not path.is_file():
            raise ValueError(f'Missing required repository file: {path.name}')
    paths.extend(ROOT / name for name in ('NOTICE',) if (ROOT / name).exists())
    for directory in DIRECTORIES:
        if (ROOT / directory).is_symlink():
            raise ValueError(f'Refusing to traverse symlink: {directory}')
        paths.extend((ROOT / directory).rglob('*'))
    for path in sorted(set(paths)):
        relative = path.relative_to(ROOT)
        if any(part in EXCLUDED_PARTS for part in relative.parts):
            continue
        if path.is_symlink():
            raise ValueError(f'Refusing to package symlink: {relative}')
        if not path.is_file():
            continue
        if path.suffix.lower() in FORBIDDEN_SUFFIXES or path.name.startswith('.env'):
            raise ValueError(f'Unexpected sensitive, installed or archive file: {relative}')
        if path.name == '.test-configured.html':
            raise ValueError('A temporary configured-export test file is still present.')
        yield relative.as_posix(), path


def write_entry(archive, name, data):
    info = zipfile.ZipInfo(name, date_time=ZIP_TIME)
    info.compress_type = zipfile.ZIP_DEFLATED
    info.create_system = 3
    info.external_attr = 0o100644 << 16
    archive.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'releases')
    args = parser.parse_args()
    node = shutil.which('node')
    if node is None:
        raise SystemExit('Node.js 22 or later is required to verify the release.')
    # Invoke Node directly, avoiding shell-specific npm.cmd handling on Windows.
    subprocess.run([node, 'tools/check.mjs'], cwd=ROOT, check=True)
    unit_files = [str(path.relative_to(ROOT)) for path in sorted((ROOT / 'tests/unit').glob('*.test.js'))]
    subprocess.run([node, '--test', *unit_files], cwd=ROOT, check=True)
    subprocess.run([node, 'tools/build.mjs', '--check'], cwd=ROOT, check=True)
    version = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
    folder = 'slide-rule-emulator'
    output = args.output.resolve()
    output.mkdir(parents=True, exist_ok=True)
    target = output / f'slide-rule-emulator-v{version}-github.zip'
    entries = [(name, path.read_bytes()) for name, path in repository_files()]
    manifest = ''.join(hashlib.sha256(data).hexdigest() + '  ' + name + '\n' for name, data in entries)
    temporary = target.with_suffix('.zip.tmp')
    try:
        with zipfile.ZipFile(temporary, 'w') as archive:
            for name, data in entries:
                write_entry(archive, folder + '/' + name, data)
            write_entry(archive, folder + '/MANIFEST.sha256', manifest.encode())
        temporary.replace(target)
    finally:
        temporary.unlink(missing_ok=True)
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    target.with_suffix('.zip.sha256').write_text(digest + '  ' + target.name + '\n', encoding='utf-8', newline='\n')
    print(f'Packaged {len(entries)} files: {target}')
    print('SHA-256:', digest)
    print('Local QA output is excluded. Run browser checks separately; packaging is not browser certification.')


if __name__ == '__main__':
    main()
