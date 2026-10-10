#!/usr/bin/env python3
"""Supplemental DOM-mode high-DPI captures. Not a native-launch test.

Run with CHROMIUM_EXECUTABLE set to an installed Chromium, or install the
Playwright Chromium build. The full native/DOM matrix is in run.py.
"""
import os
from pathlib import Path
import json, importlib.util
from playwright.sync_api import sync_playwright
from PIL import Image
root = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('checks', root / 'tests/browser/run.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
out = root / 'qa/details'
out.mkdir(parents=True, exist_ok=True)
report = {'mode': 'dom', 'deviceScaleFactor': 2, 'viewportWidth': 1600, 'cases': []}
with sync_playwright() as p:
    options = {'args': ['--no-sandbox']}
    if os.environ.get('CHROMIUM_EXECUTABLE'):
        options['executable_path'] = os.environ['CHROMIUM_EXECUTABLE']
    browser = p.chromium.launch(**options)
    context = browser.new_context(viewport={'width': 1600, 'height': 1000}, device_scale_factor=2)
    page = context.new_page()
    page.set_content((root / 'dist/index.html').read_text(encoding='utf-8').replace('<head>', '<head><script>' + module.STORAGE_SHIM + '</script>', 1))
    page.wait_for_function('document.documentElement.dataset.appReady === "true"')
    baseline = page.evaluate("async()=> (await import('#main.js')).application.getProgram()")
    presets = page.evaluate("async()=> (await import('#catalog/presets.js')).PRESETS")
    for id, face in [('pickettN3', 'back'), ('faber283n', 'front'), ('thorntonAA010', 'back'), ('hyperbolic', 'front'), ('blackbody17', 'front')]:
        preset = presets[id]
        data = {**baseline, **{k: v for k, v in preset.items() if k in baseline}, 'sides': preset['sides'], 'activeSide': face, 'presetId': id, 'compactScales': True, 'cursor': 0.5, 'slideOffset': 0}
        page.locator('#jsonEditor').fill(json.dumps(data))
        page.locator('#applyJsonButton').click()
        page.evaluate('async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));}')
        geo = page.evaluate(module.GEOMETRY)
        fails = {k: v for k, v in geo.items() if k in ['collisions', 'tickCrossings', 'clipped', 'smallLabels', 'emptyRows', 'bodyOverflow'] and v}
        path = out / f'{id}_{face}_hidpi.png'
        page.locator('#ruleViewport').screenshot(path=path)
        im = Image.open(path)
        cut = out / f'{id}_{face}_left.png'
        im.crop((0, 0, min(im.width, 1300), im.height)).save(cut)
        report['cases'].append({'preset': id, 'face': face, 'passed': not fails, 'failures': fails, 'image': path.relative_to(root / 'qa').as_posix(), 'crop': cut.relative_to(root / 'qa').as_posix()})
    browser.close()
(root / 'qa/detail-review.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8', newline='\n')
print(json.dumps(report, indent=2))
