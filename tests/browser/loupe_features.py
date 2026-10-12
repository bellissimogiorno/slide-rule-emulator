"""Four-detent grip and live loupe checks in the runner's explicit browser mode.

Lens geometry is checked against original tick/cursor boxes, not its own CSS.
Temporary screenshots and reports stay outside release archives.
"""


def run_loupe_features(get_page, state, apply, settle, check, load, download,
                       visual, output, report, geometry_source):
    load()
    original = state()
    shots = output / 'loupe'
    if visual:
        shots.mkdir(parents=True, exist_ok=True)
    choices = ['0.005', '0.001', '0.0005', '0.0001']

    def detent_drag():
        for selector in ['#slideRange', '#cursorRange', '#ruleCanvas', '#ruleViewport']:
            p = get_page()
            p.set_viewport_size({'width': 1600, 'height': 1100})
            p.locator('#motionStep').scroll_into_view_if_needed()
            p.locator(selector).focus()
            p.evaluate('''() => {window.stepBlur=0;
                document.activeElement.addEventListener('blur',()=>window.stepBlur++,{once:true});}''')
            before = state()
            r = p.locator('.step-switch').bounding_box()
            y = r['y'] + 20
            p.mouse.move(r['x'] + r['width'] * .125, y)
            p.mouse.down()
            for index in [0, 1, 2, 3, 1, 0, 2]:
                p.mouse.move(r['x'] + r['width'] * (index + .5) / 4, y, steps=3)
                settle()
                assert p.locator('#motionStep [aria-pressed="true"]').get_attribute('data-step') == choices[index]
                assert p.evaluate('document.activeElement.id') == selector[1:]
                assert p.evaluate('window.stepBlur') == 0
                assert state() == before, 'selecting a detent moved the instrument'
            p.mouse.up(); settle()
            assert p.locator('#motionStep [aria-pressed="true"]').get_attribute('data-step') == '0.0005'
            assert state() == before
            p.keyboard.press('ArrowRight'); settle()
            field = 'slideOffset' if selector == '#slideRange' else 'cursor'
            assert abs(state()[field] - before[field] - .0005) < 1e-12
        load()
    check('detents: real drags snap to four settings and retain all four motion focus stops', detent_drag)

    def enable():
        p = get_page()
        if p.locator('#loupeButton').get_attribute('aria-pressed') != 'true':
            p.locator('#loupeButton').click()
        settle()

    def hover(face_index=0):
        p = get_page()
        face = p.locator('#ruleCanvas .rule-face-body').nth(face_index)
        face.locator('.slide-rail').scroll_into_view_if_needed()
        pos = face.evaluate('''face => {
            const rail=face.querySelector('.slide-rail').getBoundingClientRect();
            const cursor=face.querySelector('.cursor').getBoundingClientRect();
            const port=document.getElementById('ruleViewport').getBoundingClientRect();
            return { x:Math.max(port.left+10,Math.min(port.right-10,cursor.x+cursor.width/2)),
                     y:Math.max(10,Math.min(innerHeight-10,rail.y+rail.height/2)) };
        }''')
        p.mouse.move(pos['x'], pos['y']); settle()
        assert p.locator('.rule-loupe').is_visible()
        return pos

    def alignment(pos):
        p = get_page()
        result = p.evaluate('''point => {
            const lens=document.querySelector('.rule-loupe'), copy=lens.firstElementChild;
            const face=document.elementFromPoint(point.x,point.y).closest('.rule-face-body');
            if(!face || !document.getElementById('ruleCanvas').contains(face)) throw Error('lens blocks hit testing');
            const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
            const srcTicks=[...face.querySelectorAll('.tick')], dstTicks=[...copy.querySelectorAll('.tick')];
            const indexes=[0,Math.floor(srcTicks.length/3),Math.floor(srcTicks.length*2/3),srcTicks.length-1];
            const pairs=indexes.map(i=>[box(srcTicks[i]),box(dstTicks[i])]);
            pairs.push([box(face.querySelector('.cursor')),box(copy.querySelector('.cursor'))]);
            const srcLabels=[...face.querySelectorAll('.tick-label')], dstLabels=[...copy.querySelectorAll('.tick-label')];
            const visible=srcLabels.map((e,i)=>({e,i})).filter(({e})=>getComputedStyle(e).visibility!=='hidden');
            for(const item of [visible[0],visible[Math.floor(visible.length/2)],visible[visible.length-1]])
                if(item) pairs.push([box(item.e),box(dstLabels[item.i])]);
            return {pairs,lens:box(lens),vw:innerWidth,vh:innerHeight,
                corners: ['borderTopLeftRadius','borderTopRightRadius','borderBottomLeftRadius','borderBottomRightRadius']
                    .map(key=>parseFloat(getComputedStyle(lens)[key])),
                ids:copy.querySelectorAll('[id]').length,inert:lens.inert,
                hidden:lens.getAttribute('aria-hidden'),count:dstTicks.length,sourceCount:srcTicks.length};
        }''', pos)
        assert result['ids'] == 0 and result['inert'] and result['hidden'] == 'true'
        assert result['count'] == result['sourceCount']
        for src, dst in result['pairs']:
            for axis in ['x', 'y']:
                expected = pos[axis] + 2.5 * (src[axis] - pos[axis])
                assert abs(dst[axis] - expected) < .15, (axis, src, dst, expected)
            for axis in ['width', 'height']:
                assert abs(dst[axis] - 2.5 * src[axis]) < .15, (axis, src, dst)
        r = result['lens']
        expected_side = min(480, result['vw'] - 16, result['vh'] - 16)
        assert abs(r['width'] - expected_side) < .1 and abs(r['height'] - expected_side) < .1
        assert all(radius == 12 for radius in result['corners']), result['corners']
        assert r['x'] >= 7.9 and r['y'] >= 7.9
        assert r['x'] + r['width'] <= result['vw'] - 7.9
        assert r['y'] + r['height'] <= result['vh'] - 7.9
        assert p.evaluate('document.documentElement.scrollWidth-innerWidth') <= 1
        return result

    def live_movement():
        apply({**original, 'cursor': .5, 'slideOffset': 0})
        p = get_page(); p.set_viewport_size({'width': 1600, 'height': 1100})
        p.locator('#ruleCanvas').focus()
        before = state()
        enable()
        assert state() == before and p.evaluate('document.activeElement.id') == 'ruleCanvas'
        pos = hover(); alignment(pos)
        p.evaluate('window.initialLoupeCopy=document.querySelector(".loupe-copy")')
        p.mouse.down(); p.mouse.move(pos['x']+26,pos['y'],steps=6); p.mouse.up(); settle()
        assert state()['cursor'] > before['cursor']
        pos['x'] += 26
        alignment(pos)
        assert p.evaluate('window.initialLoupeCopy===document.querySelector(".loupe-copy")')
        p.keyboard.press('s'); p.keyboard.press('3'); p.keyboard.press('ArrowRight'); settle()
        assert abs(state()['slideOffset'] - .0005) < 1e-12
        alignment(pos)
        p.keyboard.press('c'); p.keyboard.press('4'); p.keyboard.press('ArrowRight'); settle()
        alignment(pos)
        assert p.evaluate('window.initialLoupeCopy===document.querySelector(".loupe-copy")')
        r = p.locator('#ruleCanvas .slide-rail .tick-pane').first.bounding_box()
        x, y = r['x'] + r['width']*.22, r['y']+r['height']/2
        before = state()['slideOffset']
        p.mouse.move(x,y);p.mouse.down();p.mouse.move(x+20,y,steps=4);p.mouse.up();settle()
        assert state()['slideOffset'] > before
        alignment({'x':x+20,'y':y})
        p.keyboard.press('Escape'); settle()
        assert not p.locator('.rule-loupe').is_visible()
        assert p.locator('.loupe-copy').count() == 0
        p.keyboard.press('m'); settle()
        assert p.locator('.rule-loupe').is_visible()
        # Touch has no persistent hover, and key repeat must not flicker the lens.
        p.evaluate("window.dispatchEvent(new PointerEvent('pointerdown',{pointerType:'touch',isPrimary:true}))")
        assert not p.locator('.rule-loupe').is_visible()
        p.mouse.move(x+21,y);settle()
        assert p.locator('.rule-loupe').is_visible()
        p.evaluate("document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'m',repeat:true,bubbles:true,cancelable:true}))")
        assert p.locator('#loupeButton').get_attribute('aria-pressed')=='true'
        p.mouse.move(3,3);settle()
        assert not p.locator('.rule-loupe').is_visible()
        p.locator('#jsonEditor').fill('m');p.keyboard.type('m');settle()
        assert p.locator('#loupeButton').get_attribute('aria-pressed') == 'true'
        load()
    check('loupe: 2.5x tick/cursor alignment, live dragging, keyboard movement and local shortcuts', live_movement)

    def geometry_matrix():
        p = get_page()
        for preset in ['faber283n', 'pickettN3', 'pickettN4', 'flyingFish1017']:
            p.set_viewport_size({'width':1600,'height':1100})
            p.locator('#presetSelect').select_option(preset);p.locator('#loadPresetButton').click();settle()
            base = state()
            for zoom in [1, 2]:
                apply({**base,'viewMode':'both','magnification':zoom,'cursor':.3,'slideOffset':.035})
                for theme in ['light','dark','solarised']:
                    p.locator(f'#pageThemes [data-page-theme="{theme}"]').click();settle()
                    enable()
                    for face in [0,1]:
                        pos = hover(face);alignment(pos)
                        report['rendering'].append({'loupe':True,'preset':preset,'zoom':zoom,'pageTheme':theme,'face':face,'passed':True})
                        if visual and theme == 'light' and zoom == 1 and face == 0:
                            p.screenshot(path=shots/f'{preset}_loupe.png')
                p.locator('#compactScaleToggle').uncheck();settle()
                alignment(hover(0))
        for width in [320,390,760,1100]:
            p.set_viewport_size({'width':width,'height':1000})
            apply({**original,'viewMode':'both','magnification':2,'cursor':.25})
            enable();pos=hover(0);alignment(pos)
            p.locator('#ruleViewport').evaluate('e=>e.scrollLeft=180');settle()
            alignment(pos)
            p.set_viewport_size({'width':width+1,'height':1000});settle()
            if p.locator('.rule-loupe').is_visible():alignment(pos)
            report['rendering'].append({'loupe':True,'width':width,'scrolled':True,'passed':True})
            if visual:p.screenshot(path=shots/f'loupe_{width}.png')
        for width, height in [(760, 280), (390, 300)]:
            p.set_viewport_size({'width': width, 'height': height})
            apply({**original, 'cursor': .5})
            enable(); alignment(hover(0))
            report['rendering'].append({'loupe': True, 'width': width, 'height': height,
                                        'shortViewport': True, 'passed': True})
            if visual: p.screenshot(path=shots/f'loupe_short_{width}_{height}.png')
        load()
    check('loupe: both faces, four presets, all page themes, two zoom levels and viewport clipping', geometry_matrix)

    def exports_and_lifetime():
        p=get_page();p.set_viewport_size({'width':1600,'height':1100})
        enable();hover()
        before=state()
        saved=download('#saveHtmlButton')
        assert 'class="rule-loupe"' not in saved
        load(saved);p=get_page()
        assert state()==before
        assert p.locator('#loupeButton').get_attribute('aria-pressed')=='false'
        assert p.locator('.rule-loupe').count()==1 and not p.locator('.rule-loupe').is_visible()
        assert p.locator('#motionStep [aria-pressed="true"]').get_attribute('data-step')=='0.001'
        enable();hover()
        p.evaluate("async()=> (await import('#main.js')).application.destroy()")
        settle()
        assert p.locator('.rule-loupe').count()==0
        p.locator('#loupeButton').click();settle()
        assert p.locator('.rule-loupe').count()==0
        load()
    check('loupe: standalone copies omit the live lens; settings reset; destroy removes listeners and overlay', exports_and_lifetime)
    load()
