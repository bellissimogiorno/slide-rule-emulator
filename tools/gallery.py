#!/usr/bin/env python3
"""Make review sheets and a local HTML gallery from captured browser screenshots.
Optional authoring tool: requires Pillow. Does not assert that images were reviewed.
"""
from pathlib import Path
import html
import argparse
import json
from PIL import Image, ImageDraw, ImageFont
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--qa', type=Path, default=ROOT / 'qa')
args = parser.parse_args()
QA = args.qa.resolve()
VERSION = json.loads((ROOT / 'package.json').read_text())['version']
ids = sorted({p.stem.rsplit('_', 2)[0] for p in (QA / 'screenshots').glob('*_normal.png')})
(QA / 'contact-sheets').mkdir(parents=True, exist_ok=True)
try:
    font = ImageFont.truetype('DejaVuSans.ttf', 18)
except OSError:
    font = ImageFont.load_default()
sections = []
for id in ids:
    paths = [QA / 'screenshots' / f'{id}_{face}_{mode}.png' for face in ['front', 'back'] for mode in ['normal', 'compact']]
    paths = [p for p in paths if p.exists()]
    images = [Image.open(p).convert('RGB') for p in paths]
    width = max((im.width for im in images))
    sheet = Image.new('RGB', (width, sum((im.height + 36 for im in images))), (245, 247, 249))
    draw = ImageDraw.Draw(sheet)
    y = 0
    items = []
    for path, image in zip(paths, images):
        draw.text((12, y + 7), path.stem, font=font, fill=(25, 35, 45))
        sheet.paste(image, (0, y + 36))
        y += image.height + 36
        items.append(f'<figure><a href="screenshots/{path.name}"><img loading="lazy" src="screenshots/{path.name}" alt="{html.escape(path.stem)}"></a><figcaption>{html.escape(path.stem)}</figcaption></figure>')
    sheet.save(QA / 'contact-sheets' / f'{id}.png')
    sections.append(f'<section><h2>{html.escape(id)}</h2>' + ''.join(items) + '</section>')
extra = []
for path in sorted((QA / 'features').glob('*.png')):
    name = html.escape(path.stem)
    extra.append(f'<figure><a href="features/{path.name}"><img loading="lazy" src="features/{path.name}" alt="{name}"></a><figcaption>{name}</figcaption></figure>')
sections.append('<section><h2>Linked faces and responsive views</h2>' + ''.join(extra) + '</section>')
for folder, title in [('workspace', 'Instrument-first workspace')]:
    items = []
    for path in sorted((QA / folder).glob('*.png')):
        name = html.escape(path.stem)
        items.append(f'<figure><a href="{folder}/{path.name}"><img loading="lazy" src="{folder}/{path.name}" alt="{name}"></a><figcaption>{name}</figcaption></figure>')
    if items:
        sections.append('<section><h2>' + title + '</h2>' + ''.join(items) + '</section>')
(QA / 'visual-gallery.html').write_text('<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Slide-rule visual evidence</title><style>body{font:16px system-ui;max-width:1500px;margin:32px auto;padding:0 20px;color:#23313c}figure{margin:20px 0}img{width:100%;height:auto;border:1px solid #ccc}figcaption{font-size:13px}h2{margin-top:48px}</style><h1>Visual evidence: v' + VERSION + '</h1><p>Four views per preset: both faces, with ordinary and compact numbering. Click an image for native resolution. Check the accompanying test report for the execution mode, browser and limitations. Screenshots do not constitute visual approval or cross-browser certification; record what was actually inspected.</p>' + ''.join(sections) + '</html>\n', encoding='utf-8', newline='\n')
print('Created', len(ids), 'review sheets and visual gallery.')
