"""Pickett root-bank integration; uses the runner's explicit native or DOM mode.

Sources: docs/PICKETT_ROOTS.md. Geometry checks inspect physical tick junctions,
not only class names; automated geometry is not a substitute for image review.
"""
import json
import math

ROOT_GEOMETRY = """() => {
    const banks = [], failures = [];
    for (const row of document.querySelectorAll('.root-stack')) {
        const id = row.dataset.scale;
        const track = row.querySelector('.tick-pane > .root-stack-track');
        const spine = track?.querySelector('.root-spine');
        const branches = [...(track?.querySelectorAll('.root-branch') || [])];
        const n = row.classList.contains('root-stack-3') ? 3 : 2;
        const fail = message => failures.push({id, message});
        if (!spine || track.querySelectorAll('.root-spine').length !== 1) fail('not exactly one shared spine');
        if (track?.querySelector('.baseline,.syncro-baseline')) fail('extra baseline');
        if (branches.length !== n) fail('missing branch');
        if (track?.querySelectorAll('.root-single').length !== n - 2) fail('incorrect upper-branch structure');
        if (!spine) continue;
        const y = spine.getBoundingClientRect().top, counts = [];
        for (const [index, branch] of branches.entries()) {
            if (+branch.dataset.rootBranch !== index) fail('wrong branch order');
            const ticks = [...branch.querySelectorAll('.tick')];
            const labels = [...branch.querySelectorAll('.tick-label')].filter(e => getComputedStyle(e).visibility !== 'hidden');
            counts.push({ticks: ticks.length, visibleLabels: labels.length});
            if (!ticks.length || labels.length < 3) fail('empty or unreadable branch');
            if (branch.closest('.root-single')) continue;
            const lower = branch.classList.contains('root-lower');
            for (const tick of ticks) {
                const r = tick.getBoundingClientRect();
                if (Math.abs((lower ? r.top : r.bottom) - y) > .6) {
                    fail('graduation does not meet the shared spine'); break;
                }
            }
            for (const label of labels) {
                const r = label.getBoundingClientRect();
                if (lower ? r.top < y - .6 : r.bottom > y + .6) {
                    fail('numeral crosses to the wrong side of the spine'); break;
                }
            }
        }
        banks.push({id, branches: n, counts, height: row.getBoundingClientRect().height});
    }
    return {banks, failures};
}"""


