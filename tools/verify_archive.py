#!/usr/bin/env python3
"""Verify a release ZIP's complete internal manifest without extracting files."""
import argparse
import hashlib
from pathlib import Path, PurePosixPath
import zipfile


def verify(path):
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
        if len(set(names)) != len(names):
            raise ValueError('Duplicate archive member names.')
        for name in names:
            parts = PurePosixPath(name).parts
            if name.startswith('/') or '..' in parts or '\\' in name:
                raise ValueError('Unsafe archive path: ' + name)
        manifests = [name for name in names if name.endswith('/MANIFEST.sha256')]
        if len(manifests) != 1:
            raise ValueError('Expected exactly one manifest.')
        manifest_name = manifests[0]
        prefix = manifest_name.rsplit('/', 1)[0] + '/'
        expected = set()
        for line in archive.read(manifest_name).decode('utf-8').splitlines():
            digest, name = line.split('  ', 1)
            full = prefix + name
            if full in expected:
                raise ValueError('Duplicate manifest entry: ' + name)
            expected.add(full)
            actual = hashlib.sha256(archive.read(full)).hexdigest()
            if actual != digest:
                raise ValueError('Digest mismatch: ' + name)
        if expected | {manifest_name} != set(names):
            raise ValueError('Manifest does not account for exactly all archived files.')
        print(f'Verified {len(expected)} files in {Path(path).name}.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path)
    args = parser.parse_args()
    verify(args.archive)
