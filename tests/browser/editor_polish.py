"""Header shortcuts, joined editor controls, session undo and idle loupe tests.

Uses the public programme editor and actual pointer/keyboard input. Sleep-based
checks cover real opacity transitions; exact timing is separately unit tested.
"""
import copy


def run_editor_polish(get_page, state, apply, settle, check, load, download,
                      visual, output, report, geometry_source):
    load()
    original = state()
    shots = output / 'editor-polish'
    shots.mkdir(parents=True, exist_ok=True)

    def simple():
        p = get_page()
        p.set_viewport_size({'width': 1600, 'height': 1100})
        apply({**original, 'activeSide': 'front', 'viewMode': 'single',
               'cursor': .5, 'slideOffset': 0, 'sides': {
                   'front': {'name': 'Front', 'topStator': ['A', 'D'], 'slide': ['C'], 'bottomStator': ['D', 'K']},
                   'back': {'name': 'Back', 'topStator': ['K'], 'slide': ['C'], 'bottomStator': ['D']}}})
        settle()
        return p

    def rail(name):
        return get_page().locator(f'.rail-row-list[data-rail="{name}"]')

    def undo():
        get_page().locator('[data-action="undo"]').first.click()
        settle()

    def both_shortcut():
        p = simple()
        assert p.locator('#flipButton').evaluate('e=>e.nextElementSibling.id') == 'bothSidesButton'
        p.locator('#sideSelect').select_option('back'); settle()
        before = state()
        p.locator('#bothSidesButton').click(); settle()
        assert state()['viewMode'] == 'both' and state()['activeSide'] == 'back'
        assert p.locator('#bothSidesButton').get_attribute('aria-pressed') == 'true'
        assert p.locator('#sideSelect').input_value() == ''
        assert p.locator('.rule-face').count() == 2 and p.locator('#flipButton').is_disabled()
        p.locator('#editSideSelect').select_option('front')
        p.locator('#bothSidesButton').click(); settle()
        assert state()['activeSide'] == 'front' and state()['viewMode'] == 'single'
        assert p.locator('#bothSidesButton').get_attribute('aria-pressed') == 'false'
        assert p.locator('.rule-face').count() == 1 and p.locator('#flipButton').is_enabled()
        assert state()['cursor'] == before['cursor'] and state()['slideOffset'] == before['slideOffset']
        p.locator('#sideSelect').select_option(''); settle()
        assert p.locator('#bothSidesButton').get_attribute('aria-pressed') == 'true'
        p.locator('#bothSidesButton').focus(); p.keyboard.press('Space'); settle()
        assert state()['viewMode'] == 'single'
        p.keyboard.press('Enter'); settle(); assert state()['viewMode'] == 'both'
        saved = download('#saveHtmlButton'); load(saved)
        assert state()['viewMode'] == 'both'
        assert get_page().locator('#bothSidesButton').get_attribute('aria-pressed') == 'true'
        one = copy.deepcopy(original); one['sides'] = {'front': one['sides']['front']}; one['activeSide'] = 'front'; one['viewMode'] = 'single'
        apply(one); assert get_page().locator('#bothSidesButton').is_disabled()
        load()
    check('header: Both sides toggles the linked view, stays in sync and survives export', both_shortcut)

    def boundary_arrows():
        p = simple(); before = state()['sides']['front']
        rail('topStator').locator('[data-action="down"]').last.click(); settle()
        assert state()['sides']['front']['topStator'] == ['A']
        assert state()['sides']['front']['slide'] == ['D', 'C']
        assert p.evaluate('document.activeElement.closest(".scale-control-row").dataset.rail') == 'slide'
        rail('slide').locator('[data-action="up"]').first.click(); settle()
        assert state()['sides']['front'] == before
        rail('slide').locator('[data-action="down"]').last.click(); settle()
        assert state()['sides']['front']['bottomStator'] == ['C', 'D', 'K']
        rail('bottomStator').locator('.scale-grip').first.focus(); p.keyboard.press('ArrowUp'); settle()
        assert state()['sides']['front'] == before
        assert rail('topStator').locator('[data-action="up"]').first.is_disabled()
        assert rail('bottomStator').locator('[data-action="down"]').last.is_disabled()
        data = state(); data['sides']['front'] = {'name': 'Front', 'topStator': ['A'], 'slide': [], 'bottomStator': []}
        apply(data)
        rail('topStator').locator('[data-action="down"]').last.click(); settle()
        assert state()['sides']['front']['slide'] == ['A']
        rail('slide').locator('[data-action="down"]').last.click(); settle()
        assert state()['sides']['front']['bottomStator'] == ['A']
        rail('bottomStator').locator('[data-action="up"]').first.click(); settle()
        assert state()['sides']['front']['slide'] == ['A']
        data = state(); data['sides']['front']['topStator'] = ['D']; data['sides']['front']['slide'] = ['C'] * 40
        apply(data)
        assert rail('topStator').locator('[data-action="down"]').last.is_disabled()
        assert '40 scales' in rail('topStator').locator('[data-action="down"]').last.get_attribute('title')
        assert all(p.locator('[data-action="undo"]').nth(i).is_disabled() for i in range(3))
    check('editor: arrows cross both rail boundaries, enter empty rails and respect capacity', boundary_arrows)

    def undo_sequence():
        p = simple(); versions = [state()]
        rail('topStator').locator('select').first.select_option('B'); settle(); versions.append(state())
        rail('topStator').locator('[data-action="remove"]').last.click(); settle(); versions.append(state())
        p.locator('[data-action="add"][data-rail="slide"]').click(); settle(); versions.append(state())
        rail('topStator').locator('[data-action="down"]').first.click(); settle()
        for expected in reversed(versions):
            assert all(p.locator('[data-action="undo"]').nth(i).is_enabled() for i in range(3))
            undo(); assert state() == expected
        assert all(p.locator('[data-action="undo"]').nth(i).is_disabled() for i in range(3))
        assert not p.evaluate('document.activeElement.disabled'), 'last undo stranded focus'
        # Native pointer drag is also one undo transaction.
        grip = rail('topStator').locator('.scale-grip').first
        grip.scroll_into_view_if_needed(); a = grip.bounding_box(); b = rail('slide').bounding_box()
        p.mouse.move(a['x'] + a['width']/2, a['y'] + a['height']/2); p.mouse.down()
        p.mouse.move(b['x'] + 40, b['y'] + b['height']*.8, steps=8); p.mouse.up(); settle()
        assert state()['sides'] != versions[0]['sides']; undo(); assert state() == versions[0]
    check('undo: shared history reverses replacements, removals, additions, arrows and drags in order', undo_sequence)

    def undo_safety():
        p = simple(); before = state()
        rail('slide').locator('[data-action="remove"]').first.click(); settle()
        p.wait_for_timeout(4500)
        assert p.locator('[data-action="undo"]').first.is_enabled()
        p.locator('#cursorRange').evaluate("e=>{e.value='625';e.dispatchEvent(new Event('input',{bubbles:true}))}")
        p.locator('#slideRange').evaluate("e=>{e.value='15';e.dispatchEvent(new Event('input',{bubbles:true}))}")
        p.locator('#bothSidesButton').click(); p.locator('#editSideSelect').select_option('back')
        p.locator('#pageThemes [data-page-theme="dark"]').click()
        p.locator('#jsonEditor').fill('an unapplied draft')
        undo()
        assert state()['sides'] == before['sides'] and state()['activeSide'] == 'front'
        assert state()['viewMode'] == 'both' and state()['cursor'] == .625 and state()['slideOffset'] == .15
        assert p.locator('#jsonEditor').input_value() == 'an unapplied draft'
        assert p.locator('html').get_attribute('data-page-theme') == 'dark'
        assert p.locator('#bothSidesButton').get_attribute('aria-pressed') == 'true'
        load()
    check('undo: removal can be restored later and across faces without rewinding motion, view, theme or draft', undo_safety)

    def undo_boundaries():
        p = simple()
        rail('slide').locator('[data-action="remove"]').first.click(); settle()
        p.locator('#jsonEditor').fill('{ invalid'); p.locator('#applyJsonButton').click(); settle()
        assert p.locator('[data-action="undo"]').first.is_enabled()
        snapshot = state(); p.locator('#jsonEditor').focus(); p.keyboard.press('Control+z'); settle()
        assert state() == snapshot, 'editor shortcut escaped into JSON input'
        rail('topStator').locator('.scale-grip').first.focus(); p.keyboard.press('Control+z'); settle()
        assert state()['sides']['front']['slide'] == ['C']
        rail('slide').locator('[data-action="remove"]').first.click(); settle()
        apply(original)
        assert p.locator('[data-action="undo"]').first.is_disabled()
        rail('slide').locator('[data-action="remove"]').first.click(); settle()
        p.locator('#presetSelect').select_option('faber283n'); p.locator('#loadPresetButton').click(); settle()
        assert p.locator('[data-action="undo"]').first.is_disabled()
        rail('slide').locator('[data-action="remove"]').first.click(); settle()
        saved = download('#saveHtmlButton'); load(saved)
        assert get_page().locator('[data-action="undo"]').first.is_disabled(), 'undo history leaked into standalone export'
        load()
    check('undo: local keyboard shortcut, failed/successful import boundaries, preset replacement and export', undo_boundaries)

    def header_and_editor_layout():
        load(); p = get_page()
        for width in [320, 390, 600, 760, 900, 1100, 1280, 1600, 1800, 1920, 2560]:
            print('  Header/editor width', width, flush=True)
            p.set_viewport_size({'width': width, 'height': 1100})
            for theme in ['light', 'dark', 'solarised']:
                p.locator(f'#pageThemes [data-page-theme="{theme}"]').click(); settle()
                layout = p.evaluate('''() => {
                    const box = s => {const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
                    const row=document.querySelector('.scale-control-row');
                    const parts=['.scale-grip','select','.scale-row-arrows','[data-action="remove"]'].map(s=>{const r=row.querySelector(s).getBoundingClientRect();return {left:r.left,right:r.right,width:r.width}});
                    const actions=box('.header-actions'), themes=box('#pageThemes'), flip=box('#flipButton'), both=box('#bothSidesButton');
                    return {actions,themes,flip,both,parts, font:parseFloat(getComputedStyle(row.querySelector('select')).fontSize),
                        overflow:document.documentElement.scrollWidth>innerWidth+1};
                }''')
                assert not layout['overflow'], (width, theme, layout)
                assert layout['font'] >= 13
                assert abs(layout['flip']['y'] - layout['both']['y']) < 1
                for a, b in zip(layout['parts'], layout['parts'][1:]): assert abs(a['right']-b['left']) <= 1
                if width >= 1100:
                    assert abs(layout['actions']['y'] - layout['themes']['y']) < 1, (width, layout)
                    assert layout['themes']['x'] >= layout['actions']['right'] - 1
                report['rendering'].append({'headerEditor': True, 'width': width, 'theme': theme, 'passed': True})
                if visual and (width in [320, 390, 1600] and (theme == 'light' or width == 1600)):
                    p.evaluate('scrollTo(0,0)'); settle()
                    p.screenshot(path=shots/f'header_{width}_{theme}.png')
                    p.locator('#railEditors').screenshot(path=shots/f'editor_{width}_{theme}.png')
        p.emulate_media(forced_colors='active'); p.set_viewport_size({'width':1100,'height':1000}); settle()
        if visual: p.locator('#railEditors').screenshot(path=shots/'editor_forced_colours.png')
        p.emulate_media(forced_colors='none'); load()
    check('layout: joined scale controls and right-aligned header themes at eleven widths and all themes', header_and_editor_layout)

    def loupe_idle():
        load(); p = get_page(); p.set_viewport_size({'width':1600,'height':1100})
        p.locator('#loupeButton').click(); p.locator('#ruleCanvas').scroll_into_view_if_needed(); settle()
        face = p.locator('.rule-face-body').first.bounding_box()
        x, y = face['x'] + face['width'] * .5, face['y'] + face['height'] * .5
        p.mouse.move(x,y); p.locator('#ruleCanvas').focus(); settle()
        p.wait_for_timeout(3600)
        assert not p.locator('.rule-loupe').evaluate('e=>e.classList.contains("is-idle")')
        p.wait_for_timeout(650)
        assert p.locator('.rule-loupe').evaluate('e=>e.classList.contains("is-idle")')
        assert p.locator('.rule-loupe').evaluate('e=>getComputedStyle(e).opacity') == '0'
        assert p.locator('#loupeButton').get_attribute('aria-pressed') == 'true'
        p.evaluate('dispatchEvent(new Event("resize"))'); settle()
        assert p.locator('.rule-loupe').evaluate('e=>e.classList.contains("is-idle")')
        p.mouse.move(x+1,y); settle()
        assert p.locator('.rule-loupe').evaluate('e=>getComputedStyle(e).opacity') == '1'
        assert p.locator('.rule-loupe').evaluate('e=>getComputedStyle(e).transitionDuration') == '0s'
        p.wait_for_timeout(4250)
        assert p.locator('.rule-loupe').evaluate('e=>getComputedStyle(e).opacity') == '0'
        before = state()['cursor']; p.keyboard.press('ArrowRight'); settle()
        assert state()['cursor'] > before
        assert p.locator('.rule-loupe').evaluate('e=>getComputedStyle(e).opacity') == '1'
        p.keyboard.down('Shift'); p.wait_for_timeout(4250)
        assert p.locator('.rule-loupe').evaluate('e=>getComputedStyle(e).opacity') == '1'
        p.keyboard.up('Shift'); p.wait_for_timeout(4250)
        assert p.locator('.rule-loupe').evaluate('e=>getComputedStyle(e).opacity') == '0'
        p.keyboard.press('a'); settle()
        assert p.locator('.rule-loupe').evaluate('e=>getComputedStyle(e).opacity') == '1'
        if visual: p.screenshot(path=shots/'loupe_awake.png')
        p.emulate_media(reduced_motion='reduce'); p.wait_for_timeout(4250)
        assert p.locator('.rule-loupe').evaluate('e=>getComputedStyle(e).transitionDuration') == '0s'
        p.keyboard.press('Escape'); settle()
        assert p.locator('#loupeButton').get_attribute('aria-pressed') == 'false'
        p.mouse.move(x+3,y); settle(); assert p.locator('.rule-loupe').is_hidden()
        p.emulate_media(reduced_motion='no-preference'); load()
    check('loupe: four-second fade, immediate pointer/key wake, held keys, reduced motion and explicit switch-off', loupe_idle)
