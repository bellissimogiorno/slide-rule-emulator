#!/usr/bin/env python3
"""Check the shared graduation-options slot in an actual built application.

Native HTTP loading is the default. Explicit DOM mode uses the existing storage
substitute and must not be reported as native navigation/persistence testing.
Run one width/theme per invocation to isolate browser resources and screenshots.
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


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', choices=['native', 'dom'], default='native')
    parser.add_argument('--executable')
    parser.add_argument('--width', type=int, default=1600)
    parser.add_argument('--theme', choices=['light', 'dark', 'solarised'], default='light')
    parser.add_argument('--output', type=Path, default=ROOT / 'qa/graduation-controls')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    stem = f'{args.width}-{args.theme}'
    report = {'mode': args.mode, 'width': args.width, 'theme': args.theme,
              'playwright': importlib.metadata.version('playwright'),
              'checks': [], 'errors': []}
    server = http.server.ThreadingHTTPServer(
        ('127.0.0.1', 0), functools.partial(QuietHandler, directory=str(ROOT / 'dist')))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(executable_path=args.executable, args=['--no-sandbox'])
            report['browser'] = browser.version
            context = browser.new_context(viewport={'width': args.width, 'height': 1200})
            page = context.new_page()
            page.set_default_timeout(12000)
            page.on('pageerror', lambda error: report['errors'].append(str(error)))
            if args.mode == 'dom':
                html = (ROOT / 'dist/index.html').read_text(encoding='utf-8')
                page.set_content(html.replace('<head>', '<head><script>' + STORAGE_SHIM + '</script>', 1))
            else:
                page.goto(f'http://127.0.0.1:{server.server_port}/index.html')
            page.wait_for_function('document.documentElement.dataset.appReady === "true"')
            page.locator(f'button[data-page-theme="{args.theme}"]').click()
            page.locator('#bothSidesButton').click()
            page.select_option('#logGraduationsSelect', 'pocket')
            grid = page.locator('.appearance-grid')
            slots = []

            def settle():
                page.evaluate('async () => { await document.fonts.ready; '
                              'await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); }')

            for mode, active, inactive in [
                ('adaptive', 'adaptiveSpacingSelect', 'logGraduationsSelect'),
                ('conventional', 'logGraduationsSelect', 'adaptiveSpacingSelect'),
            ]:
                page.select_option('#graduationModeSelect', mode)
                if mode == 'adaptive':
                    page.select_option('#adaptiveSpacingSelect', 'clear')
                settle()
                assert page.locator('#' + active).is_visible()
                assert page.locator('#' + active).is_enabled()
                assert page.locator('#' + inactive).is_hidden()
                assert page.locator('#' + inactive).is_disabled()
                assert page.locator('.graduation-options label:visible').count() == 1
                assert grid.locator('select:visible').count() == 4
                assert grid.locator('select:visible:disabled').count() == 0
                name = page.locator('#' + inactive).get_attribute('aria-label')
                assert page.get_by_role('combobox', name=name, exact=True).count() == 0

                page.locator('#graduationModeSelect').focus()
                page.keyboard.press('Tab')
                assert page.evaluate('document.activeElement.id') == active
                page.keyboard.press('Tab')
                assert page.evaluate('document.activeElement.id') == 'formulaToggle'
                page.keyboard.press('Shift+Tab')
                assert page.evaluate('document.activeElement.id') == active
                page.keyboard.press('Shift+Tab')
                assert page.evaluate('document.activeElement.id') == 'graduationModeSelect'

                programme = page.evaluate("async () => (await import('#main.js')).application.getProgram()")
                assert programme['logGraduations'] == 'pocket'
                assert programme['adaptiveSpacing'] == 'clear'
                assert programme['graduationMode'] == mode
                assert programme['viewMode'] == 'both'
                assert programme['cursor'] == .5 and programme['slideOffset'] == 0
                grid.scroll_into_view_if_needed()
                settle()
                box = grid.bounding_box()
                slot = page.locator('.graduation-options').bounding_box()
                slots.append([slot['x'] - box['x'], slot['y'] - box['y'], slot['width'], box['height']])
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 1')
                for selector in ['#graduationModeSelect', '#' + active]:
                    bounds = page.locator(selector).bounding_box()
                    assert bounds['width'] > 90 and bounds['height'] >= 24, bounds
                    assert bounds['x'] >= 0 and bounds['x'] + bounds['width'] <= args.width + 1, bounds
                grid.screenshot(path=args.output / f'{stem}-{mode}.png')
                report['checks'].append({'mode': mode, 'passed': True, 'gridHeight': box['height']})
                print(stem, mode, 'passed', flush=True)
            assert all(abs(a - b) < 1 for a, b in zip(*slots)), slots
            # Switching back must restore the remembered adaptive value.
            page.select_option('#graduationModeSelect', 'adaptive')
            assert page.locator('#adaptiveSpacingSelect').input_value() == 'clear'
            assert page.locator('#logGraduationsSelect').input_value() == 'pocket'
            assert not report['errors'], report['errors']
            report['passed'] = True
            browser.close()
    except Exception:
        report['failure'] = traceback.format_exc()
        print(report['failure'], flush=True)
    finally:
        server.shutdown()
        server.server_close()
        (args.output / f'{stem}.json').write_text(json.dumps(report, indent=2) + '\n', encoding='utf-8')
    if not report.get('passed'):
        raise SystemExit(1)


if __name__ == '__main__':
    main()
