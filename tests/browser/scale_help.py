"""End-only scale explanations; preserve deliberate constant/element hover tips.

Native browser title bubbles are not page DOM. Test their real hit targets and
inherited title attributes, and separately test the application-owned mark popup.
"""
import math


def run_scale_help(get_page, state, apply, settle, check, load, download,
                   visual, output, report, geometry_source):
    load()
    original = state()
    presets = get_page().evaluate("async()=>(await import('#catalog/presets.js')).PRESETS")
    evidence = output / 'scale-help'
    evidence.mkdir(parents=True, exist_ok=True)

    def select(preset_id, compact=True, zoom=1):
        preset = presets[preset_id]
        data = {**original, **{k: v for k, v in preset.items() if k in original},
                'sides': preset['sides'], 'activeSide': 'front', 'viewMode': 'both',
                'presetId': preset_id, 'slideOffset': 0, 'cursor': .63,
                'magnification': zoom, 'compactScales': compact}
        apply(data)
        return get_page()

    def assert_scope():
        return get_page().evaluate('''() => {
            const canvas = document.getElementById('ruleCanvas');
            const rows = [...canvas.querySelectorAll('.scale-row')];
            const issues = [];
            for (const row of rows) {
                for (const selector of [':scope > .scale-name', ':scope > .scale-legend']) {
                    const el = row.querySelector(selector);
                    if (!el?.getAttribute('title')) issues.push(`${row.dataset.scale}: missing ${selector} help`);
                }
            }
            for (const el of canvas.querySelectorAll('[title]')) {
                if (!el.closest('.scale-name, .scale-legend') && !el.hasAttribute('data-mark-tip'))
                    issues.push(`Unexpected body title on ${el.className}`);
            }
            return {rows: rows.length, issues};
        }''')

    def hover_target(locator, fraction=.5):
        p = get_page()
        locator.scroll_into_view_if_needed()
        r = locator.bounding_box()
        x, y = r['x'] + fraction * r['width'], r['y'] + r['height'] / 2
        p.mouse.move(x, y)
        settle()
        return p.evaluate('''([x,y]) => {
            const target = document.elementFromPoint(x,y);
            const titled = target?.closest('[title]');
            return {title: titled?.getAttribute('title') || '',
                    inEnd: !!target?.closest('.scale-name, .scale-legend')};
        }''', [x, y])

    def all_presets():
        p = get_page(); p.set_viewport_size({'width': 1600, 'height': 1100})
        cases = []
        for preset_id in presets:
            for compact in (False, True):
                print(f'  scale-help: {preset_id}, compact={compact}', flush=True)
                select(preset_id, compact)
                result = assert_scope()
                assert not result['issues'], (preset_id, result)
                assert result['rows'] > 0
                cases.append({'preset': preset_id, 'compact': compact, **result})
        report['scaleHelpScopes'] = cases
    check('all preset faces restrict scale-wide titles to end labels, in both numbering modes', all_presets)

    def actual_end_and_body_targets():
        p = select('faber282n'); p.set_viewport_size({'width': 1600, 'height': 1100})
        for zoom in (1, 2):
            data = state(); data['magnification'] = zoom; apply(data)
            for scale in ('A', 'C', 'D', 'FC282_P'):
                row = p.locator(f'#ruleCanvas [data-scale="{scale}"]').first
                p.locator('#ruleCanvas').focus()
                before = state()
                for selector in (':scope > .scale-name', ':scope > .scale-legend'):
                    result = hover_target(row.locator(selector))
                    assert result['inEnd'] and result['title'], (scale, result)
                result = hover_target(row.locator('.tick-pane'), .71)
                assert not result['title'] and not result['inEnd'], (scale, result)
                assert not p.locator('#markTooltip').is_visible()
                assert state() == before
                assert p.evaluate('document.activeElement.id') == 'ruleCanvas'
            # The cursor has no generic native tooltip covering the working surface.
            pane = p.locator('#ruleCanvas [data-scale="D"] .tick-pane').first
            result = hover_target(pane, .63)
            assert not result['title']
    check('real end/body hover targets respect the boundary at 100% and 200% without moving or stealing focus', actual_end_and_body_targets)

    def chemical_and_mark_tips():
        p = select('flyingFish1017')
        row = p.locator('#ruleCanvas [data-scale="FF_P_KG"]')
        result = hover_target(row.locator('.scale-name'))
        assert 'Pressure conversion' in result['title']
        assert 'Pressure conversion' in hover_target(row.locator('.scale-legend'))['title']
        assert not hover_target(row.locator('.tick-pane'), .71)['title']
        # All ordinary segmented numeric marks stay quiet; intentionally annotated
        # elements and constants still have the original application-owned popup.
        assert p.locator('#ruleCanvas .segmented-scale [data-mark-tip]').count() == 0
        for selector, expected in [
            ('[data-scale="CHEM_CH_AM"] .tick[data-mark-tip^="C: 12.011"]', 'C: 12.011'),
            ('[data-scale="C"] .tick[data-mark-tip*="Euler"]', 'Euler')
        ]:
            hover_target(p.locator('#ruleCanvas ' + selector).first)
            p.locator('#markTooltip').wait_for(state='visible')
            assert expected in p.locator('#markTooltip').inner_text()
        data = state(); data['cursor'] = math.log10(math.pi); apply(data)
        p.locator('#ruleCanvas').focus()
        before = state()
        hover_target(p.locator('#ruleCanvas [data-scale="D"] .tick[data-mark-tip*="Pi,"]').first)
        p.locator('#markTooltip').wait_for(state='visible')
        assert '3.14159265359' in p.locator('#markTooltip').inner_text()
        assert state() == before
        p.keyboard.press('Escape'); settle()
        assert not p.locator('#markTooltip').is_visible()
    check('pressure end descriptions, element and constant tips remain correct, including through cursor glass', chemical_and_mark_tips)

    def movement_and_export():
        p = select('faber283n')
        row = p.locator('#ruleCanvas .slide-rail [data-scale="C"] .tick-pane').first
        row.scroll_into_view_if_needed()
        r = row.bounding_box(); before = state()['slideOffset']
        x, y = r['x'] + .35 * r['width'], r['y'] + r['height'] / 2
        p.mouse.move(x, y); p.mouse.down(); p.mouse.move(x + .1 * r['width'], y, steps=5)
        assert not p.locator('#markTooltip').is_visible()
        p.mouse.up(); settle()
        assert abs(state()['slideOffset'] - before - .1) < 1e-6
        before = state()['slideOffset']
        p.keyboard.press('ArrowRight'); settle()
        assert abs(state()['slideOffset'] - before - .001) < 1e-10
        assert not assert_scope()['issues']
        saved = download('#saveHtmlButton')
        load(saved)
        assert not assert_scope()['issues']
        assert abs(state()['slideOffset'] - before - .001) < 1e-10
    check('dragging, keyboard fine motion and configured exports preserve the end-only help policy', movement_and_export)

    if visual:
        for width, theme, zoom in [(1600, 'light', 1), (1100, 'solarised', 1), (390, 'dark', 2)]:
            p = select('flyingFish1017', zoom=zoom)
            p.set_viewport_size({'width': width, 'height': 1100}); settle()
            p.locator(f'#pageThemes [data-page-theme="{theme}"]').click(); settle()
            row = p.locator('#ruleCanvas [data-scale="FF_P_KG"]')
            for side in ('.scale-name', '.scale-legend'):
                result = hover_target(row.locator(side))
                assert result['inEnd'] and 'Pressure conversion' in result['title']
            assert not assert_scope()['issues']
            p.locator('.rule-viewport').screenshot(path=evidence / f'{theme}-{width}-zoom{zoom}.png')
            report.setdefault('scaleHelpResponsive', []).append({'width': width, 'theme': theme, 'zoom': zoom, 'passed': True})
    load()
