"""Independent native-size loupe checks, in the runner's explicit browser mode.

The old scale-transformed clone fails the computed-font-size/transform checks.
Geometry is compared to the live source, not to the painter's own helper values.
"""


def run_loupe_rendering(get_page, state, apply, settle, check, load, download,
                        visual, output, report):
    load()
    original = state()
    shots = output / 'direct-loupe'
    if visual:
        shots.mkdir(parents=True, exist_ok=True)

    def enable_hover(index=0, page=None):
        p = page or get_page()
        if p.locator('#loupeButton').get_attribute('aria-pressed') != 'true':
            p.locator('#loupeButton').click()
        face = p.locator('#ruleCanvas .rule-face-body').nth(index)
        face.locator('.slide-rail').scroll_into_view_if_needed()
        pos = face.evaluate('''face => {
            const r=face.querySelector('.slide-rail').getBoundingClientRect();
            const c=face.querySelector('.cursor').getBoundingClientRect();
            const v=document.getElementById('ruleViewport').getBoundingClientRect();
            return {x:Math.max(v.left+8,Math.min(v.right-8,c.x+c.width/2)),
                y:Math.max(10,Math.min(innerHeight-10,r.y+r.height/2))};
        }''')
        p.mouse.move(pos['x'] + .5, pos['y'])
        p.mouse.move(pos['x'], pos['y'])
        p.evaluate("async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));}")
        assert p.locator('.rule-loupe').is_visible()
        return pos

    def inspect(point, page=None):
        result = (page or get_page()).evaluate('''point => {
            const lens=document.querySelector('.rule-loupe');
            const copy=lens.querySelector('.loupe-copy');
            const face=document.elementFromPoint(point.x,point.y)?.closest('.rule-face-body');
            if(!face || !document.getElementById('ruleCanvas').contains(face))throw Error('blocked pointer');
            const zoom=face.getBoundingClientRect().width/parseFloat(getComputedStyle(face).width);
            const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}};
            const pairs=[],counts=[],visibility=[];
            for(const selector of ['.tick','.syncro-tick','.baseline','.root-spine','.syncro-baseline',
                                    '.tick-label','.compact-part','.scale-name','.scale-legend','.cursor']) {
                const a=[...face.querySelectorAll(selector)],b=[...copy.querySelectorAll(selector)];
                counts.push([selector,a.length,b.length]);
                if(a.length!==b.length)continue;
                for(let i=0;i<a.length;i+=Math.max(1,Math.floor(a.length/8))){
                    const ac=getComputedStyle(a[i]),bc=getComputedStyle(b[i]);
                    visibility.push(ac.visibility===bc.visibility && (ac.display==='none')===(bc.display==='none'));
                    if(ac.display!=='none')pairs.push([selector,rect(a[i]),rect(b[i])]);
                }
            }
            const fonts=[];
            for(const selector of ['.tick-label','.syncro-number','.compact-part','.scale-name','.scale-legend']) {
                const a=[...face.querySelectorAll(selector)],b=[...copy.querySelectorAll(selector)];
                for(let i=0;i<a.length;i+=Math.max(1,Math.floor(a.length/12))){
                    if(getComputedStyle(a[i]).display==='none')continue;
                    fonts.push([parseFloat(getComputedStyle(a[i]).fontSize)*zoom*2.5,parseFloat(getComputedStyle(b[i]).fontSize)]);
                }
            }
            const hidden=[...copy.querySelectorAll('.label-hidden [data-loupe-text]')]
                .filter(e=>getComputedStyle(e).visibility!=='hidden').length;
            // Translation only repositions text already painted at its final
            // size. A scale/rotation would invalidate native-size rendering.
            const rootMatrix=new DOMMatrixReadOnly(getComputedStyle(copy).transform);
            return {pairs,counts,fonts,visibility,hidden,lens:rect(lens),
                transforms:[...copy.querySelectorAll('.slide-mover,.cursor,.tick-label')].slice(0,50)
                    .map(e=>getComputedStyle(e).transform),
                unscaled:rootMatrix.is2D && rootMatrix.a===1 && rootMatrix.b===0 &&
                    rootMatrix.c===0 && rootMatrix.d===1,
                zoom:getComputedStyle(copy).zoom,
                ids:copy.querySelectorAll('[id],[tabindex],[title]').length,
                sourceText:face.textContent.replace(/\\s+/g,' ').trim(),
                bodyOverflow:document.documentElement.scrollWidth-innerWidth};
        }''', point)
        assert all(a == b for _, a, b in result['counts']), result['counts']
        assert result['ids'] == 0 and result['hidden'] == 0
        assert all(result['visibility']), 'native copy changed label visibility'
        assert result['unscaled'] and result['zoom'] == '1'
        assert all(t == 'none' for t in result['transforms']), result['transforms']
        for expected, actual in result['fonts']:
            assert abs(expected-actual) < .001, (expected, actual)
        for selector, src, dst in result['pairs']:
            for axis in ['x', 'y']:
                assert abs(dst[axis] - (point[axis] + 2.5*(src[axis]-point[axis]))) < .16, (selector, axis, src, dst, point)
            for axis in ['w', 'h']:
                assert abs(dst[axis] - 2.5*src[axis]) < .16, (selector, axis, src, dst)
        assert result['bodyOverflow'] <= 1
        return result

    def matrix():
        p = get_page(); p.set_viewport_size({'width': 1600, 'height': 1100})
        presets = p.evaluate("async()=>(await import('#catalog/presets.js')).PRESETS")
        for key, preset in presets.items():
            for zoom in [.75, 1, 1.25, 1.5, 2]:
                for compact in [False, True]:
                    data = {**original, **{k:v for k,v in preset.items() if k in original},
                            'sides':preset['sides'], 'presetId':key, 'activeSide':'front',
                            'viewMode':'both', 'compactScales':compact, 'magnification':zoom,
                            'cursor':.41, 'slideOffset':.075}
                    apply(data)
                    print(f'  {key}: zoom={zoom}, compact={compact}', flush=True)
                    for index in [0, 1]:
                        pos=enable_hover(index); inspect(pos)
                        report['rendering'].append({'nativeSizeLoupe': True, 'preset':key,
                            'zoom':zoom,'compact':compact,'face':index,'passed':True})
                        if visual and key in ['faber283n','pickettN3','pickettN4','flyingFish1017'] and zoom == 1 and compact:
                            p.locator('.rule-loupe').screenshot(path=shots/f'{key}_{index}_lens.png')
        load()
    check('direct loupe: all presets, both faces and number modes, all five magnifications', matrix)

    def motion_and_clipping():
        p=get_page();p.set_viewport_size({'width':1600,'height':1100})
        apply({**original,'viewMode':'both','magnification':.75,'cursor':.35,'slideOffset':.02})
        pos=enable_hover();inspect(pos)
        p.evaluate('window.retainedDrawing=document.querySelector(".loupe-copy")')
        p.locator('#ruleCanvas').focus()
        for key in ['s','1','ArrowRight','3','ArrowLeft','c','4','ArrowLeft']:
            p.keyboard.press(key);settle();inspect(pos)
        assert p.evaluate('window.retainedDrawing===document.querySelector(".loupe-copy")')
        p.mouse.down();p.mouse.move(pos['x']+25,pos['y'],steps=5);p.mouse.up();settle()
        pos['x']+=25;inspect(pos)
        for width,height in [(320,900),(390,900),(760,280)]:
            p.set_viewport_size({'width':width,'height':height})
            pos=enable_hover();inspect(pos)
            lens=p.locator('.rule-loupe').bounding_box()
            assert abs(lens['width']-min(480,width-16,height-16))<.1
            if visual:p.screenshot(path=shots/f'viewport_{width}_{height}.png')
            p.locator('#ruleViewport').evaluate('e=>e.scrollLeft=100');settle();inspect(pos)
        load()
    check('direct loupe: retained native drawing, real motion, 75% and short/narrow scrolling views', motion_and_clipping)


    def text_and_output_resolution():
        from pathlib import Path
        html = (Path(__file__).resolve().parents[2] / 'dist/index.html').read_text(encoding='utf-8')
        browser = get_page().context.browser
        entry = get_page().url
        native = entry.startswith(('http://', 'https://', 'file://'))
        for dpr in [1, 2]:
            context = browser.new_context(viewport={'width': 1600, 'height': 1100}, device_scale_factor=dpr)
            try:
                p = context.new_page()
                if native:
                    p.goto(entry)
                else:
                    p.set_content(html)
                p.wait_for_function('document.documentElement.dataset.appReady === "true"')
                for zoom in [.75, 1, 2]:
                    p.locator('#magnificationSelect').select_option(str(zoom))
                    for forced in ['none', 'active']:
                        p.emulate_media(forced_colors=forced)
                        point=enable_hover(page=p); inspect(point,page=p)
                        details=p.evaluate('''point=>{
                            const face=document.elementFromPoint(point.x,point.y).closest('.rule-face-body');
                            const copy=document.querySelector('.loupe-copy');
                            const labels=[...face.querySelectorAll('.tick-label,.compact-part')];
                            const output=[...copy.querySelectorAll('.tick-label,.compact-part')];
                            const range=document.createRange();const glyphs=[];
                            for(let i=0;i<labels.length;i++){
                                const a=labels[i],b=output[i];
                                if(a.childNodes.length!==1 || a.firstChild.nodeType!==3 ||
                                    getComputedStyle(a).visibility==='hidden'||getComputedStyle(a).display==='none')continue;
                                const text=b.querySelector(':scope > [data-loupe-text]');if(!text)continue;
                                range.selectNodeContents(a.firstChild);const sr=range.getBoundingClientRect();
                                range.selectNodeContents(text.firstChild);const dr=range.getBoundingClientRect();
                                if(sr.width && sr.height)glyphs.push({label:a.textContent,text:text.textContent,
                                    src:[sr.x,sr.y,sr.width,sr.height],dst:[dr.x,dr.y,dr.width,dr.height]});
                                if(glyphs.length>=40)break;
                            }
                            const ticks=[...face.querySelectorAll('.tick')];
                            const out=[...copy.querySelectorAll('.tick')];
                            const ink=ticks.slice(0,20).map((e,i)=>[getComputedStyle(e).borderLeftColor,
                                getComputedStyle(out[i]).backgroundColor,getComputedStyle(out[i]).forcedColorAdjust]);
                            return {dpr:devicePixelRatio,glyphs,ink};
                        }''',point)
                        assert details['dpr']==dpr
                        assert len(details['glyphs'])>=10
                        for glyph in details['glyphs']:
                            assert glyph['label']==glyph['text']
                            # Real text Range boxes, not the painter's explicitly sized
                            # container boxes. Font hinting can alter metrics slightly.
                            a,b=glyph['src'],glyph['dst']
                            assert abs(b[0]-(point['x']+2.5*(a[0]-point['x'])))<2, glyph
                            assert abs(b[1]-(point['y']+2.5*(a[1]-point['y'])))<2, glyph
                            assert abs(b[2]-2.5*a[2])<2, glyph
                            assert abs(b[3]-2.5*a[3])<3, glyph
                        assert all(a==b and adjust=='none' for a,b,adjust in details['ink']), details['ink']
                        report['rendering'].append({'nativeLoupeGlyphs':True,'mode':'native' if native else 'dom',
                            'dpr':dpr,'zoom':zoom,'forcedColours':forced,'passed':True})
                        if visual:
                            p.locator('.rule-loupe').screenshot(path=shots/f'dpr{dpr}_zoom{zoom}_{forced}.png')
            finally:
                context.close()
    check('direct loupe: real glyph bounds and stroke ink at 1x/2x device resolution and forced colours', text_and_output_resolution)

    def quality_guard_and_export():
        p=get_page();p.set_viewport_size({'width':1600,'height':1100})
        pos=enable_hover();inspect(pos)
        # Prove the native-size guard rejects the old rendering strategy.
        original_transform=p.locator('.loupe-copy').evaluate('e=>e.style.transform')
        p.locator('.loupe-copy').evaluate("e=>e.style.setProperty('transform','scale(2.5)','important')")
        rejected=False
        try:inspect(pos)
        except AssertionError:rejected=True
        assert rejected,'test did not detect a scale-transformed drawing'
        p.locator('.loupe-copy').evaluate("(e,value)=>e.style.setProperty('transform',value,'important')", original_transform)
        inspect(pos)
        text=download('#saveHtmlButton')
        assert 'class="rule-loupe"' not in text and 'data-loupe-text=' not in text
        load(text)
        p=get_page()
        pos=enable_hover();inspect(pos)
        # Fading and wake use the same cached native drawing.
        p.evaluate('window.retainedDrawing=document.querySelector(".loupe-copy")')
        p.wait_for_timeout(4400)
        assert p.locator('.rule-loupe').evaluate('e=>getComputedStyle(e).opacity')=='0'
        p.keyboard.press('Shift');settle()
        assert p.locator('.rule-loupe').evaluate('e=>getComputedStyle(e).opacity')=='1'
        assert p.evaluate('window.retainedDrawing===document.querySelector(".loupe-copy")')
        load()
    check('direct loupe: guard detects scale transform; export and idle/wake keep working', quality_guard_and_export)
    load()
