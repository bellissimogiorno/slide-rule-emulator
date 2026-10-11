#!/usr/bin/env python3
"""Native Chromium integration and optional complete rendering matrix.

Default: serve dist/ over real loopback HTTP; fail if navigation is unavailable.
Explicit --mode dom: use set_content in an opaque-origin document, with an
injected storage substitute ONLY for state/export scenarios. This is not a
native launch, browser-persistence or cross-browser test. Never silently fall back.
"""
from pathlib import Path
import argparse
import functools
import http.server
import importlib.metadata
import json
import os
import platform
import threading
import time
import traceback
from playwright.sync_api import sync_playwright
from features import run_features
from workspace_features import run_workspace_features
from pickett_roots import run_pickett_roots
ROOT = Path(__file__).resolve().parents[2]
GEOMETRY = Path(__file__).with_name('geometry.js').read_text(encoding='utf-8')
STORAGE_SHIM = "(() => { const values = new Map();\nObject.defineProperty(window, 'localStorage', { configurable: true, value: {\ngetItem: key => values.get(key) ?? null, setItem: (key,value) => values.set(key,String(value)),\nremoveItem: key => values.delete(key), clear: () => values.clear(),\nkey: i => [...values.keys()][i] ?? null, get length() { return values.size; }\n} }); })();"

