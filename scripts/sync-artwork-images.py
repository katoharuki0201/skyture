#!/usr/bin/env python3
"""Download catalog images for same-origin display; keep previous snapshots."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import time
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'src/data/artwork-images.json'
OUTPUT = ROOT / 'public/artworks'


def image_extension(data):
    if data.startswith(b'\xff\xd8\xff') and data.rstrip().endswith(b'\xff\xd9'):
        return '.jpg'
    if data.startswith(b'\x89PNG\r\n\x1a\n') and b'IEND' in data[-20:]:
        return '.png'
    if data.startswith(b'RIFF') and data[8:12] == b'WEBP':
        return '.webp'
    raise ValueError('Response is not a complete JPEG, PNG or WebP image')


def download(artwork, previous):
    source = artwork['image']
    old = next((entry for entry in previous.values() if entry['source'] == source), None)
    if old and old['source'] == source:
        path = ROOT / 'public' / old['path']
        if path.is_file():
            try:
                image_extension(path.read_bytes())
                key = next(key for key, entry in previous.items() if entry['source'] == source)
                return key, old, 'cached'
            except ValueError:
                pass
    if urlparse(source).scheme != 'https':
        raise ValueError('Image URL must use HTTPS')
    result = subprocess.run([
        'curl', '--fail', '--silent', '--show-error', '--location',
        '--proto', '=https', '--proto-redir', '=https',
        '--connect-timeout', '10', '--max-time', '20',
        '--retry', '2', '--retry-delay', '1', '--retry-max-time', '60',
        source,
    ], capture_output=True, check=True)
    data = result.stdout
    extension = image_extension(data)
    slug = re.sub(r'[^a-zA-Z0-9_-]', '-', artwork['id'])
    digest = hashlib.sha256(source.encode()).hexdigest()[:12]
    path = f'artworks/{slug}-{digest}{extension}'
    target = ROOT / 'public' / path
    temporary = target.with_suffix(target.suffix + '.tmp')
    temporary.write_bytes(data)
    temporary.replace(target)
    time.sleep(.25)
    key = artwork['id']
    if key in previous and previous[key]['source'] != source:
        key = f'{key}-{digest}'
    return key, {'source': source, 'path': path}, 'downloaded'


def main():
    artworks = json.loads((ROOT / 'src/data/artworks.json').read_text())['artworks']
    previous = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
    # Keep images for saved history even after removal from the current catalog.
    sources = {artwork['image'] for artwork in artworks}
    for key, entry in previous.items():
        if entry['source'] not in sources:
            artworks.append({'id': key, 'image': entry['source']})
            sources.add(entry['source'])
    manifest = dict(previous)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    failed = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        jobs = {executor.submit(download, artwork, previous): artwork['id'] for artwork in artworks}
        for number, future in enumerate(concurrent.futures.as_completed(jobs), 1):
            artwork_id = jobs[future]
            try:
                key, entry, status = future.result()
                manifest[key] = entry
                print(f'[{number}/{len(artworks)}] {key}: {status}', flush=True)
            except Exception as error:
                failed.append(artwork_id)
                # Do not print response bodies, cookies, or request environment.
                print(f'[{number}/{len(artworks)}] {artwork_id}: FAILED ({type(error).__name__})', flush=True)
    temporary_manifest = MANIFEST.with_suffix('.json.tmp')
    temporary_manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    temporary_manifest.replace(MANIFEST)
    if failed:
        print('Images still missing: ' + ', '.join(failed), file=sys.stderr)
        return 1
    print(f'All {len(artworks)} images are available locally (including previous catalog entries).')
    return 0


if __name__ == '__main__':
    sys.exit(main())
