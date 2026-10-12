#!/usr/bin/env python3
"""Exercise UltraLog and both Graphoplex Neperlog presets in the real renderer.

Native HTTP navigation is the default. Explicit DOM mode uses an opaque origin
and a storage substitute; it is not a native-navigation or persistence test.
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
MODELS = ['ultralog', 'graphoplex690a', 'graphoplex691a']


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', choices=['native', 'dom'], default='native')
    parser.add_argument('--executable')
    parser.add_argument('--output', type=Path, default=ROOT / 'qa/ultralog-graphoplex')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    report = {'mode': args.mode, 'playwright': importlib.metadata.version('playwright'),
              'functional': [], 'rendering': [], 'errors': []}
    server = http.server.ThreadingHTTPServer(
        ('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT / 'dist')))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    page = None
    try:
        with sync_playwright() as pw:
            browser = pw.chromium.launch(executable_path=args.executable, args=['--no-sandbox'])
            report['browser'] = browser.version
            context = browser.new_context(viewport={'width': 1800, 'height': 1400}, accept_downloads=True)
            page = context.new_page()
            page.set_default_timeout(15000)
            page.on('pageerror', lambda error: report['errors'].append(str(error)))
            html = (ROOT / 'dist/index.html').read_text(encoding='utf-8')

            def load(target, text=html, route='index.html'):
                if args.mode == 'dom':
                    target.set_content(text.replace('<head>', '<head><script>' + STORAGE_SHIM + '</script>', 1))
                else:
                    target.goto(f'http://127.0.0.1:{server.server_port}/{route}')
                target.wait_for_function('document.documentElement.dataset.appReady === "true"')

            def settle():
                page.evaluate('async () => { await document.fonts.ready; '
                              'await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }')

            def state(target=None):
                return (target or page).evaluate("async () => (await import('#main.js')).application.getProgram()")

            def apply(data):
                page.locator('#jsonEditor').fill(json.dumps(data))
                page.click('#applyJsonButton')
                settle()
                assert state()['sides'] == data['sides']

            def select(model):
                page.select_option('#presetSelect', model)
                page.click('#loadPresetButton')
                if page.locator('#bothSidesButton').get_attribute('aria-pressed') != 'true':
                    page.click('#bothSidesButton')
                settle()
                assert state()['presetId'] == model and state()['viewMode'] == 'both'

            def check_render(model, **settings):
                settle()
                geo = page.evaluate(GEOMETRY)
                for key in ['collisions', 'tickCrossings', 'clipped', 'emptyRows']:
                    assert not geo[key], (model, settings, key, geo[key][:8])
                assert geo['bodyOverflow'] <= 1, (model, settings, geo['bodyOverflow'])
                expected = 40 if model == 'ultralog' else 26
                assert page.locator('#ruleCanvas .scale-row').count() == expected
                assert page.locator('#ruleCanvas .readout-card').count() == 0
                titles = page.locator('#ruleCanvas .scale-row[title]').count()
                assert titles == 0, 'Scale explanations must not cover the working area'
                print(model, settings, 'OK', flush=True)
                report['rendering'].append({'model': model, **settings,
                    'rows': geo['rows'], 'ticks': geo['ticks'], 'labels': geo['labels']})
                (args.output / 'results.json').write_text(json.dumps(report, indent=2) + '\n')

            load(page)
            for model in MODELS:
                select(model)
                original = state()
                for width in [390, 1100, 1800]:
                    page.set_viewport_size({'width': width, 'height': 1400})
                    for mode in ['conventional', 'adaptive']:
                        page.select_option('#graduationModeSelect', mode)
                        for compact in [True, False]:
                            page.locator('#compactScaleToggle').set_checked(compact)
                            check_render(model, width=width, mode=mode, compact=compact, zoom=1)
                            if width in [390, 1800]:
                                page.locator('#ruleCanvas').screenshot(path=args.output / f'{model}_{width}_{mode}_{compact}.png')
                    assert state()['cursor'] == original['cursor']
                    assert state()['slideOffset'] == original['slideOffset']
                    assert state()['sides'] == original['sides']
                report['functional'].append(f'{model}: live preset, both faces and graduation/packing changes preserve coordinates and layout')

                page.set_viewport_size({'width': 1600, 'height': 1400})
                page.locator('#compactScaleToggle').check()
                for mode in ['conventional', 'adaptive']:
                    page.select_option('#graduationModeSelect', mode)
                    for zoom in ['0.75', '1', '1.25', '1.5', '2']:
                        page.select_option('#magnificationSelect', zoom)
                        check_render(model, width=1600, mode=mode, compact=True, zoom=float(zoom))
                page.select_option('#magnificationSelect', '1')
                page.select_option('#graduationModeSelect', 'conventional')
                for theme in ['light', 'dark', 'solarised']:
                    page.locator(f'#pageThemes [data-page-theme="{theme}"]').click()
                    page.set_viewport_size({'width': 390, 'height': 1000})
                    check_render(model, width=390, mode='conventional', compact=True, zoom=1, theme=theme)
                page.set_viewport_size({'width': 1800, 'height': 1400})
                page.locator('#pageThemes [data-page-theme="light"]').click()

                # Real keys move the common cursor and slide while both faces remain linked.
                page.locator('#cursorRange').focus()
                before = state()
                page.keyboard.press('2')
                page.keyboard.press('ArrowRight')
                assert abs(state()['cursor'] - before['cursor'] - .001) < 1e-12
                page.locator('#slideRange').focus()
                before = state()
                page.keyboard.press('ArrowRight')
                assert abs(state()['slideOffset'] - before['slideOffset'] - .001) < 1e-12
                report['functional'].append(f'{model}: actual arrow keys move the shared slide/cursor coordinates')

                # Numerical end-to-end check against independently chosen values.
                data = state()
                data.update(cursor=.5, slideOffset=0)
                if model != 'ultralog':
                    import math
                    data['cursor'] = math.log10(10 * math.sin(math.radians(35.5)))
                apply(data)
                if model == 'graphoplex690a':
                    values = page.locator('[data-readout-scale="GP690_S"] .value').inner_text()
                    assert '35\u00b030\u2032' in values and '54\u00b030\u2032' in values, values
                elif model == 'graphoplex691a':
                    values = page.locator('[data-readout-scale="GP691_S"] .value').inner_text()
                    assert '35.5' in values and '54.5' in values, values
                else:
                    assert 'undefined' not in page.locator('[data-readout-scale="UL_CONST"]').inner_text()
                    assert page.locator('#ruleCanvas .scale-row[data-scale="UL_CONST"] .tick').count() == 8
                report['functional'].append(f'{model}: digital reading uses the correct angular notation or named constant inventory')

                # The real download path embeds all new definitions and session state.
                with page.expect_download() as event:
                    page.click('#exportJsonButton')
                exported = json.loads(Path(event.value.path()).read_text(encoding='utf-8'))
                assert exported == state()
                with page.expect_download() as event:
                    page.click('#saveHtmlButton')
                standalone = Path(event.value.path()).read_text(encoding='utf-8')
                copy = context.new_page()
                temporary = ROOT / 'dist/.test-configured.html'
                try:
                    if args.mode == 'native':
                        temporary.write_text(standalone, encoding='utf-8')
                    load(copy, standalone, '.test-configured.html')
                    assert state(copy) == exported
                    assert copy.locator('#ruleCanvas .scale-row').count() == (40 if model == 'ultralog' else 26)
                finally:
                    copy.close()
                    temporary.unlink(missing_ok=True)
                report['functional'].append(f'{model}: JSON and configured HTML round trips reproduce the complete programme')

                # Separate enlarged glyphs must retain the same graduations/labels.
                scale = {'ultralog': 'UL_SH1', 'graphoplex690a': 'GP690_ST', 'graphoplex691a': 'GP_CH'}[model]
                row = page.locator(f'#ruleCanvas .scale-row[data-scale="{scale}"]')
                row.scroll_into_view_if_needed()
                if page.locator('#loupeButton').get_attribute('aria-pressed') != 'true':
                    page.click('#loupeButton')
                row.scroll_into_view_if_needed()
                box = row.locator('.tick-pane').bounding_box()
                page.mouse.move(box['x'] + box['width'] * .32, box['y'] + box['height'] * .5)
                settle()
                assert page.locator('.rule-loupe').is_visible()
                assert page.locator(f'.rule-loupe [data-scale="{scale}"] .tick').count() == row.locator('.tick').count()
                page.locator('.rule-loupe').screenshot(path=args.output / f'{model}_loupe.png')
                page.keyboard.press('Escape')
                report['functional'].append(f'{model}: direct-rendered loupe retains the mathematical tick set')
                print(model, 'complete', len(report['rendering']), flush=True)

            assert not report['errors'], report['errors']
            report['passed'] = True
            browser.close()
    except Exception:
        report['failure'] = traceback.format_exc()
        print(report['failure'], flush=True)
        try:
            if page is not None and not page.is_closed():
                page.screenshot(path=args.output / 'failure.png')
        except Exception:
            pass
    finally:
        server.shutdown()
        server.server_close()
        (args.output / 'results.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    if not report.get('passed'):
        raise SystemExit(1)
    print('Passed:', len(report['functional']), 'functional;', len(report['rendering']), 'rendering', flush=True)


if __name__ == '__main__':
    main()
