"""Flying Fish and instrument-first responsive regressions.

Coordinates, not only a CSS breakpoint, verify that the editor never steals
rule width. Runs in the runner's explicitly selected native or DOM mode.
"""
import json
import math

LAYOUT = """() => {
    const box = el => {const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,bottom:r.bottom};};
    const work=document.querySelector('.workbench'), panel=document.querySelector('.side-panel');
    const view=document.querySelector('.rule-viewport');
    return {work:box(work),panel:box(panel),viewport:box(view),
        track:box(document.querySelector('.tick-pane')),
        editorColumns:getComputedStyle(panel).gridTemplateColumns,
        overflow:Math.max(0,document.documentElement.scrollWidth-innerWidth),
        canScrollRule:view.scrollWidth>view.clientWidth+1};
}"""


def run_workspace_features(get_page, state, apply, settle, check, load, download,
                           visual, output, report, geometry_source):
    original = state()
    original_viewport = get_page().viewport_size
    shots = output / 'workspace'
    if visual:
        shots.mkdir(parents=True, exist_ok=True)

    def select_fish():
        page = get_page()
        page.set_viewport_size({'width': 1800, 'height': 1200})
        page.locator('#presetSelect').select_option('flyingFish1017')
        page.locator('#loadPresetButton').click()
        page.locator('#sideSelect').select_option('')
        settle()
        assert state()['presetId'] == 'flyingFish1017'
        assert state()['theme'] == 'flying-fish'
        assert page.locator('.scale-row').count() == 25
        assert page.locator('.rule-face').count() == 2
        assert page.locator('[data-scale="FF_LNI_M2"]').count() == 1
        assert page.locator('[data-scale="FF_MZ_XZ"]').count() == 1
        assert page.locator('[data-scale="FF_T_COT"]').count() == 1
        assert page.locator('[data-scale="CI"]').count() == 1
        assert page.locator('[data-scale="CHEM_TK"]').count() == 0
    check('Flying Fish: real preset selection, separate face inventory and theme', select_fish)

    def numbers():
        data = state()
        # Independent mixture equation, using the photographed Mz/M row roles.
        data['slideOffset'] = math.log10(13.21 / 1.8) / 8
        data['cursor'] = (math.log10(.2 / .8) + 5) / 8
        apply(data)
        card = get_page().locator('.readout-card').filter(has=get_page().locator('.scale-id', has_text='M / X'))
        text = card.locator('.value').inner_text()
        actual = float(text.split(':', 1)[1])
        expected = (.2 / 132.1) / (.2 / 132.1 + .8 / 18)
        assert abs(actual - expected) < 1e-7, (actual, expected)
        data.update({'slideOffset': 0, 'cursor': math.log10(2)})
        apply(data)
        card = get_page().locator('.readout-card').filter(has=get_page().locator('.scale-id', has_text='Ln\u2081'))
        actual = float(card.locator('.value').inner_text())
        assert abs(actual - math.exp(2)) < 5e-6, (actual, math.exp(2))
        assert get_page().locator('.readout-side-heading').count() == 2
    check('Flying Fish: mixture and natural-exponential readouts on linked faces', numbers)

    def saved_copy():
        before = state()
        assert json.loads(download('#exportJsonButton')) == before
        load(download('#saveHtmlButton'))
        assert state() == before
        assert get_page().locator('.scale-row').count() == 25
    check('Flying Fish: JSON and configured standalone preserve the new preset', saved_copy)

    def layout():
        data = state()
        data.update({'slideOffset': 0, 'cursor': .5, 'magnification': 1})
        apply(data)
        measurements = []
        for width in [390, 760, 761, 1100, 1280, 1500, 1501, 1600, 1800, 1920, 2048, 2560, 3440]:
            get_page().set_viewport_size({'width': width, 'height': 1200})
            settle()
            dimensions = get_page().evaluate(LAYOUT)
            assert dimensions['panel']['y'] >= dimensions['work']['bottom'] + 8, dimensions
            assert dimensions['work']['width'] >= width - 60, dimensions
            assert abs(dimensions['panel']['width'] - dimensions['work']['width']) < 1, dimensions
            assert dimensions['viewport']['width'] >= width - (100 if width > 760 else 40), dimensions
            assert dimensions['overflow'] <= 1, dimensions
            if width >= 1100:
                assert not dimensions['canScrollRule'], dimensions
            if width == 390:
                assert dimensions['canScrollRule'], dimensions
            measurements.append({'width': width, **dimensions})
        # No width discontinuity at the former 1500px sidebar breakpoint.
        index = {case['width']: case for case in measurements}
        assert abs(index[1501]['track']['width'] - index[1500]['track']['width'] - 1) < 1
        (output / 'workspace-widths.json').write_text(json.dumps(measurements, indent=2) + '\n')
    check('workspace: full-width rule and editor below at 13 widths, including old breakpoint', layout)

    def jump_links_and_focus():
        page = get_page()
        page.set_viewport_size({'width': 1800, 'height': 1000}); settle()
        page.locator('a[href="#scaleLayout"]').click(); settle()
        heading = page.locator('#scaleLayout').bounding_box()
        assert 0 <= heading['y'] < 100, heading
        page.locator('a[href="#workbench"]').click(); settle()
        assert page.locator('#workbench').bounding_box()['y'] < 100
        before = page.evaluate(LAYOUT)['track']['width']
        page.locator('#focusButton').click(); settle()
        assert not page.locator('.side-panel').is_visible()
        assert not page.locator('a[href="#scaleLayout"]').is_visible()
        assert abs(page.evaluate(LAYOUT)['track']['width'] - before) < .5
        page.locator('#focusButton').click(); settle()
        assert page.locator('.side-panel').is_visible()
    check('workspace: jump links and Focus rule preserve scale width', jump_links_and_focus)

    if visual:
        # Extend the all-preset matrix with both-face and extreme-width cases.
        for width, zoom in [(390, 1), (1100, 1), (1500, 1), (1501, 1), (1600, 1),
                            (1800, 1), (1920, 1), (2560, 1), (3440, 1), (1100, 2), (1800, 2)]:
            get_page().set_viewport_size({'width': width, 'height': 1200})
            for compact in [False, True]:
                data = state()
                data.update({'magnification': zoom, 'compactScales': compact, 'cursor': .5, 'slideOffset': 0})
                apply(data)
                geometry = get_page().evaluate(geometry_source)
                failures = {k: v for k, v in geometry.items() if k in
                    ['collisions', 'tickCrossings', 'clipped', 'smallLabels', 'emptyRows', 'bodyOverflow'] and v}
                report['rendering'].append({'preset': 'flyingFish1017', 'view': 'both', 'width': width,
                    'zoom': zoom, 'compact': compact, 'passed': not failures, 'failures': failures})
                if failures:
                    print('WORKSPACE VISUAL FAILURE', width, zoom, compact, failures, flush=True)
                if zoom == 1 and width in (390, 1600, 1800, 2560):
                    suffix = 'compact' if compact else 'normal'
                    get_page().evaluate('window.scrollTo(0, 0)'); settle()
                    get_page().screenshot(path=shots / f'fish_both_{width}_{suffix}_page.png')
                    get_page().locator('#ruleViewport').screenshot(path=shots / f'fish_both_{width}_{suffix}_rule.png')
        # Inspect the ordinary desktop editor too, not just the instrument crop.
        get_page().set_viewport_size({'width': 1800, 'height': 1200})
        apply({**state(), 'magnification': 1, 'compactScales': True})
        get_page().locator('a[href="#scaleLayout"]').click(); settle()
        get_page().screenshot(path=shots / 'editor_below_1800.png')
    load()
    get_page().set_viewport_size(original_viewport)
    apply(original)