def run_pickett_roots(get_page, state, apply, settle, check, load, download,
                     visual, output, report, geometry_source):
    original, viewport = state(), get_page().viewport_size
    shots = output / 'pickett-roots'
    if visual:
        shots.mkdir(parents=True, exist_ok=True)

    def select(name='pickettN3', side='front'):
        page = get_page()
        page.set_viewport_size({'width': 1800, 'height': 1200})
        page.locator('#presetSelect').select_option(name)
        page.locator('#loadPresetButton').click()
        page.locator('#sideSelect').select_option(side)
        settle()

    def bank_geometry():
        result = get_page().evaluate(ROOT_GEOMETRY)
        assert len(result['banks']) == 2, result
        assert not result['failures'], result

    def selection():
        for name in ('pickettN3', 'pickettN4'):
            select(name)
            assert get_page().locator('.root-spine').count() == 2
            assert get_page().locator('.root-branch').count() == 5
            for compact in (False, True):
                get_page().locator('#compactScaleToggle').set_checked(compact)
                settle(); bank_geometry()
            get_page().locator('#sideSelect').select_option('back'); settle()
            assert get_page().locator('.root-stack').count() == 0
            assert get_page().locator('.syncro-scale').count() == 4
            get_page().locator('#sideSelect').select_option(''); settle()
            bank_geometry()
            assert get_page().locator('.rule-face').count() == 2
            assert get_page().locator('.syncro-scale').count() == 4
    check('Pickett roots: preset/face controls preserve five branches and shared spines', selection)

    def detector_control():
        get_page().locator('.root-spine').first.evaluate('el => el.after(el.cloneNode())')
        assert get_page().evaluate(ROOT_GEOMETRY)['failures'], 'duplicate spine was not detected'
        get_page().locator('.root-spine').first.evaluate('el => el.remove()')
        bank_geometry()
    check('Pickett roots: duplicate-spine detector negative control', detector_control)

    def numerical_readings():
        data = state()
        data.update({'slideOffset': 0, 'cursor': math.log10(6.4)})
        apply(data)
        page = get_page()
        card = page.locator('.readout-card').filter(has=page.locator('.scale-id', has_text='Cube roots'))
        values = card.locator('.value > span').all_inner_texts()
        assert len(values) == 3, values
        for text, radicand in zip(values, [6.4, 64, 640]):
            actual = float(text.split(':')[1])
            assert abs(actual - math.cbrt(radicand)) < 6e-6, values
        data['cursor'] = math.log10(4)
        apply(data)
        card = page.locator('.readout-card').filter(has=page.locator('.scale-id', has_text='Square roots'))
        values = card.locator('.value > span').all_inner_texts()
        assert float(values[0].split(':')[1]) == 2
        assert abs(float(values[1].split(':')[1]) - math.sqrt(40)) < 6e-6
        assert page.locator('.readout-side-heading').count() == 2
    check('Pickett roots: independent manual examples and complete linked-face readouts', numerical_readings)

    def moving_bank():
        data = state()
        data.update({'sides': {'front': {'topStator': ['D'], 'slide': ['PICKETT_CBRT'], 'bottomStator': ['PICKETT_SQRT']}},
                     'activeSide': 'front', 'viewMode': 'single', 'slideOffset': 0, 'cursor': .6})
        apply(data)
        page = get_page()
        row = page.locator('[data-scale="PICKETT_CBRT"]')
        assert row.locator('.slide-mover').count() == 1
        before = row.locator('.root-branch .tick').evaluate_all('els => els.map(e => e.getBoundingClientRect().x)')
        width = row.locator('.tick-pane').bounding_box()['width']
        page.evaluate('window.rootTickBefore = document.querySelector(".root-stack .tick")')
        page.locator('#slideRange').evaluate("el => {el.value='20';el.dispatchEvent(new Event('input',{bubbles:true}));}")
        settle()
        assert abs(state()['slideOffset'] - .2) < 1e-12
        after = row.locator('.root-branch .tick').evaluate_all('els => els.map(e => e.getBoundingClientRect().x)')
        assert len(before) == len(after)
        assert all(abs(b - a - .2 * width) < .2 for a, b in zip(before, after))
        assert page.evaluate('window.rootTickBefore === document.querySelector(".root-stack .tick")')
        assert not page.evaluate(ROOT_GEOMETRY)['failures']
        data = state(); data['slideOffset'] = .9
        apply(data)
        card = page.locator('.readout-card').filter(has=page.locator('.scale-id', has_text='Cube roots'))
        assert card.locator('.value').inner_text().count('off scale') == 3
    check('Pickett roots: branches and spine move together without regenerating ticks', moving_bank)

    def exports():
        select('pickettN3', '')
        data = state()
        assert json.loads(download('#exportJsonButton')) == data
        load(download('#saveHtmlButton'))
        assert state() == data
        bank_geometry()
        apply(data)
        assert get_page().locator('.root-branch').count() == 5
        assert get_page().locator('.syncro-scale').count() == 4
    check('Pickett roots: JSON and configured HTML preserve banks and linked views', exports)

    if visual:
        presets = get_page().evaluate("async()=> (await import('#catalog/presets.js')).PRESETS")
        baseline = state()
        cases = [(w, 1, 'pickett', theme) for w in (390, 1100, 1800)
                 for theme in ('pickett-es', 'pickett-white')]
        cases += [(1100, 2, 'pickett', theme) for theme in ('pickett-es', 'pickett-white')]
        cases += [(1800, 1.5, density, 'pickett-es') for density in ('blackbody', 'faber', 'classic', 'comfortable')]
        for name in ('pickettN3', 'pickettN4'):
            instrument = presets[name]
            for width, zoom, density, theme in cases:
                get_page().set_viewport_size({'width': width, 'height': 1300})
                for compact in (False, True):
                    data = {**baseline, **{k: v for k, v in instrument.items() if k in baseline},
                            'sides': instrument['sides'], 'activeSide': 'front', 'viewMode': 'both', 'presetId': name,
                            'theme': theme, 'density': density, 'magnification': zoom, 'compactScales': compact,
                            'slideOffset': 0, 'cursor': .5}
                    apply(data)
                    geometry = get_page().evaluate(geometry_source)
                    roots = get_page().evaluate(ROOT_GEOMETRY)
                    failures = {k: v for k, v in geometry.items() if k in
                                ['collisions', 'tickCrossings', 'clipped', 'smallLabels', 'emptyRows', 'bodyOverflow'] and v}
                    if roots['failures']:
                        failures['rootBanks'] = roots['failures']
                    if len(roots['banks']) != 2:
                        failures['rootBankCount'] = len(roots['banks'])
                    result = {'suite': 'pickett-roots', 'preset': name, 'view': 'both', 'width': width,
                              'zoom': zoom, 'density': density, 'theme': theme, 'compact': compact,
                              'roots': roots['banks'], 'passed': not failures, 'failures': failures}
                    report['rendering'].append(result)
                    suffix = f'{name}_{width}_{zoom}_{density}_{theme}_{"compact" if compact else "normal"}'
                    get_page().locator('#ruleViewport').screenshot(path=shots / f'{suffix}.png')
                    if failures:
                        print('ROOT VISUAL FAILURE', suffix, failures, flush=True)
            print('Finished Pickett root bank matrix', name, flush=True)
    load()
    get_page().set_viewport_size(viewport)
    apply(original)
