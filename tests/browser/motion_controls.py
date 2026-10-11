"""Real keyboard/pointer tests using the parent runner's explicit browser mode.

Steps are fractions of scale length, not pixels. These checks exercise focus,
exact deltas, browser default cancellation, saving and both-face interaction.
"""
import json
import math


def run_motion_controls(get_page, state, apply, settle, check, load, download,
                        visual, output, report, geometry_source):
    load()
    original = state()
    shots = output / 'motion'
    if visual:
        shots.mkdir(parents=True, exist_ok=True)

    def close(actual, expected):
        assert abs(actual - expected) < 1e-12, (actual, expected)

    def reset(**changes):
        apply({**original, 'cursor': .5, 'slideOffset': 0, **changes})
        get_page().locator('#motionStep [data-step="0.001"]').click()
        settle()

    def focused_grips():
        for selector, field, other, start, lower, upper in [
            ('#slideRange', 'slideOffset', 'cursor', 0, -.9, .9),
            ('#cursorRange', 'cursor', 'slideOffset', .5, 0, 1),
        ]:
            reset()
            p = get_page()
            card = p.locator(f'.position-control[data-motion="{field}"]')
            card.locator('[data-nudge="-1"]').focus()
            p.keyboard.press('Tab')
            assert p.evaluate('document.activeElement.id') == selector[1:]
            other_before = state()[other]
            value = start
            for key, delta in [('ArrowRight', .001), ('ArrowLeft', -.001),
                               ('ArrowUp', .001), ('ArrowDown', -.001),
                               ('Shift+ArrowRight', .001), ('Alt+ArrowRight', .0001),
                               ('PageUp', .01), ('PageDown', -.01)]:
                p.keyboard.press(key); settle(); value += delta
                close(state()[field], value)
                close(state()[other], other_before)
            for key, expected in [('Home', lower), ('ArrowLeft', lower), ('End', upper), ('ArrowRight', upper)]:
                p.keyboard.press(key); settle(); close(state()[field], expected)
            assert 'scale lengths' in p.locator(selector).get_attribute('aria-valuetext')
            assert p.locator(selector).get_attribute('aria-describedby') == 'motionHelp'
    check('motion: Tab focuses either grip; arrows, modifiers, pages and limits act once', focused_grips)

    def fine_steps():
        reset(cursor=math.log10(3))
        p = get_page()
        p.evaluate('window.motionTick = document.querySelector(".tick")')
        for selector, field in [('#slideRange', 'slideOffset'), ('#cursorRange', 'cursor')]:
            for choice in ['0.005', '0.001', '0.0005', '0.0001']:
                p.locator(f'#motionStep [data-step="{choice}"]').click()
                p.locator(selector).focus()
                before = state()[field]
                text_id = '#slideText' if field == 'slideOffset' else '#cursorText'
                text_before = p.locator(text_id).inner_text()
                p.keyboard.press('ArrowRight'); settle()
                close(state()[field], before + float(choice))
                assert p.locator(text_id).inner_text() != text_before
                text_before = p.locator(text_id).inner_text()
                p.keyboard.press('Alt+ArrowRight'); settle()
                close(state()[field], before + float(choice) * 1.1)
                assert p.locator(text_id).inner_text() != text_before
            before = state()[field]
            p.keyboard.down('Alt')
            for _ in range(30):
                p.keyboard.press('ArrowRight')
            p.keyboard.up('Alt'); settle()
            close(state()[field], before + .0003)
        assert p.evaluate('window.motionTick === document.querySelector(".tick")'), 'nudge rebuilt graduations'
    check('motion: every fine step is visible and repeated keys retain off-grid precision', fine_steps)

    def pointer_grips_and_buttons():
        for selector, field in [('#slideRange', 'slideOffset'), ('#cursorRange', 'cursor')]:
            reset()
            p = get_page()
            p.locator(selector).scroll_into_view_if_needed()
            r = p.locator(selector).bounding_box()
            x, y = r['x'] + r['width'] / 2, r['y'] + r['height'] / 2
            before = state()[field]
            p.mouse.move(x, y); p.mouse.down(); p.mouse.move(x + 20, y, steps=5); p.mouse.up(); settle()
            assert state()[field] > before
            assert p.evaluate('document.activeElement.id') == selector[1:]
            before = state()[field]
            p.keyboard.press('Alt+ArrowLeft'); settle()
            close(state()[field], before - .0001)
            p.locator('#motionStep [data-step="0.0001"]').click()
            card = p.locator(f'.position-control[data-motion="{field}"]')
            for direction in [-1, 1]:
                before = state()[field]
                card.locator(f'[data-nudge="{direction}"]').click(); settle()
                close(state()[field], before + direction * .0001)
            before = state()[field]
            card.locator('[data-nudge="1"]').focus()
            p.keyboard.press('Enter'); settle()
            close(state()[field], before + .0001)
    check('motion: real grip drags take focus; pointer and keyboard nudge buttons agree', pointer_grips_and_buttons)

    def rule_selection():
        reset(viewMode='both')
        p = get_page()
        p.locator('#ruleCanvas').scroll_into_view_if_needed()
        rail = p.locator('.slide-rail .tick-pane').first.bounding_box()
        p.mouse.click(rail['x'] + .25 * rail['width'], rail['y'] + rail['height'] / 2)
        settle()
        close(state()['slideOffset'], 0)
        assert 'slide selected' in p.locator('#motionTarget').inner_text()
        p.keyboard.press('ArrowRight'); settle(); close(state()['slideOffset'], .001)
        p.keyboard.press('c'); p.keyboard.press('ArrowRight'); settle()
        close(state()['cursor'], .501)
        p.keyboard.press('s'); p.keyboard.press('ArrowRight'); settle()
        close(state()['slideOffset'], .002)
        p.keyboard.press('c'); p.locator('#ruleViewport').focus()
        p.keyboard.press('Alt+ArrowLeft'); settle(); close(state()['cursor'], .5009)
        p.keyboard.press('Shift+ArrowRight'); settle(); close(state()['slideOffset'], .003)
        positions = p.locator('.cursor').evaluate_all('els => els.map(el => el.style.left)')
        assert len(positions) == 2 and positions[0] == positions[1], positions
        glass = p.locator('.cursor').first.bounding_box()
        x, y = glass['x'] + glass['width'] / 2 + 10, glass['y'] + glass['height'] / 2
        before = state()['cursor']
        p.mouse.move(x, y); p.mouse.down(); settle(); close(state()['cursor'], before)
        p.mouse.move(x + 15, y, steps=3); p.mouse.up(); settle()
        assert state()['cursor'] > before
        p.keyboard.press('ArrowLeft'); settle()
        assert 'cursor selected' in p.locator('#motionTarget').inner_text()
    check('motion: direct dragging selects the part, both focus stops work, glass does not jump', rule_selection)

    def focus_button():
        reset()
        p = get_page()
        p.locator('#focusButton').click(); settle()
        assert p.evaluate('document.activeElement.id') == 'ruleCanvas'
        assert not p.locator('.side-panel').is_visible()
        p.keyboard.press('c'); p.keyboard.press('ArrowRight'); settle()
        close(state()['cursor'], .501)
        p.locator('#focusButton').click(); settle()
        assert p.locator('.side-panel').is_visible()
    check('motion: Focus rule transfers real keyboard focus, ready for arrow keys', focus_button)

    def isolation():
        reset()
        p = get_page()
        before = state()
        p.locator('#jsonEditor').fill('{"draft":"sc"}')
        for key in ['ArrowLeft', 'ArrowRight', 'Home', 'End', 's', 'c']:
            p.keyboard.press(key)
        settle()
        assert state() == before, 'editor shortcut moved the instrument'
        p.locator('#motionStep button').first.focus(); p.keyboard.press('ArrowDown'); settle()
        assert state() == before, 'precision selection moved the instrument'
        p.locator('#sideSelect').focus(); p.keyboard.press('ArrowDown'); settle()
        close(state()['slideOffset'], before['slideOffset']); close(state()['cursor'], before['cursor'])
        # Synthetic keys check cancellation/composition without invoking OS shortcuts.
        p.locator('#cursorRange').focus()
        result = p.evaluate('''() => ['isComposing','ctrlKey','metaKey'].map(flag => {
            const e = new KeyboardEvent('keydown', {key:'ArrowRight',bubbles:true,cancelable:true,[flag]:true});
            document.activeElement.dispatchEvent(e); return e.defaultPrevented;
        })''')
        assert result == [False, False, False]
        close(state()['cursor'], before['cursor'])
        load()
    check('motion: editing, select navigation, composition and system modifiers remain isolated', isolation)

    def zoom_and_export():
        reset()
        p = get_page()
        for zoom in ['1', '2']:
            p.locator('#magnificationSelect').select_option(zoom)
            p.locator('#motionStep [data-step="0.0001"]').click()
            p.locator('#cursorRange').focus()
            before = state()['cursor']
            p.keyboard.press('Alt+ArrowRight'); settle()
            close(state()['cursor'], before + .00001)
        before = state()
        assert json.loads(download('#exportJsonButton')) == before
        p.evaluate("window.dispatchEvent(new Event('pagehide'))")
        stored = p.evaluate("async()=> JSON.parse(localStorage.getItem((await import('#version.js')).STORAGE_KEY))")
        close(stored['cursor'], before['cursor'])
        load(download('#saveHtmlButton'))
        assert state() == before
        assert get_page().locator('#motionStep [aria-pressed="true"]').get_attribute('data-step') == '0.001'
        get_page().locator('#cursorRange').focus()
        get_page().keyboard.press('Alt+ArrowLeft'); settle()
        close(state()['cursor'], before['cursor'] - .0001)
    check('motion: magnification does not change steps; micro-positions persist and export', zoom_and_export)

    def responsive():
        reset()
        p = get_page()
        for width in [320, 390, 600, 601, 760, 1100, 1600, 2048, 3440]:
            p.set_viewport_size({'width': width, 'height': 1100}); settle()
            boxes = p.locator('.position-control').evaluate_all('els => els.map(el => {const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,right:r.right,bottom:r.bottom}})')
            slide, cursor = boxes
            assert slide['width'] > 160 and cursor['width'] > 160, boxes
            if width > 600:
                assert abs(slide['y'] - cursor['y']) < 1, boxes
                assert 4 <= cursor['x'] - slide['right'] <= 16, boxes
            else:
                assert abs(slide['x'] - cursor['x']) < 1, boxes
                assert 4 <= cursor['y'] - slide['bottom'] <= 12, boxes
            assert p.evaluate('document.documentElement.scrollWidth - innerWidth') <= 1
            assert p.locator('#slideRange').bounding_box()['height'] >= 36
            if visual and width in [390, 601, 1600]:
                p.evaluate('window.scrollTo(0,0)'); settle()
                p.screenshot(path=shots / f'controls_{width}.png')
        p.set_viewport_size({'width':1600,'height':1100}); settle()
        p.emulate_media(forced_colors='active')
        p.locator('#slideRange').focus(); settle()
        before = state()['slideOffset']
        p.keyboard.press('ArrowRight'); settle(); close(state()['slideOffset'], before + .001)
        if visual: p.locator('.toolbar').screenshot(path=shots / 'forced_colours.png')
        p.emulate_media(forced_colors='none')
    check('motion: neighbouring controls at nine widths, visible focus and forced-colour operation', responsive)

    if visual:
        for preset in ['faber283n', 'pickettN3', 'pickettN4', 'flyingFish1017']:
            p = get_page()
            p.locator('#presetSelect').select_option(preset)
            p.locator('#loadPresetButton').click()
            p.locator('#sideSelect').select_option('')
            settle()
            for field, selector in [('slideOffset', '#slideRange'), ('cursor', '#cursorRange')]:
                p.locator('#motionStep [data-step="0.0001"]').click()
                p.locator(selector).focus(); p.keyboard.press('ArrowRight'); settle()
                geometry = p.evaluate(geometry_source)
                failures = {k:v for k,v in geometry.items() if k in ['collisions','tickCrossings','clipped','smallLabels','emptyRows','bodyOverflow'] and v}
                report['rendering'].append({'preset':preset,'motionTarget':field,'passed':not failures,'failures':failures})
                assert not failures, failures
            p.evaluate('window.scrollTo(0,0)'); settle()
            p.screenshot(path=shots / f'{preset}_both.png')
    load()