class QuietHandler(http.server.SimpleHTTPRequestHandler):

    def log_message(self, *args):
        pass

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', choices=['native', 'dom'], default='native')
    parser.add_argument('--visual', action='store_true')
    parser.add_argument('--executable', default=os.environ.get('CHROMIUM_EXECUTABLE'))
    parser.add_argument('--output', type=Path, default=ROOT / 'qa')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    html = (ROOT / 'dist/index.html').read_text(encoding='utf-8')
    licence_notice = '<!--\n' + (ROOT / 'LICENSE').read_text(encoding='utf-8').rstrip() + '\n-->'
    report = {'mode': args.mode, 'python': platform.python_version(), 'platform': platform.platform(), 'playwright': importlib.metadata.version('playwright'), 'functional': [], 'rendering': [], 'errors': [], 'limitations': ['Opaque-origin DOM execution; native navigation and native persistence are NOT tested.'] if args.mode == 'dom' else []}
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT / 'dist')))
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    url = f'http://127.0.0.1:{server.server_port}/index.html'
    try:
        with sync_playwright() as p:
            options = {'args': ['--no-sandbox']}
            if args.executable:
                options['executable_path'] = args.executable
            browser = p.chromium.launch(**options)
            report['browser'] = browser.version
            report['browserExecutable'] = args.executable or 'Playwright-managed Chromium'
            context = browser.new_context(viewport={'width': 1600, 'height': 1000}, accept_downloads=True)
            page = context.new_page()
            page.on('pageerror', lambda error: report['errors'].append(str(error)))

            def load(text=html, storage=True):
                nonlocal page
                if not page.is_closed():
                    page.close()
                page = context.new_page()
                page.on('pageerror', lambda error: report['errors'].append(str(error)))
                if args.mode == 'dom':
                    content = text.replace('<head>', '<head><script>' + STORAGE_SHIM + '</script>', 1) if storage else text
                    page.set_content(content)
                elif text == html:
                    page.goto(url)
                else:
                    # Serve a configured export as a separate native navigation.
                    served = ROOT / 'dist/.test-configured.html'
                    served.write_text(text, encoding='utf-8', newline='\n')
                    try:
                        page.goto(url.rsplit('/', 1)[0] + '/.test-configured.html')
                    finally:
                        served.unlink(missing_ok=True)
                page.wait_for_function('document.documentElement.dataset.appReady === "true"')
                settle()

            def settle():
                page.evaluate('async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));}')

            def state():
                return page.evaluate("async()=> (await import('#main.js')).application.getProgram()")

            def apply(data):
                page.locator('#jsonEditor').fill(json.dumps(data))
                page.locator('#applyJsonButton').click()
                settle()
                assert page.locator('#jsonStatus').inner_text() == 'JSON applied.', page.locator('#jsonStatus').inner_text()

            def check(name, fn):
                start = time.monotonic()
                print("Checking:", name, flush=True)
                try:
                    fn()
                    report['functional'].append({'name': name, 'passed': True, 'seconds': round(time.monotonic() - start, 3)})
                    print('  passed', flush=True)
                except Exception as error:
                    report['functional'].append({'name': name, 'passed': False, 'error': str(error)})
                    # Capture before Playwright closes the page. A diagnostic
                    # failure must never replace the original test exception.
                    try:
                        page.screenshot(path=args.output / 'functional-failure.png', timeout=5000)
                        report['failureScreenshot'] = 'functional-failure.png'
                    except Exception as diagnostic_error:
                        report.setdefault('diagnosticErrors', []).append(str(diagnostic_error))
                    raise

            def download(selector):
                with page.expect_download() as event:
                    page.locator(selector).click()
                return Path(event.value.path()).read_text(encoding='utf-8')
            load()
            check('startup and catalogue', lambda: assert_equal(page.locator('.scale-row').count(), 15))

            def zero_and_motion():
                data = state()
                data['cursor'] = 0
                data['slideOffset'] = 0
                apply(data)
                assert state()['cursor'] == 0
                page.locator('#ruleCanvas').focus()
                page.keyboard.press('ArrowRight')
                settle()
                assert abs(state()['cursor'] - 0.002) < 1e-12
                page.keyboard.press('Shift+ArrowRight')
                settle()
                assert abs(state()['slideOffset'] - 0.002) < 1e-12
                page.evaluate("window.savedTick=document.querySelector('.tick')")
                page.locator('#cursorRange').evaluate("el=>{el.value='375';el.dispatchEvent(new Event('input',{bubbles:true}));}")
                settle()
                assert state()['cursor'] == 0.375
                assert page.evaluate("window.savedTick===document.querySelector('.tick')"), 'motion rebuilt graduations'
            check('zero, keyboard motion and retained graduation nodes', zero_and_motion)

            def pointer():
                data = state()
                data['slideOffset'] = 0
                data['cursor'] = 0.5
                apply(data)
                page.locator('#ruleCanvas').scroll_into_view_if_needed()
                pane = page.locator('.slide-rail .tick-pane').first.bounding_box()
                x = pane['x'] + pane['width'] * 0.3
                y = pane['y'] + pane['height'] * 0.5
                page.mouse.move(x, y)
                page.mouse.down()
                page.mouse.move(x + 60, y, steps=6)
                page.mouse.up()
                settle()
                assert state()['slideOffset'] > 0.02, 'slide did not move: ' + str(state()['slideOffset'])
                cursor = page.locator('#cursor').bounding_box()
                page.mouse.move(cursor['x'] + cursor['width'] / 2, cursor['y'] + cursor['height'] / 2)
                page.mouse.down()
                page.mouse.move(cursor['x'] + 60, cursor['y'] + cursor['height'] / 2, steps=6)
                page.mouse.up()
                settle()
                assert state()['cursor'] > 0.52, 'cursor did not move: ' + str(state()['cursor'])
            check('pointer slide and cursor dragging', pointer)

            def invalid_import():
                before = state()
                draft = json.dumps({**before, 'cursor': -2})
                page.locator('#jsonEditor').fill(draft)
                page.locator('#applyJsonButton').click()
                settle()
                assert state() == before
                assert page.locator('#jsonStatus.error').count() == 1
                assert page.locator('#jsonEditor').input_value() == draft
                page.locator('#flipButton').click()
                settle()
                assert page.locator('#jsonEditor').input_value() == draft, 'draft was overwritten'
                apply(before)
            check('invalid programme is atomic and drafts survive controls', invalid_import)

            def import_examples():
                for path in sorted((ROOT / 'examples').glob('*.json')):
                    page.locator('#importJsonFile').set_input_files(path)
                    settle()
                    page.wait_for_function("document.getElementById('jsonStatus').textContent==='JSON applied.'")
                    assert state()['sides'] == json.loads(path.read_text(encoding='utf-8'))['sides']
                assert page.locator('#importJsonButton').evaluate("el=>el.tagName==='BUTTON'"), 'import must be keyboard-accessible'
            check('real file imports and accessible import button', import_examples)

            def exports():
                data = state()
                data['cursor'] = 0.123456789012345
                data['modelLabel'] = 'safe </script><img src=x onerror=alert(1)>'
                apply(data)
                exported = json.loads(download('#exportJsonButton'))
                assert exported == state()
                first = download('#saveHtmlButton')
                assert licence_notice in first, 'configured export lost its MIT licence'
                assert '\\u003c/script>' in first
                load(first)
                assert state()['cursor'] == data['cursor']
                assert page.locator('img').count() == 0
                data = state()
                data['cursor'] = 0.87654321098765
                data['modelLabel'] = 'Second export'
                apply(data)
                second = download('#saveHtmlButton')
                assert licence_notice in second, 'repeated export lost its MIT licence'
                load(second)
                assert state()['cursor'] == data['cursor']
                assert state()['modelLabel'] == 'Second export'
                assert page.locator('#embedded-program').count() == 1
            check('JSON and repeated standalone exports preserve exact state and escape HTML', exports)

            def persistence():
                load()
                data = state()
                data['cursor'] = 0.2468
                apply(data)
                page.wait_for_timeout(240)
                if args.mode == 'native':
                    page.reload()
                    page.wait_for_function('document.documentElement.dataset.appReady === "true"')
                    settle()
                    assert state()['cursor'] == 0.2468
                else:
                    # Reinitialise a fresh document with substituted storage, not a native reload.
                    saved = page.evaluate('Object.fromEntries(Array.from({length:localStorage.length},(_,i)=>{const k=localStorage.key(i);return [k,localStorage.getItem(k)];}))')
                    seed = ''.join(('localStorage.setItem(' + json.dumps(k) + ',' + json.dumps(v) + ');' for k, v in saved.items()))
                    load(html.replace('<head>', '<head><script>' + STORAGE_SHIM + seed + '</script>', 1), storage=False)
                    assert state()['cursor'] == 0.2468
            check('persistence reload' if args.mode == 'native' else 'reinitialisation with storage substitute (NOT native persistence)', persistence)
            if args.mode == 'dom':

                def denied():
                    load(storage=False)
                    assert 'unavailable' in page.locator('#appStatus').inner_text()
                    assert page.locator('.scale-row').count() > 0
                check('denied storage retains usable instrument and warning', denied)

            def recovery():
                load()
                key = page.evaluate("async()=> (await import('#version.js')).STORAGE_KEY")
                page.evaluate('([key])=>localStorage.setItem(key,"corrupt-data")', [key])
                if args.mode == 'native':
                    page.reload()
                    page.wait_for_function('document.documentElement.dataset.appReady === "true"')
                    settle()
                else:
                    seed = 'localStorage.setItem(' + json.dumps(key) + ',"corrupt-data");'
                    load(html.replace('<head>', '<head><script>' + STORAGE_SHIM + seed + '</script>', 1), storage=False)
                assert page.locator('#recoveryButton').is_visible()
                assert download('#recoveryButton') == 'corrupt-data'
            check('corrupt saved programme remains downloadable', recovery)
            load()
            run_features(lambda: page, state, apply, settle, check, load, download,
                         args.visual, args.output, report, GEOMETRY)
            run_workspace_features(lambda: page, state, apply, settle, check, load, download,
                                   args.visual, args.output, report, GEOMETRY)
            run_pickett_roots(lambda: page, state, apply, settle, check, load, download,
                              args.visual, args.output, report, GEOMETRY)
            load()
            presets = page.evaluate("async()=> (await import('#catalog/presets.js')).PRESETS")
            baseline = state()

            def geometry_control():
                page.evaluate("() => {const el=[...document.querySelectorAll('.tick-label')].find(e=>getComputedStyle(e).visibility!=='hidden'&&!e.classList.contains('compact-split'));\n            if(!el)throw Error('no control label');const clone=el.cloneNode(true);clone.id='injected-overlap';el.parentNode.appendChild(clone);}")
                assert page.evaluate(GEOMETRY)['collisions'], 'detector failed deliberate overlap'
                page.locator('#injected-overlap').evaluate('el=>el.remove()')
            check('geometry detector negative control', geometry_control)
            if args.visual:
                shots = args.output / 'screenshots'
                shots.mkdir(exist_ok=True)
                for width in (1100, 1280, 1600, 2048):
                    page.set_viewport_size({'width': width, 'height': 1100})
                    for id, preset in presets.items():
                        for face in preset['sides']:
                            for compact in (False, True):
                                data = {**baseline, **{k: v for k, v in preset.items() if k in baseline}, 'sides': preset['sides'], 'activeSide': face, 'presetId': id, 'compactScales': compact, 'cursor': 0.5, 'slideOffset': 0, 'magnification': 1}
                                apply(data)
                                geometry = page.evaluate(GEOMETRY)
                                failures = {k: v for k, v in geometry.items() if k in ['collisions', 'tickCrossings', 'clipped', 'smallLabels', 'emptyRows', 'bodyOverflow'] and v}
                                case = {'preset': id, 'face': face, 'compact': compact, 'width': width, 'labels': geometry['labels'], 'ticks': geometry['ticks'], 'passed': not failures}
                                if failures:
                                    case['failures'] = failures
                                report['rendering'].append(case)
                                if width == 1600:
                                    name = f"{id}_{face}_{('compact' if compact else 'normal')}.png"
                                    page.locator('#ruleViewport').screenshot(path=shots / name)
                                if failures:
                                    print('VISUAL FAILURE', id, face, compact, width, failures, flush=True)
                    print('Finished rendering width', width, flush=True)
                # The instrument may scroll on a narrow screen; the page must not overflow.
                for width, zoom, density in [(390, 1, 'faber'), (1600, 1.25, 'faber'), (1600, 1.5, 'pickett'), (1600, 2, 'comfortable')]:
                    page.set_viewport_size({'width': width, 'height': 1000})
                    apply({**baseline, 'magnification': zoom, 'density': density, 'slideOffset': 0, 'cursor': 0.5})
                    geometry = page.evaluate(GEOMETRY)
                    failures = {k: v for k, v in geometry.items() if k in ['collisions', 'tickCrossings', 'clipped', 'smallLabels', 'bodyOverflow'] and v}
                    report['rendering'].append({'preset': baseline['presetId'], 'width': width, 'zoom': zoom, 'density': density, 'passed': not failures, 'failures': failures})
                    page.screenshot(path=shots / f'viewport_{width}_zoom_{zoom}.png', full_page=width == 390)

            def lifecycle():
                load()
                old = state()['cursor']
                page.evaluate("async()=> (await import('#main.js')).application.destroy()")
                page.locator('#ruleCanvas').focus()
                page.keyboard.press('ArrowRight')
                settle()
                assert state()['cursor'] == old
            check('application destroy removes event listeners', lifecycle)
            browser.close()
    except Exception as error:
        report['fatal'] = repr(error)
        report['traceback'] = traceback.format_exc()
    finally:
        server.shutdown()
        server.server_close()
        report['passed'] = not report.get('fatal') and (not report['errors']) and all((c['passed'] for c in report['functional'] + report['rendering']))
        (args.output / f'browser-{args.mode}.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8', newline='\n')
        print(json.dumps({k: v for k, v in report.items() if k not in ('functional', 'rendering')}, indent=2))
        print(len(report['functional']), 'functional groups;', len(report['rendering']), 'rendering cases')
    raise SystemExit(0 if report['passed'] else 1)

def assert_equal(a, b):
    assert a == b, (a, b)
if __name__ == '__main__':
    main()
