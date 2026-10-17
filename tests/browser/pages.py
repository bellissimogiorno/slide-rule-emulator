#!/usr/bin/env python3
"""Navigate real HTTP Pages entry points in Chromium, with no DOM-mode substitute.

Stage the committed root, docs and dist application separately, at both an
origin root and a project subpath. This checks the files a publisher receives;
it deliberately does not rebuild them or claim to execute GitHub's deployment.
"""
import argparse
import functools
import http.server
import importlib.metadata
import json
import os
from pathlib import Path
import platform
import shutil
import tempfile
import threading
import time
import traceback
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[2]
SITE_DIRECTORIES = ('.', 'docs', 'dist')
ENTRY_PATHS = ('/', '/index.html', '/slide-rule-emulator/',
               '/slide-rule-emulator/index.html')


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def check_entry(browser, url, html, output, label):
    """Use a fresh native origin/storage context, then verify an actual reload."""
    with browser.new_context(viewport={'width': 1600, 'height': 1000}) as context:
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        try:
            response = page.goto(url, timeout=15000)
            assert response is not None and response.status == 200, 'Homepage did not return HTTP 200'
            assert response.body() == html, 'Server did not return the committed emulator'
            page.wait_for_function('document.documentElement.dataset.appReady === "true"')
            assert page.locator('html').get_attribute('lang') == 'en-GB'
            assert page.locator('.scale-row').count() == 15
            expected_ids = page.evaluate("async()=>Object.keys((await import('#catalog/presets.js')).PRESETS)")
            menu_ids = page.locator('#presetSelect option:not([value="custom"])').evaluate_all(
                'options=>options.map(option=>option.value)')
            assert sorted(menu_ids) == sorted(expected_ids), 'Preset menu differs from the runtime catalogue'
            # A successful HTTP response is not enough: the instrument must work.
            page.locator('#sideSelect').select_option('')
            page.wait_for_function('document.querySelectorAll(".rule-face").length === 2')
            page.locator('#cursorRange').evaluate(
                "el=>{el.value='375';el.dispatchEvent(new Event('input',{bubbles:true}));}")
            # The application saves on a debounce, so wait for storage, not time.
            page.wait_for_function("""async()=>{
                const { STORAGE_KEY } = await import('#version.js');
                const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
                return saved && saved.cursor === 0.375 && saved.viewMode === 'both';
            }""")
            page.locator('#pageThemes [data-page-theme="dark"]').click()
            page.reload()
            page.wait_for_function('document.documentElement.dataset.appReady === "true"')
            saved = page.evaluate("async()=> (await import('#main.js')).application.getProgram()")
            assert page.locator('html').get_attribute('data-page-theme') == 'dark'
            assert saved['viewMode'] == 'both' and saved['cursor'] == 0.375
            assert page.locator('.rule-face').count() == 2
            assert not errors, errors
            if url.endswith('/slide-rule-emulator/'):
                page.evaluate('async()=>{await document.fonts.ready;}')
                page.screenshot(path=output / (label + '.png'))
        except Exception:
            try:
                page.screenshot(path=output / (label + '-failure.png'), timeout=5000)
            except Exception:
                pass  # Preserve the original failure rather than the diagnostic.
            raise


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--executable', default=os.environ.get('CHROMIUM_EXECUTABLE'))
    parser.add_argument('--output', type=Path, default=ROOT / 'qa/pages-native')
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    report = {'mode': 'native HTTP', 'python': platform.python_version(),
              'playwright': importlib.metadata.version('playwright'), 'cases': [],
              'limitations': ['Local HTTP tests do not execute a GitHub-hosted deployment.']}
    try:
        with sync_playwright() as p:
            options = {'args': ['--no-sandbox']}
            if args.executable:
                options['executable_path'] = args.executable
            browser = p.chromium.launch(**options)
            report['browser'] = browser.version
            report['browserExecutable'] = args.executable or 'Playwright-managed Chromium'
            try:
                for directory in SITE_DIRECTORIES:
                    source = ROOT / directory
                    html = (source / 'index.html').read_bytes()
                    assert (source / '.nojekyll').read_bytes() == b''
                    with tempfile.TemporaryDirectory(prefix='slide-rule-pages-') as staging:
                        for subpath in ('', 'slide-rule-emulator'):
                            target = Path(staging) / subpath
                            target.mkdir(exist_ok=True)
                            for name in ('index.html', '.nojekyll'):
                                shutil.copyfile(source / name, target / name)
                        handler = functools.partial(QuietHandler, directory=staging)
                        server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
                        thread = threading.Thread(target=server.serve_forever, daemon=True)
                        thread.start()
                        try:
                            for index, path in enumerate(ENTRY_PATHS):
                                case = {'directory': directory, 'path': path, 'passed': False}
                                report['cases'].append(case)
                                start = time.monotonic()
                                label = (directory if directory != '.' else 'root') + '-' + str(index)
                                print('Checking Pages:', directory, path, flush=True)
                                check_entry(browser, f'http://127.0.0.1:{server.server_port}' + path,
                                            html, args.output, label)
                                case.update(passed=True, seconds=round(time.monotonic() - start, 3))
                        finally:
                            server.shutdown()
                            server.server_close()
                            thread.join(timeout=5)
            finally:
                browser.close()
        print('Passed all', len(report['cases']), 'native Pages entry-point checks.')
    except Exception as error:
        report['error'] = str(error)
        report['traceback'] = traceback.format_exc()
        raise
    finally:
        (args.output / 'pages-native.json').write_text(
            json.dumps(report, indent=2) + '\n', encoding='utf-8', newline='\n')


if __name__ == '__main__':
    main()
