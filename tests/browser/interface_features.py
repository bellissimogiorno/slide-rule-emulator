"""Page presentation and focus-preserving precision. No native-mode fallback.

Uses the enclosing runner's real page/keyboard/pointer and explicit storage
mode. Theme PNG comparisons intentionally include the instrument only, not its
surrounding (themed) page. Reports and screenshots stay outside release archives.
"""
import hashlib
import io
import json
from PIL import Image


def run_interface_features(get_page, state, apply, settle, check, load, download,
                           visual, output, report, geometry_source):
    load()
    original = state()
    shots = output / 'interface'
    if visual:
        shots.mkdir(parents=True, exist_ok=True)
    choices = ['0.005', '0.001', '0.0005', '0.0001']

    def close(a, b):
        assert abs(a - b) < 1e-12, (a, b)

    def step_button(value):
        return get_page().locator(f'#motionStep [data-step="{value}"]')

    def theme_button(theme):
        return get_page().locator(f'#pageThemes [data-page-theme="{theme}"]')

    def step_pointer_focus():
        for selector, field in [('#slideRange', 'slideOffset'), ('#cursorRange', 'cursor'),
                                ('#ruleCanvas', 'slideOffset'), ('#ruleViewport', 'cursor')]:
            apply({**original, 'cursor': .5, 'slideOffset': 0})
            p = get_page()
            p.locator(selector).focus()
            if selector.startswith('#rule'):
                p.keyboard.press('s' if field == 'slideOffset' else 'c')
            p.evaluate('''() => { window.motionBlurCount = 0;
                document.activeElement.addEventListener('blur', () => window.motionBlurCount++); }''')
            for step in choices:
                before = state()
                step_button(step).click(); settle()
                assert state() == before, 'changing precision moved a part'
                assert p.evaluate('document.activeElement.id') == selector[1:]
                assert p.evaluate('window.motionBlurCount') == 0, 'pointer activation lost focus'
                assert p.locator('#motionStep [aria-pressed="true"]').count() == 1
                assert step_button(step).get_attribute('aria-pressed') == 'true'
                p.keyboard.press('ArrowRight'); settle()
                close(state()[field], before[field] + float(step))
                other = 'cursor' if field == 'slideOffset' else 'slideOffset'
                close(state()[other], before[other])
    check('interface: all four step buttons preserve each motion focus stop without a blur', step_pointer_focus)

    def keyboard_steps():
        for selector, field in [('#slideRange', 'slideOffset'), ('#cursorRange', 'cursor')]:
            apply({**original, 'cursor': .5, 'slideOffset': 0})
            p = get_page(); p.locator(selector).focus()
            for key, choice in zip(['1', '2', '3', '4'], choices):
                before = state()
                p.keyboard.press(key); settle()
                assert state() == before
                assert p.evaluate('document.activeElement.id') == selector[1:]
                assert step_button(choice).get_attribute('aria-pressed') == 'true'
                p.keyboard.press('ArrowRight'); settle()
                close(state()[field], before[field] + float(choice))
            # Reach a step by Tab from the preceding button, then activate it.
            step_button('0.001').focus(); p.keyboard.press('Tab')
            assert p.evaluate('document.activeElement.dataset.step') == '0.0005'
            for key in ['Enter', 'Space']:
                step_button('0.0001').focus()
                before = state()
                p.keyboard.press(key); settle()
                assert p.evaluate('document.activeElement.id') == selector[1:]
                assert state() == before
                p.keyboard.press('ArrowRight'); settle()
                close(state()[field], before[field] + .0001)
        before = state()
        p.locator('#jsonEditor').fill('draft')
        p.keyboard.type('1234'); settle()
        assert state() == before
        assert p.locator('#jsonEditor').input_value() == 'draft1234'
        # Discard the deliberately unapplied draft before later test setup.
        load()
    check('interface: scoped 1-4 shortcuts and Tab/Enter/Space resume motion immediately', keyboard_steps)

    def faster_and_isolation():
        apply({**original, 'slideOffset': .898, 'cursor': .999})
        p = get_page()
        for selector, field, maximum in [('#slideRange', 'slideOffset', .9), ('#cursorRange', 'cursor', 1)]:
            p.locator(selector).focus(); p.keyboard.press('1'); p.keyboard.press('ArrowRight'); settle()
            close(state()[field], maximum)
            p.keyboard.press('Alt+ArrowLeft'); settle(); close(state()[field], maximum - .0005)
            p.keyboard.press('PageDown'); settle(); close(state()[field], maximum - .0505)
        # Step selection retains the actual focused control even after a preset render.
        p.locator('#presetSelect').select_option('pickettN3'); p.locator('#loadPresetButton').click(); settle()
        assert step_button('0.005').get_attribute('aria-pressed') == 'true'
        before = state()['cursor']; p.locator('#cursorRange').focus(); p.keyboard.press('ArrowRight'); settle()
        close(state()['cursor'], before + .005)
    check('interface: Faster uses exact fractions, respects limits and survives a preset change', faster_and_isolation)

    def independent_themes():
        p = get_page(); p.set_viewport_size({'width': 1800, 'height': 1100})
        for preset in ['faber283n', 'pickettN3', 'pickettN4', 'flyingFish1017']:
            p.locator('#presetSelect').select_option(preset)
            p.locator('#loadPresetButton').click()
            p.locator('#sideSelect').select_option(''); settle()
            before = state(); pixels = None
            p.evaluate('window.themeTick = document.querySelector(".tick")')
            for theme in ['light', 'dark', 'solarised']:
                theme_button(theme).click(); settle()
                assert state() == before
                assert p.evaluate('window.themeTick === document.querySelector(".tick")')
                assert p.locator('html').get_attribute('data-page-theme') == theme
                assert p.locator('#pageThemes [aria-pressed="true"]').count() == 1
                geometry = p.evaluate(geometry_source)
                failures = {k: v for k, v in geometry.items() if k in ['collisions', 'tickCrossings', 'clipped', 'smallLabels', 'emptyRows', 'bodyOverflow'] and v}
                shot = p.locator('#ruleCanvas').screenshot()
                # Element screenshots round fractional CSS bounds outwards; a
                # one-device-pixel fringe can belong to the surrounding page.
                # Compare decoded interior pixels, not PNG metadata or that fringe.
                image = Image.open(io.BytesIO(shot)).convert('RGBA')
                interior = image.crop((1, 1, image.width - 1, image.height - 1))
                digest = hashlib.sha256(interior.tobytes()).hexdigest()
                if pixels is None:
                    pixels = digest
                assert digest == pixels, (preset, theme, 'instrument pixels changed with page theme')
                report['rendering'].append({'preset': preset, 'pageTheme': theme, 'instrumentInteriorSHA256': digest, 'captureBorderExcluded': 1, 'passed': not failures, 'failures': failures})
                assert not failures, failures
    check('interface: page themes leave instrument pixels, geometry, nodes and programme unchanged', independent_themes)

    def preferences_and_exports():
        load(); p = get_page()
        key = 'slide-rule-page-theme-v1'
        theme_button('dark').click(); settle()
        assert p.evaluate('(key)=>localStorage.getItem(key)', key) == 'dark'
        before = state()
        assert 'pageTheme' not in before
        apply(before)
        assert p.locator('html').get_attribute('data-page-theme') == 'dark'
        saved = download('#saveHtmlButton')
        assert 'data-page-theme="dark"' in saved
        load(saved); p = get_page()
        assert p.locator('html').get_attribute('data-page-theme') == 'dark'
        assert state() == before
        theme_button('solarised').click(); settle()
        # Recreate the application against the same storage (not a native reload).
        p.evaluate('''async()=>{
            (await import('#main.js')).application.destroy();
            document.documentElement.dataset.pageTheme = 'light';
            window.preferenceProbe = (await import('#ui/application.js')).createApplication(document);
        }'''); settle()
        assert p.locator('html').get_attribute('data-page-theme') == 'solarised'
        p.evaluate('window.preferenceProbe.destroy()')
        theme_button('dark').click(); settle()
        assert p.locator('html').get_attribute('data-page-theme') == 'solarised', 'destroyed theme listener remains'
        load()
    check('interface: separate theme storage, standalone default and listener lifetime', preferences_and_exports)

    def responsive_themes():
        apply(original)
        p = get_page()
        for theme in ['light', 'dark', 'solarised']:
            theme_button(theme).click(); settle()
            for width in [320, 390, 480, 600, 601, 760, 1100, 1800, 3440]:
                p.set_viewport_size({'width': width, 'height': 1100}); settle()
                assert p.evaluate('document.documentElement.scrollWidth - innerWidth') <= 1
                overflow = p.locator('#motionStep button, #pageThemes button, .position-control, .header-actions button').evaluate_all('''els => els.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.outerHTML)''')
                assert not overflow, overflow
                button_bounds = p.locator('#motionStep button, #pageThemes button').evaluate_all('''els=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right,height:r.height}})''')
                assert all(r['x'] >= 0 and r['right'] <= width and r['height'] >= 32 for r in button_bounds), button_bounds
                if width >= 1800:
                    assert abs(p.locator('.motion-controls').bounding_box()['width'] - 1020) < .1
                    assert p.locator('#slideRange').bounding_box()['width'] >= 354
                report['rendering'].append({'pageTheme': theme, 'width': width, 'interfaceLayout': True, 'passed': True})
                if visual and width in [390, 1100, 1800]:
                    p.evaluate('window.scrollTo(0,0)'); settle()
                    p.screenshot(path=shots / f'{theme}_{width}.png')
            p.set_viewport_size({'width': 1800, 'height': 1100}); settle()
            if visual:
                p.locator('.side-panel').screenshot(path=shots / f'{theme}_editor.png')
        fonts = p.evaluate('''()=>Object.fromEntries(['.hint','.field','.readout-rail .rail-name','.library-item em','#jsonEditor'].map(s=>[s,parseFloat(getComputedStyle(document.querySelector(s)).fontSize)]))''')
        assert fonts == {'.hint': 13, '.field': 14, '.readout-rail .rail-name': 13, '.library-item em': 12, '#jsonEditor': 13}, fonts
        p.emulate_media(forced_colors='active')
        p.locator('#slideRange').focus(); step_button('0.0001').click(); p.keyboard.press('ArrowRight'); settle()
        close(state()['slideOffset'], original['slideOffset'] + .0001)
        if visual: p.locator('.toolbar').screenshot(path=shots / 'forced_colours.png')
        p.emulate_media(forced_colors='none')
    check('interface: enlarged text, 50%-wider controls and all themes at nine viewport widths', responsive_themes)
    load()
