"""Prominent preset chooser, compact detents, 75% view and a larger pointer lens.

Run through run.py --suite workspace (native by default). The runner explicitly
records any DOM-only execution; screenshots are evidence, not golden images.
"""


def run_workspace_presentation(get_page, state, apply, settle, check, load, download,
                               visual, output, report, geometry_source):
    load()
    original = state()
    shots = output / 'workspace-presentation'
    shots.mkdir(parents=True, exist_ok=True)

    def preset_bar():
        p = get_page()
        p.set_viewport_size({'width': 1600, 'height': 1100})
        assert p.locator('#presetSelect').count() == 1
        assert p.locator('#presetPicker').bounding_box()['y'] < p.locator('.toolbar').bounding_box()['y']
        assert p.locator('#presetSelect').is_visible()
        assert not p.locator('#presetDescription').is_visible()
        draft = '{"unapplied": "draft must survive browsing the catalogue"}'
        p.locator('#jsonEditor').fill(draft)
        before = state()
        p.locator('#presetSelect').select_option('pickettN3')
        assert state() == before, 'merely choosing a preset applied it'
        p.locator('#presetDetailsButton').click(); settle()
        assert p.locator('#presetDetailsButton').get_attribute('aria-expanded') == 'true'
        assert p.locator('#presetDescription').is_visible()
        assert p.locator('#presetDescription').inner_text()
        assert state() == before and p.locator('#jsonEditor').input_value() == draft
        p.locator('#presetDetailsButton').press('Space'); settle()
        assert not p.locator('#presetDescription').is_visible()
        # The promoted chooser remains accessible while the detailed editor is hidden.
        apply({**original, 'viewMode': 'both', 'magnification': .75})
        p.locator('#pageThemes [data-page-theme="dark"]').click()
        p.locator('#slideRange').focus(); p.keyboard.press('3')
        p.locator('#focusButton').click(); settle()
        assert not p.locator('.side-panel').is_visible()
        assert p.locator('#presetSelect').is_visible()
        p.locator('#presetSelect').select_option('pickettN3')
        p.locator('#loadPresetButton').click(); settle()
        s = state()
        assert s['presetId'] == 'pickettN3' and s['viewMode'] == 'both' and s['magnification'] == .75
        assert p.locator('html').get_attribute('data-page-theme') == 'dark'
        assert p.locator('#motionStep [aria-pressed="true"]').get_attribute('data-step') == '0.0005'
        p.locator('#focusButton').click(); settle()
        load()
    check('workspace: preset choice is prominent, explicit, described and available in Focus rule', preset_bar)

    def compact_focus():
        p = get_page()
        names = ['Faster', 'Normal', 'Fine', 'Very fine']
        steps = ['0.005', '0.001', '0.0005', '0.0001']
        for focus in ['#slideRange', '#cursorRange', '#ruleViewport', '#ruleCanvas']:
            p.locator(focus).focus()
            for index, (name, step) in enumerate(zip(names, steps)):
                before = state()
                p.locator(f'#motionStep [data-step="{step}"]').click(); settle()
                assert p.evaluate('document.activeElement.id') == focus[1:]
                assert state() == before
                assert p.locator('.step-value').inner_text() == f'{index + 1} {name}'
                field = 'slideOffset' if focus == '#slideRange' else 'cursor'
                p.keyboard.press('ArrowRight'); settle()
                assert abs(state()[field] - before[field] - float(step)) < 1e-12
            p.keyboard.press('2'); settle()
            assert p.locator('.step-value').inner_text() == '2 Normal'
        # Real captured drag across the shorter rail; the card never changes focus.
        p.locator('#slideRange').focus()
        box = p.locator('.step-switch').bounding_box()
        y = box['y'] + 29
        before = state()
        p.mouse.move(box['x'] + box['width'] / 8, y); p.mouse.down()
        for i in [0, 1, 2, 3, 1]:
            p.mouse.move(box['x'] + box['width'] * (i + .5) / 4, y, steps=3); settle()
            assert p.locator('.step-value').inner_text() == f'{i + 1} {names[i]}'
        p.mouse.up(); settle()
        assert state() == before and p.evaluate('document.activeElement.id') == 'slideRange'
        load()
    check('workspace: compact detents retain focus, correct heading, exact nudges and captured dragging', compact_focus)

    def responsive():
        p = get_page()
        for theme in ['light', 'dark', 'solarised']:
            p.locator(f'#pageThemes [data-page-theme="{theme}"]').click()
            for width in [320, 390, 480, 600, 601, 760, 761, 1100, 1280, 1600, 1920, 2560, 3440]:
                p.set_viewport_size({'width': width, 'height': 1100}); settle()
                p.evaluate('window.scrollTo(0,0)'); settle()
                dims = p.evaluate('''() => {
                    const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}};
                    return {
                        cards:[...document.querySelectorAll('.position-control,.step-control')].map(rect),
                        hit:[...document.querySelectorAll('.step-stop')].map(rect),
                        labels:[...document.querySelectorAll('.step-stop small')].map(e=>({...rect(e),font:parseFloat(getComputedStyle(e).fontSize)})),
                        grip:rect(document.querySelector('.step-grip')),
                        bar:rect(document.getElementById('presetPicker')),
                        preset:[...document.querySelectorAll('.preset-row > *')].map(rect),
                        overflowing:[...document.querySelectorAll('#presetPicker button,#motionStep button,.step-value')]
                            .filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>e.outerHTML),
                        pageOverflow:document.documentElement.scrollWidth-innerWidth
                    };
                }''')
                assert max(d['h'] for d in dims['cards']) - min(d['h'] for d in dims['cards']) < .1, dims
                assert all(72 <= d['h'] <= 78 for d in dims['cards']), dims
                assert all(d['h'] >= 40 and d['w'] >= 48 for d in dims['hit']), dims
                assert all(d['font'] == 13 and d['bottom'] <= dims['grip']['y'] + .1 for d in dims['labels']), dims
                assert not dims['overflowing'] and dims['pageOverflow'] <= 1, dims
                assert all(d['x'] >= 0 and d['right'] <= width + .1 for d in dims['preset']), dims
                if width >= 1100:
                    assert abs(dims['bar']['w'] - p.locator('#ruleViewport').bounding_box()['width']) < 1
                report['rendering'].append({'workspaceWidth': width, 'theme': theme, 'compactControls': dims['cards'], 'passed': True})
                if visual and width in [320, 390, 1100, 1600]:
                    p.screenshot(path=shots/f'{theme}_{width}.png')
        p.set_viewport_size({'width': 1600, 'height': 1100})
        p.emulate_media(forced_colors='active')
        p.locator('#slideRange').focus(); p.keyboard.press('4'); settle()
        if visual: p.locator('.toolbar').screenshot(path=shots/'forced-colours.png')
        p.emulate_media(forced_colors='none')
        load()
    check('workspace: equal-height readable controls and full-width preset chooser at 13 widths in three themes', responsive)

    def zoom_and_export():
        p = get_page(); p.set_viewport_size({'width':1600,'height':1100})
        p.locator('#magnificationSelect').select_option('0.75'); settle()
        assert state()['magnification'] == .75
        dimensions = p.locator('.rule-shell').evaluate('e=>({screen:e.getBoundingClientRect().height,local:e.offsetHeight})')
        assert abs(dimensions['screen']/dimensions['local'] - .75) < .002, dimensions
        # Drag distance is calculated from real, now smaller, graduation geometry.
        p.locator('#ruleCanvas').scroll_into_view_if_needed()
        pane = p.locator('#ruleCanvas .slide-rail .tick-pane').first.bounding_box()
        x,y = pane['x'] + .3*pane['width'], pane['y']+pane['height']/2
        before=state()['slideOffset']
        p.mouse.move(x,y);p.mouse.down();p.mouse.move(x+30,y,steps=5);p.mouse.up();settle()
        assert abs(state()['slideOffset'] - before - 30/pane['width']) < 1e-5
        p.locator('#cursorRange').focus();p.keyboard.press('4')
        before=state()['cursor'];p.keyboard.press('ArrowRight');settle()
        assert abs(state()['cursor']-before-.0001)<1e-12
        before=state()
        text=download('#saveHtmlButton')
        assert '0.75' in text
        load(text)
        assert state() == before, '75% configured export was normalised away'
        assert get_page().locator('#magnificationSelect').input_value() == '0.75'
        load()
    check('workspace: 75% actually scales the rule and retains pointer, keyboard and standalone coordinates', zoom_and_export)

    def preset_geometry():
        p = get_page()
        presets = p.evaluate("async()=>(await import('#catalog/presets.js')).PRESETS")
        p.set_viewport_size({'width':1600, 'height':1100})
        for key, preset in presets.items():
            for compact in [False, True]:
                data = {**original, **{k:v for k,v in preset.items() if k in original},
                        'sides':preset['sides'], 'presetId':key, 'activeSide':'front', 'viewMode':'both',
                        'compactScales':compact, 'magnification':.75, 'cursor':.5,'slideOffset':0}
                apply(data)
                result=p.evaluate(geometry_source)
                failures={k:v for k,v in result.items() if k in ['collisions','tickCrossings','clipped','smallLabels','emptyRows','bodyOverflow'] and v}
                report['rendering'].append({'preset':key,'zoom':.75,'compact':compact,'both':True,'passed':not failures,'failures':failures})
                assert not failures,(key,compact,failures)
                if visual and key in ['faber282n','pickettN3','pickettN4','flyingFish1017'] and compact:
                    p.locator('#ruleViewport').screenshot(path=shots/f'{key}_75.png')
        load()
    check('workspace: every preset on both faces has sound graduation geometry at 75%, in both number modes', preset_geometry)

    def large_loupe():
        p=get_page()
        for width,height,zoom in [(1600,1100,.75),(1600,1100,1),(1600,1100,2),
                                 (496,900,.75),(480,900,.75),(390,900,.75),(320,900,1),(760,280,.75)]:
            p.set_viewport_size({'width':width,'height':height})
            apply({**original,'viewMode':'both','magnification':zoom,'cursor':.35,'slideOffset':.04})
            if p.locator('#loupeButton').get_attribute('aria-pressed')!='true':p.locator('#loupeButton').click()
            face=p.locator('#ruleCanvas .rule-face-body').first
            face.locator('.slide-rail').scroll_into_view_if_needed();settle()
            point=face.evaluate('''face=>{
                const rail=face.querySelector('.slide-rail').getBoundingClientRect(),c=face.querySelector('.cursor').getBoundingClientRect(),v=document.getElementById('ruleViewport').getBoundingClientRect();
                return {x:Math.max(v.left+5,Math.min(v.right-5,c.x+c.width/2)),y:Math.max(10,Math.min(innerHeight-10,rail.y+rail.height/2))};
            }''')
            p.mouse.move(point['x']+1,point['y']);p.mouse.move(point['x'],point['y']);settle()
            assert p.locator('.rule-loupe').is_visible()
            geometry=p.evaluate('''point=>{
                const lens=document.querySelector('.rule-loupe'),copy=lens.firstElementChild,
                    face=document.elementFromPoint(point.x,point.y).closest('.rule-face-body');
                if(!face || !document.getElementById('ruleCanvas').contains(face))throw Error('lens intercepted hit testing');
                const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
                return {lens:box(lens),pairs:['.cursor','.slide-rail .tick','.tick-label'].map(s=>[box(face.querySelector(s)),box(copy.querySelector(s))])};
            }''',point)
            side=min(480,width-16,height-16)
            assert abs(geometry['lens']['w']-side)<.1 and abs(geometry['lens']['h']-side)<.1,geometry
            for src,dst in geometry['pairs']:
                for axis in ['x','y']:assert abs(dst[axis]-(point[axis]+2.5*(src[axis]-point[axis])))<.2,(src,dst,point)
                for axis in ['w','h']:assert abs(dst[axis]-2.5*src[axis])<.2,(src,dst)
            assert p.evaluate('document.documentElement.scrollWidth-innerWidth')<=1
            report['rendering'].append({'largeLoupe':[width,height,zoom],'side':side,'passed':True})
            if visual:p.screenshot(path=shots/f'loupe_{width}_{height}_{zoom}.png')
        load()
    check('workspace: 480px square loupe stays aligned at 75/100/200%, screen edges and mobile sizes',large_loupe)
    load()
