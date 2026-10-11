"""Duplex-view and chemical-instrument regressions shared by native/DOM runs.

All changes go through public controls or the JSON import boundary. Mathematical
expected values in these tests do not use the emulator's inverse mappings.
"""
from pathlib import Path
import json
import math


def run_features(get_page, state, apply, settle, check, load, download,
                 visual, output, report, geometry_source):
    original = state()
    page = get_page()
    original_viewport = page.viewport_size
    page.set_viewport_size({'width': 1800, 'height': 1400})

    def preset(name='hemmi257'):
        p = get_page()
        p.locator('#presetSelect').select_option(name)
        p.locator('#loadPresetButton').click()
        settle()

    def linked():
        p = get_page()
        xs = p.locator('.cursor').evaluate_all('els=>els.map(e=>{const r=e.getBoundingClientRect();return r.x+r.width/2;})')
        assert len(xs) == 2 and abs(xs[0] - xs[1]) < 0.5, xs
        shifts = p.locator('.slide-mover').evaluate_all('els=>els.map(e=>e.style.transform)')
        assert shifts and len(set(shifts)) == 1
        assert p.locator('.readout-side-heading').count() == 2

    def select_both():
        preset()
        p = get_page()
        p.locator('#sideSelect').select_option('')
        settle()
        assert state()['viewMode'] == 'both'
        assert p.locator('.rule-face').count() == 2
        assert p.locator('.scale-row').count() == 23
        assert p.locator('#flipButton').is_disabled()
        assert p.locator('#editSideSelect').is_visible()
        assert p.evaluate('new Set([...document.querySelectorAll("[id]")].map(e=>e.id)).size===document.querySelectorAll("[id]").length')
        linked()
    check('both sides: selection, shared width, unique IDs and grouped readings', select_both)

    def second_face_motion():
        p = get_page()
        second = p.locator('.rule-face').nth(1)
        pane = second.locator('.slide-rail .tick-pane').first
        pane.scroll_into_view_if_needed()
        rect = pane.bounding_box()
        x, y = rect['x'] + rect['width'] * .35, rect['y'] + rect['height'] * .5
        p.evaluate('window.featureTick=document.querySelector(".tick")')
        before = state()['slideOffset']
        p.mouse.move(x, y); p.mouse.down(); p.mouse.move(x + 45, y, steps=5); p.mouse.up()
        settle()
        assert abs(state()['slideOffset'] - before - 45 / rect['width']) < 1e-5
        assert p.evaluate('window.featureTick === document.querySelector(".tick")')
        fixed = second.locator('.bottom-stator .tick-pane').first
        fixed.scroll_into_view_if_needed()
        r = fixed.bounding_box()
        p.mouse.click(r['x'] + r['width'] * .7, r['y'] + r['height'] * .5)
        settle()
        assert abs(state()['cursor'] - .7) < .001
        linked()
        p.locator('#ruleCanvas').focus(); p.keyboard.press('ArrowLeft'); settle()
        assert abs(state()['cursor'] - .699) < .001
        p.locator('#slideRange').evaluate("el=>{el.value='-12.5';el.dispatchEvent(new Event('input',{bubbles:true}));}")
        settle()
        assert state()['slideOffset'] == -.125
        linked()
    check('both sides: back-face dragging, stator click, keyboard and shared ranges', second_face_motion)

    def edit_selected_only():
        p = get_page()
        before = state()
        p.locator('#editSideSelect').select_option('back'); settle()
        p.locator('.scale-control-row[data-rail="topStator"] select').first.select_option('P')
        settle()
        now = state()
        assert now['sides']['front'] == before['sides']['front']
        assert now['sides']['back']['topStator'][0] == 'P'
        assert now['viewMode'] == 'both'
        assert p.locator('.rule-face').count() == 2
        preset()
        assert state()['viewMode'] == 'both', 'preset change lost the view mode'
        p.locator('#sideSelect').select_option('back'); settle()
        assert state()['viewMode'] == 'single'
        assert p.locator('.rule-face').count() == 1
        assert p.locator('#flipButton').is_enabled()
        assert not p.locator('#editSideSelect').is_visible()
        p.locator('#sideSelect').select_option(''); settle()
    check('both sides: independent layout editing and switching presets/single face', edit_selected_only)

    def worked_mixture():
        data = state()
        data['slideOffset'] = math.log10(13.21 / 1.8) / 8
        data['cursor'] = (math.log10(.2 / .8) + 5) / 8
        apply(data)
        text = get_page().locator('#readout').inner_text()
        expected = (.2 / 132.1) / (.2 / 132.1 + .8 / 18)
        # Cursor readout formatter uses six significant figures.
        assert f'{expected:.6g}' in text, (expected, text)
        linked()
    check('chemistry: ammonium-sulphate example through the actual both-face readout', worked_mixture)

    def reject_bad_composite():
        before = state()
        bad = {**before, 'customScales': [{'id': 'BAD', 'type': 'segmented', 'layers': ['C', 'D']}]}
        p = get_page()
        p.locator('#jsonEditor').fill(json.dumps(bad))
        p.locator('#applyJsonButton').click(); settle()
        assert state() == before
        assert 'overlap' in p.locator('#jsonStatus').inner_text()
        p.locator('#editSideSelect').select_option('back'); settle()
        assert json.loads(p.locator('#jsonEditor').input_value()) == bad
        apply(before)
    check('both sides: invalid segment import is atomic and preserves the JSON draft', reject_bad_composite)

    def exports():
        before = state()
        saved = json.loads(download('#exportJsonButton'))
        assert saved == before
        html = download('#saveHtmlButton')
        load(html)
        assert state() == before
        assert get_page().locator('.rule-face').count() == 2
        linked()
    check('both sides: JSON and configured standalone export/reinitialisation', exports)

    def custom_named_both():
        data = state()
        data.update({'activeSide': 'both', 'viewMode': 'single', 'sides': {
            'both': {'name': '<both>', 'topStator': ['D'], 'slide': [], 'bottomStator': []},
            'other': {'name': 'Other', 'topStator': [], 'slide': ['C'], 'bottomStator': []}}})
        apply(data)
        p = get_page()
        assert p.locator('#sideSelect').input_value() == 'both'
        assert p.locator('.rule-face').count() == 1
        p.locator('#sideSelect').select_option(''); settle()
        assert p.locator('.rule-face').count() == 2
        assert p.locator('both').count() == 0
        p.locator('#sideSelect').select_option('both'); settle()
        assert p.locator('.rule-face').count() == 1
    check('both sides: a custom face named both remains selectable and escaped', custom_named_both)

    if visual:
        shots = output / 'features'
        shots.mkdir(parents=True, exist_ok=True)
        presets = get_page().evaluate("async()=> (await import('#catalog/presets.js')).PRESETS")
        baseline = original
        for width in (1100, 1800):
            get_page().set_viewport_size({'width': width, 'height': 1400})
            for name, instrument in presets.items():
                for compact in (False, True):
                    data = {**baseline, **{k: v for k, v in instrument.items() if k in baseline},
                        'sides': instrument['sides'], 'activeSide': 'front', 'presetId': name,
                        'viewMode': 'both', 'compactScales': compact, 'slideOffset': 0, 'cursor': .5, 'magnification': 1}
                    apply(data)
                    linked()
                    geometry = get_page().evaluate(geometry_source)
                    failures = {k: v for k, v in geometry.items() if k in
                        ['collisions', 'tickCrossings', 'clipped', 'smallLabels', 'emptyRows', 'bodyOverflow'] and v}
                    report['rendering'].append({'preset': name, 'view': 'both', 'width': width, 'compact': compact,
                        'passed': not failures, 'failures': failures})
                    if width == 1800 and name in ('hemmi257', 'faber283n', 'pickettN3'):
                        get_page().locator('#ruleViewport').screenshot(path=shots / f'{name}_both_{"compact" if compact else "normal"}.png')
                    if failures: print('BOTH VISUAL FAILURE', name, width, compact, failures, flush=True)
            print('Finished both-face width', width, flush=True)
        for width, zoom in [(390, 1), (1100, 2), (1800, 2)]:
            get_page().set_viewport_size({'width': width, 'height': 1300})
            instrument = presets['hemmi257']
            data = {**baseline, **{k: v for k, v in instrument.items() if k in baseline}, 'presetId': 'hemmi257',
                'sides': instrument['sides'], 'activeSide': 'front', 'viewMode': 'both', 'magnification': zoom,
                'slideOffset': 0, 'cursor': .5, 'compactScales': True}
            apply(data); linked()
            geometry = get_page().evaluate(geometry_source)
            failures = {k: v for k, v in geometry.items() if k in
                ['collisions', 'tickCrossings', 'clipped', 'smallLabels', 'bodyOverflow'] and v}
            report['rendering'].append({'preset': 'hemmi257', 'view': 'both', 'width': width, 'zoom': zoom,
                'passed': not failures, 'failures': failures})
            # Applying JSON focuses controls below the rule; capture the instrument, not that scroll position.
            get_page().evaluate('window.scrollTo(0, 0)')
            settle()
            get_page().screenshot(path=shots / f'hemmi257_both_{width}_zoom{zoom}.png', full_page=width == 390)
    load()
    get_page().set_viewport_size(original_viewport)
    apply(original)
