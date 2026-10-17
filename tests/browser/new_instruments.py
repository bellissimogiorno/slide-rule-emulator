#!/usr/bin/env python3
"""Check the Mathema and Aristo presets through real Chromium HTTP navigation.

The committed standalone build is staged unchanged. Actual downloads, fresh
browser contexts and pointer/key input are used; there is no DOM-mode fallback.
The report records setup failures as failures, including missing prerequisites.
"""
import argparse
import functools
import http.server
import importlib.metadata
import json
import os
from pathlib import Path
import platform
import tempfile
import threading
import traceback

ROOT = Path(__file__).resolve().parents[2]
GEOMETRY = Path(__file__).with_name('geometry.js').read_text(encoding='utf-8')
MODELS = {'faber284n': 24, 'aristo0971': 25, 'aristo0972': 31}
ORDERED_GROUPS = {
    'Classic instruments': [
        ['aristo0971', 'aristo0972'],
        ['faber282n', 'faber283n', 'faber284n'],
        ['graphoplex690a', 'graphoplex691a'],
        ['pickettN3', 'pickettN4', 'pickettN16'],
    ],
    'Specialist instruments': [['pickett14', 'blackbody17']],
}


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', choices=['native'], default='native')
    parser.add_argument('--executable', default=os.environ.get('CHROMIUM_EXECUTABLE'))
    parser.add_argument('--visual', action='store_true', help='Retain instrument screenshots')
    parser.add_argument('--output', type=Path, default=ROOT / 'qa/new-instruments')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    report = {'mode': 'native HTTP', 'python': platform.python_version(),
              'functional': [], 'rendering': [], 'errors': [], 'passed': False,
              'limitations': ['Chromium on local HTTP; not a live Pages deployment or cross-browser test.']}

    def record():
        (args.output / 'results.json').write_text(
            json.dumps(report, indent=2) + '\n', encoding='utf-8')

    def passed(message):
        report['functional'].append(message)
        record()
        print(message, flush=True)

    try:
        # Import inside the recorded failure boundary: setup is part of the result.
        from playwright.sync_api import sync_playwright
        report['playwright'] = importlib.metadata.version('playwright')
        html = (ROOT / 'dist/index.html').read_bytes()
        with tempfile.TemporaryDirectory(prefix='new-instruments-', dir=args.output) as temporary:
            staging = Path(temporary)
            (staging / 'index.html').write_bytes(html)
            # Avoid unrelated favicon 404 console noise; application errors remain errors.
            (staging / 'favicon.ico').write_bytes(b'')
            server = http.server.ThreadingHTTPServer(
                ('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(staging)))
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            origin = f'http://127.0.0.1:{server.server_port}'
            try:
                with sync_playwright() as pw:
                    options = {'args': ['--no-sandbox']}
                    if args.executable:
                        options['executable_path'] = args.executable
                    browser = pw.chromium.launch(**options)
                    report['browser'] = browser.version
                    report['browserExecutable'] = args.executable or 'Playwright-managed Chromium'
                    try:
                        def new_page(context):
                            page = context.new_page()
                            page.set_default_timeout(15000)
                            page.on('pageerror', lambda error: report['errors'].append(str(error)))
                            page.on('console', lambda message: report['errors'].append(message.text)
                                    if message.type == 'error' else None)
                            return page

                        def settle(page):
                            page.evaluate('async () => { await document.fonts.ready; '
                                          'await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }')

                        def load(page, route='index.html'):
                            response = page.goto(origin + '/' + route)
                            assert response and response.status == 200, 'Application did not return HTTP 200'
                            page.wait_for_function('document.documentElement.dataset.appReady === "true"')
                            settle(page)

                        def state(page):
                            return page.evaluate("async () => (await import('#main.js')).application.getProgram()")

                        def download(page, selector):
                            with page.expect_download() as event:
                                page.locator(selector).click()
                            return Path(event.value.path()).read_bytes()

                        def assert_layout(page, model):
                            programme = state(page)
                            assert programme['presetId'] == model
                            assert programme['viewMode'] == 'both'
                            assert page.locator('#ruleCanvas .rule-face').count() == 2
                            assert page.locator('#ruleCanvas .scale-row').count() == MODELS[model]
                            for side, rails in programme['sides'].items():
                                for rail in ['topStator', 'slide', 'bottomStator']:
                                    actual = page.locator(
                                        f'#ruleCanvas [data-side="{side}"] [data-rail="{rail}"] > .scale-row'
                                    ).evaluate_all('rows => rows.map(row => row.dataset.scale)')
                                    assert actual == rails[rail], (model, side, rail, actual)

                        def assert_linked(page):
                            geometry = page.locator('#ruleCanvas .rule-face-body').evaluate_all('''faces => faces.map(face => {
                                const pane = face.querySelector('.top-stator .tick-pane').getBoundingClientRect();
                                const cursor = face.querySelector('.cursor').getBoundingClientRect();
                                const mover = face.querySelector('.slide-mover');
                                const slidePane = mover.parentElement.getBoundingClientRect();
                                return { cursor: (cursor.left + cursor.width / 2 - pane.left) / pane.width,
                                         slide: (mover.getBoundingClientRect().left - slidePane.left) / slidePane.width };
                            })''')
                            assert len(geometry) == 2
                            programme = state(page)
                            # Agreement between faces alone would let two stale
                            # drawings pass while the programme continues moving.
                            for face in geometry:
                                assert abs(face['cursor'] - programme['cursor']) < 0.0001, (face, programme['cursor'])
                                assert abs(face['slide'] - programme['slideOffset']) < 0.0001, (face, programme['slideOffset'])
                            assert abs(geometry[0]['cursor'] - geometry[1]['cursor']) < 0.002, geometry
                            assert abs(geometry[0]['slide'] - geometry[1]['slide']) < 0.002, geometry

                        with browser.new_context(viewport={'width': 1800, 'height': 1200},
                                                 accept_downloads=True) as context:
                            page = new_page(context)
                            try:
                                load(page)
                                catalogue_ids = page.evaluate("async () => Object.keys((await import('#catalog/presets.js')).PRESETS)")
                                menu = page.locator('#presetSelect').evaluate('''select => ({
                                    options: [...select.options].map(o => ({id: o.value, text: o.textContent.trim()})),
                                    groups: [...select.querySelectorAll('optgroup')].map(g => ({
                                        name: g.label, ids: [...g.children].map(o => o.value)
                                    }))
                                })''')
                                assert sorted(o['id'] for o in menu['options']) == sorted(catalogue_ids + ['custom'])
                                assert all(o['text'] and 'undefined' not in o['text'] for o in menu['options'])
                                groups = {g['name']: g['ids'] for g in menu['groups']}
                                assert len(groups) == len(menu['groups']), 'Duplicate catalogue sections'
                                for section, manufacturers in ORDERED_GROUPS.items():
                                    for ids in manufacturers:
                                        indices = [groups[section].index(model) for model in ids]
                                        assert indices == list(range(indices[0], indices[0] + len(ids))), (section, ids, indices)
                                passed('Menu: complete labelled catalogue; Aristo, Faber-Castell, Graphoplex and Pickett models adjacent in numeric order within their sections')

                                for model in MODELS:
                                    page.select_option('#presetSelect', model)
                                    page.click('#loadPresetButton')
                                    page.select_option('#sideSelect', '')
                                    settle(page)
                                    assert_layout(page, model)
                                    original = state(page)
                                    for width in [390, 1800]:
                                        page.set_viewport_size({'width': width, 'height': 1200})
                                        for mode in ['conventional', 'adaptive']:
                                            page.select_option('#graduationModeSelect', mode)
                                            for compact in [True, False]:
                                                page.locator('#compactScaleToggle').set_checked(compact)
                                                settle(page)
                                                assert_layout(page, model)
                                                geometry = page.evaluate(GEOMETRY)
                                                for key in ['collisions', 'tickCrossings', 'clipped', 'emptyRows']:
                                                    assert not geometry[key], (model, width, mode, compact, key, geometry[key][:8])
                                                assert geometry['bodyOverflow'] <= 1, geometry['bodyOverflow']
                                                report['rendering'].append({'model': model, 'width': width,
                                                    'graduationMode': mode, 'compact': compact, 'rows': MODELS[model], 'passed': True})
                                                record()
                                                if args.visual:
                                                    page.locator('#ruleCanvas').screenshot(
                                                        path=args.output / f'{model}-{width}-{mode}-{compact}.png')
                                    assert state(page)['sides'] == original['sides']
                                    assert state(page)['cursor'] == original['cursor']
                                    assert state(page)['slideOffset'] == original['slideOffset']
                                    passed(f'{model}: both faces, both numbering styles and graduation modes at 390px and 1800px')

                                    page.set_viewport_size({'width': 1800, 'height': 1200})
                                    page.locator('#motionStep [data-step="0.001"]').click()
                                    for selector, field, other in [('#cursorRange', 'cursor', 'slideOffset'),
                                                                    ('#slideRange', 'slideOffset', 'cursor')]:
                                        page.locator(selector).focus()
                                        before = state(page)
                                        page.keyboard.press('ArrowRight')
                                        settle(page)
                                        assert abs(state(page)[field] - before[field] - .001) < 1e-12
                                        assert state(page)[other] == before[other]
                                        assert_linked(page)
                                        grip = page.locator(selector)
                                        grip.scroll_into_view_if_needed()
                                        box = grip.bounding_box()
                                        x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
                                        before = state(page)
                                        page.mouse.move(x, y)
                                        page.mouse.down()
                                        page.mouse.move(x + 20, y, steps=5)
                                        page.mouse.up()
                                        settle(page)
                                        assert state(page)[field] > before[field], (model, field)
                                        assert state(page)[other] == before[other]
                                        assert_linked(page)
                                    passed(f'{model}: actual keys and grip drags move cursor and slide with both faces linked')

                                    exported = download(page, '#exportJsonButton')
                                    expected = json.loads(exported)
                                    assert expected == state(page)
                                    with browser.new_context(viewport={'width': 1800, 'height': 1200}) as fresh:
                                        imported = new_page(fresh)
                                        load(imported)
                                        imported.locator('#importJsonFile').set_input_files(
                                            {'name': model + '.json', 'mimeType': 'application/json', 'buffer': exported})
                                        imported.wait_for_function("document.getElementById('jsonStatus').textContent === 'JSON applied.'")
                                        settle(imported)
                                        assert state(imported) == expected
                                        assert_layout(imported, model)
                                    standalone = download(page, '#saveHtmlButton')
                                    route = model + '-configured.html'
                                    (staging / route).write_bytes(standalone)
                                    with browser.new_context(viewport={'width': 1800, 'height': 1200}) as fresh:
                                        configured = new_page(fresh)
                                        load(configured, route)
                                        assert state(configured) == expected
                                        assert_layout(configured, model)
                                    passed(f'{model}: actual JSON file import and standalone HTML download restore exact state in fresh browser contexts')
                                assert not report['errors'], report['errors']
                                passed('No uncaught page exceptions or browser console errors')
                            except Exception:
                                try:
                                    page.screenshot(path=args.output / 'failure.png', timeout=5000)
                                except Exception:
                                    pass
                                raise
                    finally:
                        browser.close()
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=5)
        report['passed'] = True
    except Exception:
        report['failure'] = traceback.format_exc()
        print(report['failure'], flush=True)
    finally:
        record()
    if not report['passed']:
        raise SystemExit(1)
    print(f"Passed {len(report['functional'])} functional and {len(report['rendering'])} rendering checks.", flush=True)


if __name__ == '__main__':
    main()
