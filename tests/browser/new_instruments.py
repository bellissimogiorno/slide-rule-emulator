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

                        def assert_mathema_cursor(page):
                            """Measure strokes and decorative caps independently of their renderer."""
                            programme = state(page)
                            assert len(programme['sides']['front']['cursorMarks']) == 13
                            assert len(programme['sides']['back']['cursorMarks']) == 2
                            assert len(programme['sides']['front']['cursorCaptions']) == 17
                            actual = page.locator('#ruleCanvas .rule-face').evaluate_all(r'''faces => faces.map(face => {
                                const pane = face.querySelector('.top-stator .tick-pane').getBoundingClientRect();
                                const window = face.querySelector('.cursor-window');
                                const clipping = window.getBoundingClientRect();
                                const cursor = face.querySelector('.cursor');
                                const rows = [...face.querySelectorAll('.rail')].flatMap(rail =>
                                    [...rail.querySelectorAll('.scale-row')].map((row, index) => {
                                        const box = row.getBoundingClientRect();
                                        return {rail: rail.dataset.rail, index: String(index), scale: row.dataset.scale,
                                            top: box.top, bottom: box.bottom};
                                    }));
                                const boxOf = node => {
                                    const box = node.getBoundingClientRect();
                                    return {left: box.left, right: box.right, top: box.top, bottom: box.bottom};
                                };
                                const zoom = face.getBoundingClientRect().width / face.offsetWidth;
                                const cursorBox = cursor.getBoundingClientRect();
                                const main = getComputedStyle(cursor, '::after');
                                const color = getComputedStyle(cursor, '::before').backgroundColor;
                                const alpha = color.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
                                return {side: face.dataset.side, left: pane.left, width: pane.width, rows,
                                    trackTop: face.querySelector('.top-stator').getBoundingClientRect().top,
                                    trackBottom: face.querySelector('.bottom-stator').getBoundingClientRect().bottom,
                                    zoom, mainTop: cursorBox.top + parseFloat(main.top) * zoom,
                                    mainBottom: cursorBox.bottom - parseFloat(main.bottom) * zoom,
                                    glassAlpha: alpha ? Number(alpha[1]) : color === 'transparent' ? 0 : 1,
                                    mainColor: getComputedStyle(cursor, '::after').borderLeftColor,
                                    window: {left: clipping.left, width: clipping.width,
                                             overflow: getComputedStyle(window).overflow},
                                    caps: [...cursor.querySelectorAll('.cursor-cap')].map(cap => ({
                                        zone: cap.classList.contains('cursor-top-cap') ? 'topCap' : 'bottomCap', ...boxOf(cap)})),
                                    captions: [...cursor.querySelectorAll('.cursor-caption')].map(caption => ({
                                        id: caption.dataset.cursorCaption, offset: Number(caption.dataset.cursorOffset),
                                        zone: caption.dataset.cursorZone, rail: caption.dataset.cursorRail,
                                        index: caption.dataset.cursorRow, edge: caption.dataset.cursorEdge,
                                        lines: [...caption.children].map(child => child.textContent), ...boxOf(caption)})),
                                    marks: [...cursor.querySelectorAll('.cursor-mark')].map(mark => {
                                        const stroke = mark.querySelector('.cursor-mark-line').getBoundingClientRect();
                                        return {id: mark.dataset.cursorMark, offset: Number(mark.dataset.cursorOffset),
                                            x: stroke.left + stroke.width / 2, rail: mark.dataset.cursorRail,
                                            index: mark.dataset.cursorRow, endRail: mark.dataset.cursorEndRail,
                                            endIndex: mark.dataset.cursorEndRow, label: mark.title,
                                            inlineLabels: mark.querySelectorAll('.cursor-mark-label').length,
                                            color: getComputedStyle(mark.querySelector('.cursor-mark-line')).borderLeftColor,
                                            ...boxOf(mark)};
                                    })};
                            })''')
                            for face in actual:
                                side = programme['sides'][face['side']]
                                metadata = {mark['id']: mark for mark in side['cursorMarks']}
                                rows = face['rows']
                                row_map = {(row['rail'], row['index']): row for row in rows}
                                expected = []
                                # Independently collect runs of selected adjacent physical rows. A
                                # single ordinary stroke spans rails but must stop before E and EG.
                                for mark in side['cursorMarks']:
                                    if 'scales' not in mark:
                                        expected.append((mark['id'], None, None, None, None))
                                        continue
                                    run = []
                                    for row in rows + [None]:
                                        if row is not None and row['scale'] in mark['scales']:
                                            run.append(row)
                                        elif run:
                                            expected.append((mark['id'], run[0]['rail'], run[0]['index'],
                                                             run[-1]['rail'], run[-1]['index']))
                                            run = []
                                measured = [(mark['id'], mark.get('rail'), mark.get('index'),
                                             mark.get('endRail'), mark.get('endIndex')) for mark in face['marks']]
                                assert sorted(measured, key=str) == sorted(expected, key=str), (face['side'], measured, expected)
                                assert abs(face['window']['left'] - face['left']) < .6, face
                                assert abs(face['window']['width'] - face['width']) < .6, face
                                assert face['window']['overflow'] == 'hidden', face
                                assert 0 <= face['glassAlpha'] < .1, 'Demonstration backing must not become opaque glass'
                                assert abs(face['mainTop'] - face['trackTop'] - face['zoom']) < .75, face
                                assert abs(face['mainBottom'] - face['trackBottom'] + face['zoom']) < .75, face
                                for mark in face['marks']:
                                    definition = metadata[mark['id']]
                                    assert mark['offset'] == definition['offset']
                                    assert mark['label'] == definition['label']
                                    expected_x = face['left'] + (programme['cursor'] + definition['offset']) * face['width']
                                    assert abs(mark['x'] - expected_x) < .75, (face['side'], mark, expected_x)
                                    if mark.get('rail'):
                                        first = row_map[(mark['rail'], mark['index'])]
                                        last = row_map[(mark['endRail'], mark['endIndex'])]
                                        assert abs(mark['top'] - first['top']) < .75, mark
                                        assert abs(mark['bottom'] - last['bottom']) < .75, mark
                                    if definition.get('showLabel') is False:
                                        assert mark['inlineLabels'] == 0, mark
                                    if face['side'] == 'front':
                                        assert mark['color'] == face['mainColor'], 'Front marks and main hairline share red ink'
                                caption_metadata = {caption['id']: caption for caption in side.get('cursorCaptions', [])}
                                expected_captions = []
                                for caption in caption_metadata.values():
                                    if caption['zone'] == 'row':
                                        expected_captions.extend((caption['id'], row['rail'], row['index'])
                                                                 for row in rows if row['scale'] == caption['scale'])
                                    else:
                                        expected_captions.append((caption['id'], None, None))
                                assert sorted((c['id'], c.get('rail'), c.get('index')) for c in face['captions']) == sorted(expected_captions)
                                cap_map = {cap['zone']: cap for cap in face['caps']}
                                assert sorted(cap_map) == sorted({c['zone'] for c in caption_metadata.values() if c['zone'] != 'row'})
                                for zone, cap in cap_map.items():
                                    if zone == 'topCap':
                                        assert cap['bottom'] <= face['trackTop'] + .75, cap
                                    else:
                                        assert cap['top'] >= face['trackBottom'] - .75, cap
                                for caption in face['captions']:
                                    definition = caption_metadata[caption['id']]
                                    assert caption['offset'] == definition['offset']
                                    assert caption['zone'] == definition['zone']
                                    assert caption['lines'] == definition['lines']
                                    anchor = face['left'] + (programme['cursor'] + definition['offset']) * face['width']
                                    align = definition.get('align', 'center')
                                    actual_anchor = ((caption['left'] + caption['right']) / 2 if align == 'center'
                                                     else caption['left'] - 3 * face['zoom'] if align == 'start'
                                                     else caption['right'] + 3 * face['zoom'])
                                    assert abs(actual_anchor - anchor) < .75, (caption, anchor)
                                    if caption['zone'] == 'row':
                                        row = row_map[(caption['rail'], caption['index'])]
                                        assert row['scale'] == definition['scale']
                                        edge = caption['bottom'] if definition['edge'] == 'top' else caption['top']
                                        expected_edge = row['top'] if definition['edge'] == 'top' else row['bottom']
                                        assert abs(edge - expected_edge) < .75, caption
                                    else:
                                        cap = cap_map[caption['zone']]
                                        assert caption['top'] >= cap['top'] - .75 and caption['bottom'] <= cap['bottom'] + .75, caption

                        def assert_mathema_calibration(page):
                            """Use physical Y values, never the obsolete whole-track decade."""
                            checks = page.evaluate('''async () => {
                                const {BUILTIN_SCALES: scales} = await import('#catalog/scales.js');
                                const {makeRuntimeScale} = await import('#core/mappings.js');
                                const {application} = await import('#main.js');
                                const program = application.getProgram();
                                const runtime = id => makeRuntimeScale(scales[id]);
                                const Y = runtime('FC284_Y'), E = runtime('FC284_E'), EG = runtime('FC284_EG');
                                const close = (actual, expected) => Math.abs(actual - expected) < 2e-10 * Math.max(1, Math.abs(expected));
                                const failures = [];
                                for (const y of [.1, .2, .5, 1]) {
                                    const q = Y.pos(y);
                                    if (!close(E.value(q), Math.log(1000 * y) - 4.4)) failures.push(['E', y, E.value(q)]);
                                    if (!close(EG.value(q), 200 / Math.PI * Math.log(1000 * y) - 280)) failures.push(['EG', y, EG.value(q)]);
                                }
                                for (const [gon, value] of [[false, 2], [false, 7], [false, 11], [true, 100], [true, 600]]) {
                                    const j = gon ? (value === 100 ? 0 : 4) : (value === 2 ? 0 : value === 7 ? 3 : 4);
                                    const row = gon ? EG : E;
                                    const constant = j * (gon ? 140 : 2.2);
                                    const mark = program.sides.front.cursorMarks.find(m => m.id === `mathema-${gon ? 'eg' : 'e'}-${j}`);
                                    const main = row.pos(value - constant) - mark.offset;
                                    const actual = Y.value(main) * 10 ** (j + 1);
                                    const expected = Math.exp(value * (gon ? Math.PI / 200 : 1));
                                    if (!close(actual, expected)) failures.push(['exponential cursor', gon, value, actual, expected]);
                                }
                                return failures;
                            }''')
                            assert not checks, checks

                        def assert_mathema_loupe(page):
                            """The real reading lens retains caps, fractions and partial strokes."""
                            toggle = page.locator('#loupeButton')
                            if toggle.get_attribute('aria-pressed') != 'true':
                                toggle.click()
                            face = page.locator('#ruleCanvas [data-side="front"] .rule-face-body')
                            face.locator('.slide-rail').scroll_into_view_if_needed()
                            point = face.evaluate('''face => {
                                const slide = face.querySelector('.slide-rail').getBoundingClientRect();
                                const cursor = face.querySelector('.cursor').getBoundingClientRect();
                                return {x: cursor.left + cursor.width / 2, y: slide.top + slide.height / 2};
                            }''')
                            page.mouse.move(point['x'] + 1, point['y'])
                            page.mouse.move(point['x'], point['y'])
                            settle(page)
                            assert page.locator('.rule-loupe').is_visible()
                            actual = page.evaluate('''() => {
                                const face = document.querySelector('#ruleCanvas [data-side="front"] .rule-face-body');
                                const copy = document.querySelector('.rule-loupe .loupe-copy');
                                const pairs = [];
                                for (const selector of ['.cursor-window', '.cursor-cap', '.cursor-caption', '.cursor-mark-line']) {
                                    const sources = [...face.querySelectorAll(selector)], outputs = [...copy.querySelectorAll(selector)];
                                    if (sources.length !== outputs.length) throw Error('Loupe count mismatch: ' + selector);
                                    sources.forEach((source, i) => {
                                        const a = source.getBoundingClientRect(), b = outputs[i].getBoundingClientRect();
                                        pairs.push({selector, source: [a.width, a.height], output: [b.width, b.height]});
                                    });
                                }
                                const sourceFractions = [...face.querySelectorAll('.caption-fraction > span:first-child')];
                                const outputFractions = [...copy.querySelectorAll('.caption-fraction > span:first-child')];
                                return {pairs, fractionCounts: [sourceFractions.length, outputFractions.length],
                                    fractions: sourceFractions.map((source, i) => ({
                                        sourceInk: getComputedStyle(source).borderBottomColor,
                                        outputPaint: getComputedStyle(outputFractions[i]).boxShadow})),
                                    clipping: getComputedStyle(copy.querySelector('.cursor-window')).overflow,
                                    decorations: copy.querySelectorAll('[data-loupe-decoration]').length};
                            }''')
                            assert actual['fractionCounts'] == [3, 3], actual
                            assert actual['clipping'] == 'hidden' and actual['decorations'] == 2, actual
                            for pair in actual['pairs']:
                                for source, output in zip(pair['source'], pair['output']):
                                    assert abs(output - 2.5 * source) < .16, pair
                            for fraction in actual['fractions']:
                                assert fraction['outputPaint'] != 'none' and fraction['sourceInk'] in fraction['outputPaint'], fraction
                            toggle.click()
                            settle(page)

                        def apply_setup(page, programme):
                            page.locator('#importJsonFile').set_input_files({'name': 'cursor-check.json',
                                'mimeType': 'application/json', 'buffer': json.dumps(programme).encode('utf-8')})
                            page.wait_for_function('''async expected => {
                                const actual = (await import('#main.js')).application.getProgram();
                                return document.getElementById('jsonStatus').textContent === 'JSON applied.'
                                    && actual.cursor === expected.cursor && actual.slideOffset === expected.slideOffset
                                    && JSON.stringify(actual.sides) === JSON.stringify(expected.sides);
                            }''', arg=programme)
                            settle(page)

                        def exercise_mathema_cursor(page):
                            saved = state(page)
                            for position in [0, .5, 1]:
                                setup = dict(saved, cursor=position, slideOffset=0)
                                apply_setup(page, setup)
                                assert_linked(page)
                                assert_mathema_cursor(page)
                            apply_setup(page, dict(saved, cursor=.5, slideOffset=0))
                            mark = page.locator('#ruleCanvas [data-side="front"] [data-cursor-mark="mathema-eg-0"]')
                            mark.scroll_into_view_if_needed()
                            box = mark.bounding_box()
                            pane = page.locator('#ruleCanvas [data-side="front"] .top-stator .tick-pane').first.bounding_box()
                            x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
                            before = state(page)
                            page.mouse.move(x, y)
                            page.mouse.down()
                            page.mouse.move(x + 30, y, steps=5)
                            page.mouse.up()
                            settle(page)
                            after = state(page)
                            assert abs(after['cursor'] - before['cursor'] - 30 / pane['width']) < .0001, (before, after)
                            assert after['slideOffset'] == before['slideOffset']
                            assert after['sides'] == before['sides']
                            assert_linked(page)
                            assert_mathema_cursor(page)
                            # The cream cap is a new input surface; grabbing it
                            # must preserve the cursor's existing grab offset.
                            cap = page.locator('#ruleCanvas [data-side="front"] .cursor-top-cap')
                            cap.scroll_into_view_if_needed()
                            cap_box = cap.bounding_box()
                            x, y = cap_box['x'] + cap_box['width'] / 2, cap_box['y'] + cap_box['height'] / 2
                            before = state(page)
                            page.mouse.move(x, y)
                            page.mouse.down()
                            page.mouse.move(x + 20, y, steps=5)
                            page.mouse.up()
                            settle(page)
                            after = state(page)
                            assert abs(after['cursor'] - before['cursor'] - 20 / pane['width']) < .0001, (before, after)
                            assert after['slideOffset'] == before['slideOffset'] and after['sides'] == before['sides']
                            assert_linked(page)
                            assert_mathema_cursor(page)
                            apply_setup(page, saved)

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
                                                if model == 'faber284n':
                                                    assert_mathema_cursor(page)
                                                else:
                                                    assert page.locator('#ruleCanvas .cursor-window, #ruleCanvas .cursor-cap, #ruleCanvas .cursor-caption').count() == 0
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

                                    if model == 'faber284n':
                                        assert_mathema_calibration(page)
                                        exercise_mathema_cursor(page)
                                        assert_mathema_loupe(page)
                                        passed('Mathema: calibrated E/EG banks, scoped continuous strokes, transparent glass, separate cap and gauge captions, unclamped edges and actual auxiliary-line dragging')

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
