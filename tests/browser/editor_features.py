"""Readout and editor interaction checks shared by the native and DOM runners.

Pointer tests use actual mouse/touch input. The test never mutates the live
programme behind the editor; setup uses the public JSON import boundary.
"""
import json


def run_editor_features(get_page, state, apply, settle, check, load, download,
                        visual, output, report, geometry_source):
    load()
    original = state()
    shots = output / 'editor'
    shots.mkdir(parents=True, exist_ok=True)
    p = get_page()
    p.set_viewport_size({'width': 1600, 'height': 1200})

    def simple():
        get_page().set_viewport_size({'width':1600,'height':1200})
        apply({**original, 'viewMode': 'single', 'activeSide': 'front',
               'sides': {'front': {'name': 'Front', 'topStator': ['A', 'D', 'K', 'D'],
                                   'slide': ['C', 'CI'], 'bottomStator': []}},
               'cursor': .5, 'slideOffset': 0})
        get_page().locator('#railEditors').scroll_into_view_if_needed()
        settle()

    def rail(name):
        return get_page().locator(f'.rail-row-list[data-rail="{name}"]')

    def assert_order():
        for name, expected in state()['sides'][state()['activeSide']].items():
            if name not in ['topStator', 'slide', 'bottomStator']:
                continue
            actual = rail(name).locator('select').evaluate_all('els=>els.map(e=>e.value)')
            assert actual == expected, (name, actual, expected)
            indices = rail(name).locator('.scale-control-row').evaluate_all('els=>els.map(e=>Number(e.dataset.index))')
            assert indices == list(range(len(expected)))
        assert get_page().locator('.reorder-ghost, .is-placeholder').count() == 0

    def start_drag(name, index):
        p = get_page()
        handle = rail(name).locator('.scale-grip').nth(index)
        box = handle.bounding_box()
        p.mouse.move(box['x'] + box['width']/2, box['y'] + box['height']/2)
        p.mouse.down()
        return p

    def drag_to(name, index=None):
        p = get_page()
        dest = rail(name) if index is None else rail(name).locator('.scale-control-row').nth(index)
        box = dest.bounding_box()
        p.mouse.move(box['x'] + 30, box['y'] + box['height'] * .8, steps=8)
        settle()

    def arrow_keys():
        simple(); p = get_page()
        assert rail('topStator').locator('[data-action="up"]').first.is_disabled()
        assert rail('topStator').locator('[data-action="down"]').last.is_enabled()
        grip = rail('topStator').locator('.scale-grip').nth(1)
        grip.focus(); p.evaluate('window.retainedGrip=document.activeElement')
        p.keyboard.press('ArrowDown')
        assert state()['sides']['front']['topStator'] == ['A', 'K', 'D', 'D']
        assert p.evaluate('document.activeElement===window.retainedGrip')
        assert p.evaluate('document.getElementById("railEditors").getAnimations({subtree:true}).length') > 0
        p.keyboard.press('Home'); settle()
        assert state()['sides']['front']['topStator'] == ['D', 'A', 'K', 'D']
        p.keyboard.press('End'); settle()
        assert state()['sides']['front']['topStator'] == ['A', 'K', 'D', 'D']
        assert 'position 4 of 4' in p.locator('#reorderStatus').inner_text()
        p.keyboard.press('ArrowRight'); settle()
        assert state()['sides']['front']['slide'] == ['C', 'CI', 'D']
        p.keyboard.press('ArrowLeft'); settle()
        assert state()['sides']['front']['topStator'] == ['A', 'K', 'D', 'D']
        assert_order()
    check('editor: focused grip reorders duplicate occurrences, animates and crosses rails by keyboard', arrow_keys)

    def arrows():
        simple(); p = get_page()
        button = rail('topStator').locator('[data-action="up"]').nth(2)
        button.click(); settle()
        assert state()['sides']['front']['topStator'] == ['A', 'K', 'D', 'D']
        assert p.evaluate('document.activeElement.dataset.action') == 'up'
        p.keyboard.press('Enter'); settle()
        assert state()['sides']['front']['topStator'][0] == 'K'
        assert p.evaluate('document.activeElement.classList.contains("scale-grip")'), 'endpoint must not strand focus on a disabled button'
        assert_order()
        before = state()
        rail('topStator').locator('select').first.select_option('B'); settle()
        assert state()['sides']['front']['topStator'][0] == 'B'
        assert 'B' in rail('topStator').locator('.scale-grip').first.get_attribute('aria-label')
        assert state()['cursor'] == before['cursor'] and state()['slideOffset'] == before['slideOffset']
    check('editor: filled arrow buttons retain focus and selection changes refresh their labels', arrows)

    def pointer_preview():
        simple()
        rail('topStator').locator('select').first.select_option('B'); settle()
        before = state(); p = start_drag('topStator', 0)
        drag_to('topStator', 2)
        assert p.locator('.reorder-ghost').count() == 1
        assert p.locator('.reorder-ghost select').input_value() == 'B'
        assert state() == before, 'drag preview changed the saved programme'
        assert p.locator('.is-placeholder').get_attribute('data-index') == '0'
        if visual: p.locator('#railEditors').screenshot(path=shots/'drag-preview.png')
        p.mouse.up(); settle()
        assert state()['sides']['front']['topStator'] == ['D', 'K', 'B', 'D']
        assert p.evaluate('document.activeElement.classList.contains("scale-grip")')
        assert_order()
    check('editor: real drag previews movement but commits exactly once on drop', pointer_preview)

    def cross_rail():
        simple(); p = start_drag('topStator', 1)
        drag_to('bottomStator')
        assert p.locator('.reorder-drop-marker').get_attribute('data-rail') == 'bottomStator'
        p.mouse.up(); settle()
        assert state()['sides']['front']['topStator'] == ['A', 'K', 'D'], state()['sides']['front']
        assert state()['sides']['front']['bottomStator'] == ['D']
        assert not rail('bottomStator').locator('.rail-empty').is_visible()
        assert_order()
        exported = json.loads(download('#exportJsonButton'))
        assert exported == state()
        saved = download('#saveHtmlButton')
        assert 'class="scale-control-row is-placeholder"' not in saved
        assert 'class="scale-control-row reorder-ghost"' not in saved
        current = state(); load(saved)
        assert state() == current
        assert_order()
    check('editor: cross-rail drop, empty-rail target, JSON and standalone exports preserve order', cross_rail)

    def cancellation():
        for kind in ['Escape', 'Tab', 'outside', 'pointercancel', 'resize']:
            simple(); before = state(); p = start_drag('topStator', 0)
            drag_to('slide', 1)
            assert state() == before
            if kind in ['Escape', 'Tab']:
                p.keyboard.press(kind)
            elif kind == 'outside':
                p.mouse.move(p.viewport_size['width'] - 5, 20, steps=5)
            elif kind == 'resize':
                p.set_viewport_size({'width': 1599, 'height': 1200})
            else:
                p.locator('#railEditors').dispatch_event('pointercancel', {'pointerId': 1})
            p.mouse.up(); settle()
            assert state() == before, kind
            assert_order()
        p.set_viewport_size({'width':1600, 'height':1200})
    check('editor: Escape, invalid drop, pointer cancellation and resize restore the original programme', cancellation)

    def touch_and_scroll():
        simple(); p = get_page()
        a = rail('topStator').locator('.scale-grip').first.bounding_box()
        b = rail('topStator').locator('.scale-control-row').nth(2).bounding_box()
        session = p.context.new_cdp_session(p)
        session.send('Input.dispatchTouchEvent', {'type':'touchStart', 'touchPoints':[{'x':a['x']+10,'y':a['y']+15}]})
        session.send('Input.dispatchTouchEvent', {'type':'touchMove', 'touchPoints':[{'x':b['x']+30,'y':b['y']+b['height']*.8}]})
        session.send('Input.dispatchTouchEvent', {'type':'touchEnd', 'touchPoints':[]})
        session.detach(); settle()
        assert state()['sides']['front']['topStator'] == ['D','K','A','D']
        assert_order()
        # A long rail remains reachable while holding the grip at a viewport edge.
        data = state(); data['sides']['front']['topStator'] = ['D'] * 18
        apply(data); p = get_page()
        rail('topStator').locator('.scale-grip').first.scroll_into_view_if_needed()
        start_drag('topStator', 0)
        region = rail('topStator').bounding_box()
        p.mouse.move(region['x']+35, p.viewport_size['height']-8, steps=5)
        old_y = p.evaluate('scrollY'); p.wait_for_timeout(250)
        assert p.evaluate('scrollY') > old_y
        p.keyboard.press('Escape'); p.mouse.up(); settle()
        assert state() == data
        assert_order()
    check('editor: browser touch events move rows and edge scrolling reaches long lists', touch_and_scroll)

    def reduced_motion_and_draft():
        simple(); p = get_page(); p.emulate_media(reduced_motion='reduce')
        p.locator('#jsonEditor').fill('unapplied draft')
        handle = rail('topStator').locator('.scale-grip').first
        handle.focus(); p.keyboard.press('ArrowDown')
        assert p.evaluate('document.getElementById("railEditors").getAnimations({subtree:true}).length') == 0
        assert p.locator('#jsonEditor').input_value() == 'unapplied draft'
        assert_order()
        p.emulate_media(reduced_motion='no-preference')
        load()
    check('editor: reduced motion disables animation and reordering preserves unapplied JSON drafts', reduced_motion_and_draft)

    def grouped_roots_and_both():
        p = get_page(); p.locator('#presetSelect').select_option('pickettN3'); p.locator('#loadPresetButton').click()
        p.locator('#sideSelect').select_option(''); p.locator('#editSideSelect').select_option('front'); settle()
        before = state(); ids = before['sides']['front']['topStator']
        index = ids.index('PICKETT_SQRT')
        rail('topStator').locator('.scale-grip').nth(index).focus()
        p.keyboard.press('ArrowRight'); settle()
        assert 'PICKETT_SQRT' in state()['sides']['front']['slide']
        assert state()['sides']['back'] == before['sides']['back']
        assert p.locator('.readout-side-heading').count() == 2
        assert p.locator('.readout-card[data-readout-scale="PICKETT_SQRT"] .multi > span').count() == 2
        assert p.locator('.readout-card[data-readout-scale="PICKETT_CBRT"] .multi > span').count() == 3
        assert_order()
    check('editor: whole root banks move together and both-face editing leaves the other face unchanged', grouped_roots_and_both)

    def readout_layout():
        p = get_page()
        p.set_viewport_size({'width':1600,'height':1100}); settle()
        presets = p.evaluate("async()=>Object.keys((await import('#catalog/presets.js')).PRESETS)")
        for name in presets:
            p.locator('#presetSelect').select_option(name); p.locator('#loadPresetButton').click()
            p.locator('#sideSelect').select_option(''); settle()
            expected_count = sum(len(face[rail]) for face in state()['sides'].values() for rail in ['topStator','slide','bottomStator'])
            assert p.locator('.readout-card').count() == expected_count
            values = p.locator('.readout-card .value').all_text_contents()
            # Exercise production CSS/output without retessellating every
            # instrument on every resize. Real navigation and live controls are
            # tested separately; this static fixture isolates readout reflow.
            css = p.locator('style').all_text_contents()
            markup = p.locator('#readout').evaluate('el=>el.outerHTML')
            theme = p.locator('html').get_attribute('data-page-theme') or 'light'
            panel = p.context.new_page()
            panel.set_viewport_size({'width':1600,'height':1100})
            panel.set_content('<!doctype html><html lang="en-GB" data-page-theme="'+theme+'"><head><style>'+ '\n'.join(css)+'</style></head><body><main><section class="workbench">'+markup+'</section></main></body></html>')
            panel.evaluate('document.fonts.ready')
            assert abs(panel.locator('#readout').bounding_box()['height'] - p.locator('#readout').bounding_box()['height']) < .1, 'readout fixture differs from live application'
            for width in [320, 390, 760, 1100, 1800]:
                panel.set_viewport_size({'width':width,'height':1100})
                for theme in ['light','dark','solarised']:
                    panel.evaluate('(theme)=>document.documentElement.dataset.pageTheme=theme', theme)
                    assert panel.locator('.readout-card .value').all_text_contents() == values
                    faults = panel.evaluate('''() => {
                      const faults = [];
                      if (document.documentElement.scrollWidth > innerWidth + 1) faults.push('page overflow');
                      for (const e of document.querySelectorAll('.readout-card, .readout-cards, .readout-rail')) {
                        if (e.scrollWidth > e.clientWidth + 1) faults.push('overflow: '+e.className);
                      }
                      for (const e of document.querySelectorAll('.readout-card .scale-id, .readout-card .value:not(.multi), .readout-card .multi > span')) {
                        const card = e.closest('.readout-card').getBoundingClientRect();
                        const range = document.createRange(); range.selectNodeContents(e);
                        for (const r of range.getClientRects()) {
                          if (r.left < card.left - 1 || r.right > card.right + 1 || r.top < card.top - 1 || r.bottom > card.bottom + 1) faults.push('clipped: '+e.textContent);
                        }
                        if (e.closest('.value') && parseFloat(getComputedStyle(e).fontSize) < 16) faults.push('small value');
                      }
                      return faults;
                    }''')
                    report['rendering'].append({'readout':True, 'scope':'production CSS and rendered readout fixture', 'preset':name, 'view':'both','width':width,'pageTheme':theme,'passed':not faults,'faults':faults})
                    assert not faults, (name,width,theme,faults)
                    if visual and name in ['faber283n','pickettN3','flyingFish1017','blackbody17'] and (width,theme) in [(1800,'light'),(390,'dark'),(1100,'solarised')]:
                        panel.locator('#readout').screenshot(path=shots/f'{name}_{width}_{theme}_readout.png')
            panel.close()
        print('Completed readout layout matrix', flush=True)
    check('readout: production-CSS fixtures match the live app and reflow all presets at five widths and three themes', readout_layout)

    def pathological_text():
        load(); p = get_page(); data = state()
        data['customScales'] = [{'id':'LONG', 'type':'log', 'min':1, 'max':10,
                                 'label':'CUSTOM_'*10, 'unit':'long_custom_unit_'*4}]
        data['sides'] = {'front':{'name':'Front','topStator':['LONG'],'slide':[],'bottomStator':[]}}
        data['activeSide']='front'; data['viewMode']='single'; apply(data)
        p.set_viewport_size({'width':320,'height':1000}); settle()
        assert p.evaluate('document.documentElement.scrollWidth <= innerWidth+1')
        assert p.locator('.readout-card').evaluate('el=>el.scrollWidth<=el.clientWidth+1')
        assert 'CUSTOM_'*10 in p.locator('#readout').inner_text()
        assert 'long_custom_unit_'*4 in p.locator('#readout').inner_text()
        p.emulate_media(forced_colors='active'); settle()
        rail('topStator').locator('.scale-grip').focus()
        p.keyboard.press('ArrowRight'); settle()
        assert state()['sides']['front']['slide']==['LONG']
        p.emulate_media(forced_colors='none'); load()
    check('readout/editor: long custom text reflows intact, and forced-colours controls stay usable', pathological_text)

    def lifecycle():
        simple(); before = state(); p = start_drag('topStator',0); drag_to('slide',1)
        p.evaluate("async()=>(await import('#main.js')).application.destroy()")
        p.mouse.up(); settle()
        assert state() == before
        assert_order()
        rail('topStator').locator('[data-action="down"]').first.click(); settle()
        assert state() == before
        load()
    check('editor: application destruction cancels an in-progress drag and removes its listeners', lifecycle)
    get_page().set_viewport_size({'width':1600,'height':1000})
