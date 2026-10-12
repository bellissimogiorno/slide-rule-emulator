"""Pickett 14 shared angle rows and context-specific mark explanations.

Runs through the existing runner in explicit native or DOM mode. No firing
examples: numerical checks are ordinary trigonometric identities and units.
"""
import math


def run_pickett14(get_page, state, apply, settle, check, load, download,
                 visual, output, report, geometry_source):
    load()
    original = state()
    shots = output / 'pickett14'
    shots.mkdir(parents=True, exist_ok=True)
    preset = get_page().evaluate("async()=>(await import('#catalog/presets.js')).PRESETS.pickett14")

    def select(face='front', compact=True):
        p = get_page()
        data = {**original, **{k: v for k, v in preset.items() if k in original},
                'sides': preset['sides'], 'presetId': 'pickett14',
                'activeSide': 'front' if face == 'both' else face,
                'viewMode': 'both' if face == 'both' else 'single',
                'compactScales': compact, 'cursor': .5, 'slideOffset': 0,
                'magnification': 1}
        apply(data)
        return p

    def hover(selector):
        p = get_page()
        mark = p.locator(selector).first
        mark.scroll_into_view_if_needed()
        r = mark.bounding_box()
        p.mouse.move(r['x'] + r['width'] / 2, r['y'] + r['height'] / 2)
        p.locator('#markTooltip').wait_for(state='visible')
        return p.locator('#markTooltip').inner_text()

    def preset_and_pairs():
        p = get_page()
        p.set_viewport_size({'width': 1600, 'height': 1100})
        p.locator('#presetSelect').select_option('pickett14')
        p.locator('#loadPresetButton').click(); settle()
        assert state()['presetId'] == 'pickett14'
        p.locator('#bothSidesButton').click(); settle()
        assert p.locator('.scale-row').count() == 22
        for id in ['P14_T', 'P14_S', 'P14_T_MIL', 'P14_S_MIL', 'P14_OPP_DEG', 'P14_OPP_MIL']:
            row = p.locator(f'.scale-row[data-scale="{id}"]')
            assert row.locator('.syncro-baseline').count() == 1
            assert row.locator('.syncro-tick').count() > 30
            assert row.locator('.tick').count() == 0
            assert row.locator('.syncro-number.negative').count() > 3
        for id in ['P14_OPP_DEG', 'P14_OPP_MIL']:
            fraction = p.locator(f'[data-scale="{id}"]').evaluate("e=>e.querySelector('.syncro-baseline').getBoundingClientRect().width/e.querySelector('.tick-pane').getBoundingClientRect().width")
            assert abs(fraction - math.log10(2)) < .001
            assert 'off scale' in p.locator(f'[data-readout-scale="{id}"]').inner_text()
    check('Pickett 14 loads both faces with single-tick angle pairs and genuinely short opposite rows', preset_and_pairs)

    def readings_and_motion():
        p = select('both')
        data = state(); data['cursor'] = math.log10(2 * math.sin(math.pi / 3)); apply(data)
        assert '60' in p.locator('[data-readout-scale="P14_OPP_DEG"]').inner_text()
        assert '120' in p.locator('[data-readout-scale="P14_OPP_DEG"]').inner_text()
        # Moving a row must move its one spine and both readings together.
        data = state(); data['sides']['back']['topStator'].remove('P14_OPP_DEG')
        data['sides']['back']['slide'].insert(0, 'P14_OPP_DEG'); apply(data)
        row = p.locator('[data-scale="P14_OPP_DEG"]')
        x = row.locator('.syncro-baseline').bounding_box()['x']
        width = row.locator('.tick-pane').bounding_box()['width']
        p.locator('#slideRange').focus(); p.keyboard.press('ArrowRight'); settle()
        assert abs(row.locator('.syncro-baseline').bounding_box()['x'] - x - .001 * width) < .05
        assert 'Red:' in p.locator('[data-readout-scale="P14_OPP_DEG"]').inner_text()
    check('Pickett angle readouts and both halves follow keyboard slide motion', readings_and_motion)

    def hover_and_focus():
        p = get_page(); p.set_viewport_size({'width': 1600, 'height': 1100})
        data = {**original, 'cursor': math.log10(math.sqrt(4 / math.pi)), 'slideOffset': 0,
                'viewMode': 'single', 'activeSide': 'front', 'magnification': 1,
                'sides': {'front': {'topStator': ['CF', 'CIF', 'CFM'], 'slide': ['C'], 'bottomStator': ['D']}}}
        apply(data); p.locator('#ruleCanvas').focus(); before = state()
        text = hover('[data-scale="D"] .tick[data-mark-tip*="Circle-diameter"]')
        assert '1.128379167096' in text and 'Not the speed of light' in text
        assert state() == before
        assert p.evaluate('document.activeElement.id') == 'ruleCanvas'
        assert 'Euler' in hover('[data-scale="D"] .tick[data-mark-tip*="Euler"]')
        assert '3.14159265359' in hover('[data-scale="D"] .tick[data-mark-tip*="Pi,"]')
        assert '10/pi' in hover('[data-scale="CIF"] .tick[data-mark-tip]')
        assert '1/M = ln(10)' in hover('[data-scale="CFM"] .tick[data-mark-tip]')
        p.keyboard.press('Escape'); settle()
        assert not p.locator('#markTooltip').is_visible()
        assert p.evaluate('document.activeElement.id') == 'ruleCanvas'
    check('constant tooltips show correct values through cursor glass without changing focus or coordinates', hover_and_focus)

    def custom_and_export():
        p = get_page()
        data = state(); data['customScales'] = [{'id': 'TIP', 'label': 'TIP', 'type': 'log', 'min': 1, 'max': 10,
            'gauges': [{'value': 2.5, 'label': 'x', 'title': '<img src=x onerror="window.tipExecuted=true"> custom mark = 2.5'}]}]
        data['sides']['front']['slide'] = ['TIP']; apply(data)
        assert '<img' in hover('[data-scale="TIP"] .tick[data-mark-tip]')
        assert p.locator('#markTooltip img').count() == 0
        assert p.evaluate('window.tipExecuted === undefined')
        exported = download('#saveHtmlButton')
        assert 'id="markTooltip"' not in exported
        load(exported); p = get_page()
        assert p.locator('#markTooltip').count() == 1
        assert 'custom mark = 2.5' in hover('[data-scale="TIP"] .tick[data-mark-tip]')
        p.evaluate("async()=>(await import('#main.js')).application.destroy()")
        assert p.locator('#markTooltip').count() == 0
        load()
    check('custom tooltip text is escaped, configured exports are clean, and teardown removes it', custom_and_export)

    def display_matrix():
        p = get_page()
        for width in [390, 1100, 1600, 2048]:
            p.set_viewport_size({'width': width, 'height': 1100})
            for face in ['front', 'back', 'both']:
                for compact in [False, True]:
                    select(face, compact)
                    for finish in ['pickett-es', 'pickett-white']:
                        p.locator('#themeSelect').select_option(finish); settle()
                        g = p.evaluate(geometry_source)
                        failures = {k: g[k] for k in ['collisions', 'tickCrossings', 'clipped', 'smallLabels', 'emptyRows', 'bodyOverflow'] if g[k]}
                        report['rendering'].append({'preset': 'pickett14', 'face': face, 'width': width,
                            'compact': compact, 'finish': finish, 'passed': not failures, 'failures': failures})
                        assert not failures, failures
                        if visual and face == 'both' and width in [390, 1600] and finish == 'pickett-es':
                            p.locator('#ruleCanvas').screenshot(path=shots/f'both_{width}_{"compact" if compact else "normal"}.png')
        select('both'); p.set_viewport_size({'width': 1600, 'height': 1100})
        p.locator('#magnificationSelect').select_option('2'); settle()
        g=p.evaluate(geometry_source)
        assert not any(g[k] for k in ['collisions','tickCrossings','clipped','smallLabels','bodyOverflow'])
        report['rendering'].append({'preset':'pickett14','magnification':2,'passed':True})
    check('Pickett 14: both finishes, all views, ordinary/compact, narrow/full-width and magnified geometry', display_matrix)

    def tooltip_themes():
        p = select('front')
        for width in [390, 1600]:
            p.set_viewport_size({'width':width,'height':1000})
            for theme in ['light', 'dark', 'solarised']:
                p.locator(f'#pageThemes [data-page-theme="{theme}"]').click(); settle()
                assert 'Euler' in hover('[data-scale="P14_D"] .tick[data-mark-tip*="Euler"]')
                box = p.locator('#markTooltip').bounding_box()
                assert 0 <= box['x'] and box['x'] + box['width'] <= width + .1
                assert 0 <= box['y'] and box['y'] + box['height'] <= 1000 + .1
                assert p.locator('#markTooltip').evaluate('e=>getComputedStyle(e).color') == p.locator('body').evaluate('e=>getComputedStyle(e).color')
                report['rendering'].append({'tooltip':True, 'width':width, 'theme':theme, 'passed':True})
                if visual: p.screenshot(path=shots/f'tooltip_{theme}_{width}.png')
        load()
    check('tooltips fit narrow screens and follow all three page themes', tooltip_themes)
