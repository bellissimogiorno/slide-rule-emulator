#!/usr/bin/env python3
"""Exercise the shared C/D-and-W selector and the actual rendered W graduations.

Native HTTP is the default. Explicit DOM mode is an opaque-origin test with a
storage substitute; it is not evidence of native navigation or persistence.
"""
import argparse
import functools
import http.server
import importlib.metadata
import json
from pathlib import Path
import threading
import traceback

from playwright.sync_api import sync_playwright
from run import QuietHandler, STORAGE_SHIM

ROOT = Path(__file__).resolve().parents[2]
GEOMETRY = Path(__file__).with_name('geometry.js').read_text(encoding='utf-8')
W_IDS = ['W1', 'W2', 'W1P', 'W2P']
CHOICES = ['pocket', 'standard', 'fine', 'adaptive']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', choices=['native', 'dom'], default='native')
    parser.add_argument('--executable')
    parser.add_argument('--output', type=Path, default=ROOT / 'qa/w-subdivisions')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    report = {'mode': args.mode, 'playwright': importlib.metadata.version('playwright'),
              'rendering': [], 'functional': [], 'errors': []}
    server = http.server.ThreadingHTTPServer(
        ('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT / 'dist')))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=args.executable, args=['--no-sandbox'])
            report['browser'] = browser.version
            context = browser.new_context(viewport={'width': 1600, 'height': 1200}, accept_downloads=True)
            page = context.new_page()
            page.set_default_timeout(15000)
            page.on('pageerror', lambda err: report['errors'].append(str(err)))
            html = (ROOT / 'dist/index.html').read_text(encoding='utf-8')
            if args.mode == 'dom':
                page.set_content(html.replace('<head>', '<head><script>' + STORAGE_SHIM + '</script>', 1))
            else:
                page.goto(f'http://127.0.0.1:{server.server_port}/index.html')
            page.wait_for_function('document.documentElement.dataset.appReady === "true"')

            def settle():
                page.evaluate('async () => { await document.fonts.ready; '
                              'await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }')

            def state():
                return page.evaluate("async () => (await import('#main.js')).application.getProgram()")

            def fingerprint():
                return page.evaluate("""ids => Object.fromEntries(ids.map(id => [id,
                    [...document.querySelectorAll(`#ruleCanvas .scale-row[data-scale="${id}"] .tick`)]
                    .map(t => [t.dataset.pos, t.className])]))""", W_IDS)

            def validate_render():
                actual = fingerprint()
                expected = page.evaluate("""async ids => {
                    const {application} = await import('#main.js');
                    const {BUILTIN_SCALES:S} = await import('#catalog/scales.js');
                    const {generateTicks} = await import('#core/ticks/index.js');
                    const {makeRuntimeScale} = await import('#core/mappings.js');
                    const data = application.getProgram();
                    return Object.fromEntries(ids.map(id => {
                        const row = document.querySelector(`#ruleCanvas .scale-row[data-scale="${id}"]`);
                        const width = row.querySelector('.tick-pane').getBoundingClientRect().width;
                        return [id, generateTicks(S[id], makeRuntimeScale(S[id]), width, 1.65, data).map(t=>t.pos)];
                    }));
                }""", W_IDS)
                for id in W_IDS:
                    positions = [float(item[0]) for item in actual[id]]
                    assert len(positions) == len(expected[id]), (id, len(positions), len(expected[id]))
                    assert all(abs(a - b) < 1e-6 for a, b in zip(positions, expected[id])), id
                assert actual['W1'] == actual['W1P'] and actual['W2'] == actual['W2P']
                geometry = page.evaluate(GEOMETRY)
                for key in ['collisions', 'tickCrossings', 'clipped', 'emptyRows']:
                    assert not geometry[key], (key, geometry[key])
                assert geometry['bodyOverflow'] <= 1
                return {id: len(ticks) for id, ticks in actual.items()}

            page.select_option('#presetSelect', 'faber283n')
            page.click('#loadPresetButton')
            page.click('#bothSidesButton')
            settle()
            reference = state()
            assert reference['viewMode'] == 'both'
            for width in [390, 1100, 1800]:
                page.set_viewport_size({'width': width, 'height': 1200})
                for compact in [True, False]:
                    page.locator('#compactScaleToggle').set_checked(compact)
                    for choice in CHOICES:
                        page.select_option('#logGraduationsSelect', choice)
                        settle()
                        counts = validate_render()
                        data = state()
                        for key in ['cursor', 'slideOffset', 'sides', 'customScales']:
                            assert data[key] == reference[key], key
                        report['rendering'].append({'width': width, 'compact': compact, 'choice': choice, 'counts': counts})
                        print(width, compact, choice, counts, flush=True)
                        if width in (390, 1800) and compact:
                            page.locator('#ruleCanvas').screenshot(path=args.output / f'w-{width}-{choice}.png')
                        (args.output / 'results.json').write_text(json.dumps(report, indent=2) + '\n')
            report['functional'].append('Live menu applies all four choices to all four W rows without moving the instrument')

            page.set_viewport_size({'width': 1600, 'height': 1200})
            page.locator('#compactScaleToggle').check()
            for zoom in ['0.75', '1', '1.25', '1.5', '2']:
                page.select_option('#magnificationSelect', zoom)
                for choice in CHOICES:
                    page.select_option('#logGraduationsSelect', choice)
                    settle()
                    counts = validate_render()
                    report['rendering'].append({'zoom': zoom, 'choice': choice, 'counts': counts})
            report['functional'].append('Magnification re-plans adaptive W using displayed width; fixed lattices retain all strokes')

            page.select_option('#magnificationSelect', '1')
            page.select_option('#logGraduationsSelect', 'fine')
            settle()
            fixed = fingerprint()
            page.select_option('#graduationModeSelect', 'adaptive')
            settle()
            assert page.locator('#logGraduationsSelect').is_hidden()
            assert page.locator('#adaptiveSpacingSelect').is_visible()
            adaptive = fingerprint()
            assert fixed != adaptive
            page.select_option('#adaptiveSpacingSelect', 'clear')
            page.select_option('#graduationModeSelect', 'conventional')
            settle()
            assert page.locator('#logGraduationsSelect').input_value() == 'fine'
            assert fingerprint() == fixed
            assert page.locator('#adaptiveSpacingSelect').is_hidden()
            assert page.get_by_role('combobox', name='C/D and W subdivisions', exact=True).count() == 1
            page.locator('#graduationModeSelect').focus()
            page.keyboard.press('Tab')
            assert page.evaluate('document.activeElement.id') == 'logGraduationsSelect'
            report['functional'].append('Shared menu remains accessible and conditional; switching modes restores selected W pattern')

            page.evaluate('window.tickBeforeMotion = document.querySelector("#ruleCanvas [data-scale=W1] .tick")')
            page.locator('#ruleCanvas').focus()
            page.keyboard.press('ArrowRight')
            page.keyboard.press('Shift+ArrowRight')
            settle()
            assert page.evaluate('window.tickBeforeMotion === document.querySelector("#ruleCanvas [data-scale=W1] .tick")')
            assert fingerprint() == fixed
            report['functional'].append('Keyboard motion retains the selected W tick nodes')

            page.locator('#jsonEditor').fill('{unfinished draft')
            page.select_option('#logGraduationsSelect', 'pocket')
            settle()
            assert page.locator('#jsonEditor').input_value() == '{unfinished draft'
            with page.expect_download() as event:
                page.click('#exportJsonButton')
            saved = json.loads(Path(event.value.path()).read_text(encoding='utf-8'))
            assert saved['logGraduations'] == 'pocket' and saved['graduationMode'] == 'conventional'
            with page.expect_download() as event:
                page.click('#saveHtmlButton')
            exported = Path(event.value.path()).read_text(encoding='utf-8')
            copy = context.new_page()
            if args.mode == 'dom':
                copy.set_content(exported.replace('<head>', '<head><script>' + STORAGE_SHIM + '</script>', 1))
            else:
                temporary = ROOT / 'dist/.test-configured.html'
                try:
                    temporary.write_text(exported, encoding='utf-8')
                    copy.goto(f'http://127.0.0.1:{server.server_port}/.test-configured.html')
                finally:
                    temporary.unlink(missing_ok=True)
            copy.wait_for_function('document.documentElement.dataset.appReady === "true"')
            restored = copy.evaluate("async () => (await import('#main.js')).application.getProgram()")
            assert restored == saved
            copy.close()
            report['functional'].append('Draft preservation, JSON export and configured standalone retain the shared choice')

            page.click('#loupeButton')
            for choice in CHOICES:
                page.select_option('#logGraduationsSelect', choice)
                settle()
                row = page.locator('#ruleCanvas [data-scale="W1"]')
                row.scroll_into_view_if_needed()
                box = row.locator('.tick-pane').bounding_box()
                page.mouse.move(box['x'] + box['width'] * .4, box['y'] + box['height'] * .5)
                settle()
                assert page.locator('.rule-loupe').is_visible()
                assert page.locator('.rule-loupe [data-scale="W1"] .tick').count() == row.locator('.tick').count()
            page.keyboard.press('Escape')
            report['functional'].append('Direct-rendered loupe follows each selected W graduation plan')
            assert not report['errors'], report['errors']
            report['passed'] = True
            browser.close()
    except Exception:
        report['failure'] = traceback.format_exc()
        print(report['failure'], flush=True)
    finally:
        server.shutdown()
        server.server_close()
        (args.output / 'results.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    if not report.get('passed'):
        raise SystemExit(1)
    print('Passed:', len(report['functional']), 'functional;', len(report['rendering']), 'rendering', flush=True)


if __name__ == '__main__':
    main()
