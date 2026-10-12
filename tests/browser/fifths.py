"""Fifth-root and shared-power checks in the runner's explicit browser mode."""
import json
import math
from pickett_roots import ROOT_GEOMETRY

PAIR_GEOMETRY = r"""() => {
    const failures=[], pairs=[];
    for(const row of document.querySelectorAll('#ruleCanvas [data-scale="F5_PAIR"]')) {
        const track=row.querySelector('.syncro-track'), spine=track?.querySelector('.syncro-baseline');
        const ticks=[...row.querySelectorAll('.syncro-tick')];
        const fail=reason=>failures.push({rail:row.dataset.rail,reason});
        if(!spine || track.querySelectorAll('.syncro-baseline').length!==1) {fail('not one spine');continue;}
        if(row.querySelector('.tick-layer,.baseline') || !ticks.length)fail('separate rows or missing ticks');
        if(new Set(ticks.map(t=>t.dataset.pos)).size!==ticks.length)fail('duplicate tick positions');
        const y=spine.getBoundingClientRect().top;
        for(const t of ticks) {
            const r=t.getBoundingClientRect();
            if(Math.abs((r.top+r.bottom)/2-y)>.6) {fail('tick not centred on spine');break;}
        }
        for(const side of ['positive','negative']) {
            const labels=[...row.querySelectorAll('.syncro-number.'+side)].filter(e=>getComputedStyle(e).visibility!=='hidden');
            if(labels.length<5)fail('too few visible '+side+' numbers');
            for(const e of labels) {
                const r=e.getBoundingClientRect();
                if(side==='positive' ? r.bottom>y+.6 : r.top<y-.6)fail('number crosses spine');
            }
        }
        pairs.push({rail:row.dataset.rail,ticks:ticks.length,height:row.getBoundingClientRect().height});
    }
    return {failures,pairs};
}"""


def run_fifths(get_page, state, apply, settle, check, load, download,
               visual, output, report, geometry_source):
    load()
    shots = output / 'fifths'
    if visual:
        shots.mkdir(parents=True, exist_ok=True)

    def select(both=False):
        p = get_page()
        p.set_viewport_size({'width': 1600, 'height': 1200})
        p.locator('#presetSelect').select_option('fifths')
        p.locator('#loadPresetButton').click()
        p.locator('#sideSelect').select_option('' if both else 'front')
        settle()
        return p

    def geometry():
        roots = get_page().evaluate(ROOT_GEOMETRY)
        pairs = get_page().evaluate(PAIR_GEOMETRY)
        assert not roots['failures'], roots
        assert not pairs['failures'], pairs
        return roots, pairs

    def selection():
        p = select(True)
        assert p.locator('#ruleCanvas .root-stack-5').count() == 2
        assert p.locator('#ruleCanvas [data-scale="F5_PAIR"]').count() == 2
        roots, pairs = geometry()
        assert sum(b['branches'] for b in roots['banks']) == 15
        assert len(pairs['pairs']) == 2
        assert p.locator('#sideSelect').input_value() == ''
    check('fifths: selectable preset, complete banks and shared-power rows', selection)

    def negative_controls():
        p = get_page()
        p.locator('#ruleCanvas .root-stack-5 .root-spine').first.evaluate("e=>{const c=e.cloneNode();c.id='bad-root-spine';e.after(c)}")
        assert p.evaluate(ROOT_GEOMETRY)['failures']
        p.locator('#bad-root-spine').evaluate('e=>e.remove()')
        p.locator('#ruleCanvas [data-scale="F5_PAIR"] .syncro-tick').first.evaluate("e=>{const c=e.cloneNode();c.id='bad-pair-tick';e.after(c)}")
        assert p.evaluate(PAIR_GEOMETRY)['failures']
        p.locator('#bad-pair-tick').evaluate('e=>e.remove()')
        geometry()
    check('fifths: duplicate-spine and duplicate-tick detector negative controls', negative_controls)

    def readouts():
        p = select(True)
        data = state()
        data.update(cursor=math.log10(3.2), slideOffset=math.log10(3.2)-math.log10(2))
        apply(data)
        for face, x in [('front', 3.2), ('back', 2)]:
            face_readout = p.locator(f'.readout-face[data-readout-side="{face}"]')
            values = face_readout.locator('[data-readout-scale="PICKETT_FIFTH_ROOT"] .value > span').all_inner_texts()
            assert len(values) == 5, values
            for j, text in enumerate(values):
                assert abs(float(text.split(':')[1])-(10**j*x)**.2) < 5.1e-6, (j, text, x)
            power = face_readout.locator('[data-readout-scale="F5_PAIR"] .value > span').all_inner_texts()
            assert abs(float(power[0].split(':')[1])-x**5) < x**5*5e-6
            assert abs(float(power[1].split(':')[1])-x**-5) < x**-5*5e-6
        data.update(cursor=0, slideOffset=0); apply(data)
        assert p.locator('[data-readout-scale="F5_PAIR"] .value').first.inner_text() == 'x\u2075: 1\nx\u207b\u2075: 1'
        data.update(cursor=1); apply(data)
        assert 'x\u207b\u2075: 1e-5' in p.locator('[data-readout-scale="F5_PAIR"] .value').first.inner_text()
        data.update(cursor=.1, slideOffset=.3); apply(data)
        assert p.locator('.readout-face[data-readout-side="back"] [data-readout-scale="PICKETT_FIFTH_ROOT"] .value').inner_text().count('off scale') == 5
        assert p.locator('.readout-face[data-readout-side="back"] [data-readout-scale="F5_PAIR"] .value').inner_text().count('off scale') == 2
    check('fifths: fixed/moving readings, five roots, reciprocal endpoints and off-scale behaviour', readouts)

    def motion():
        p = select(True)
        data = state(); data.update(cursor=.5, slideOffset=0); apply(data)
        p.evaluate("window.retainedFifthTick=document.querySelector('.root-stack-5 .tick');window.retainedFifthCard=document.querySelector('[data-readout-scale=F5_PAIR]')")
        p.locator('#ruleCanvas').focus()
        for key in ['2', 's', 'ArrowRight', 'c', 'ArrowLeft']: p.keyboard.press(key)
        settle()
        assert abs(state()['slideOffset']-.001) < 1e-12
        assert abs(state()['cursor']-.499) < 1e-12
        assert p.evaluate("retainedFifthTick===document.querySelector('.root-stack-5 .tick') && retainedFifthCard===document.querySelector('[data-readout-scale=F5_PAIR]')")
        transforms=p.locator('#ruleCanvas [data-scale="PICKETT_FIFTH_ROOT"] .root-stack-track').evaluate_all("els=>els.map(e=>getComputedStyle(e).transform)")
        assert transforms[0] != transforms[1], transforms
        geometry()
    check('fifths: linked faces and fine keyboard motion retain graduation/readout nodes', motion)

    def editing():
        p = select()
        initial = state()
        rail = lambda name: p.locator(f'.rail-editor[data-rail="{name}"]')
        rail('topStator').locator('[data-action="down"]').click(); settle()
        assert state()['sides']['front']['slide'][0] == 'PICKETT_FIFTH_ROOT'
        assert p.locator('#ruleCanvas .slide-rail .root-stack-5').count() == 1
        geometry()
        rail('topStator').locator('[data-action="undo"]').click(); settle()
        assert state()['sides'] == initial['sides']
        rail('topStator').locator('[data-action="remove"]').click(); settle()
        assert p.locator('#ruleCanvas .root-stack-5').count() == 0
        rail('topStator').locator('[data-action="undo"]').click(); settle()
        assert state()['sides'] == initial['sides']
        grip = rail('topStator').locator('.scale-grip').first
        rail('slide').scroll_into_view_if_needed()
        p.locator('#railEditors').evaluate('async e=>{await Promise.all(e.getAnimations({subtree:true}).map(a=>a.finished.catch(()=>{})))}')
        a=grip.bounding_box(); b=rail('slide').bounding_box()
        assert 0 < a['y'] < p.viewport_size['height'] and b['y']+b['height']*.8 < p.viewport_size['height'], (a,b)
        p.mouse.move(a['x']+a['width']/2, a['y']+a['height']/2); p.mouse.down()
        p.mouse.move(b['x']+40,b['y']+b['height']*.8,steps=8); p.mouse.up(); settle()
        assert 'PICKETT_FIFTH_ROOT' in state()['sides']['front']['slide']
        geometry()
        rail('topStator').locator('[data-action="undo"]').click(); settle()
        assert state()['sides'] == initial['sides']
    check('fifths: bank drag, cross-rail arrows, removal and undo', editing)

    def exports():
        select(True)
        expected = state()
        assert json.loads(download('#exportJsonButton')) == expected
        text = download('#saveHtmlButton'); load(text)
        assert state() == expected
        geometry()
        assert get_page().locator('#ruleCanvas .root-stack-5').count() == 2
        assert get_page().locator('#ruleCanvas [data-scale="F5_PAIR"]').count() == 2
        load()
    check('fifths: JSON and configured standalone export preserve the new definitions', exports)

    def matrix():
        p = select(True); original = state(); total = 0
        for width in [390, 1100, 1600]:
            p.set_viewport_size({'width':width,'height':1200})
            for finish in ['pickett-white','pickett-es']:
                for compact in [False, True]:
                    theme = ['light','dark','solarised'][total % 3]
                    p.locator(f'#pageThemes [data-page-theme="{theme}"]').click()
                    for zoom in [.75, 1, 1.25, 1.5, 2]:
                        print(f'  checking {width}px {finish}, compact={compact}, zoom={zoom}',flush=True)
                        apply({**original, 'cursor':.5, 'slideOffset':0, 'compactScales':compact,
                               'magnification':zoom,'theme':finish})
                        geometry()
                        measured = p.evaluate(geometry_source)
                        failures = {k:v for k,v in measured.items() if k in
                                    ['collisions','tickCrossings','clipped','smallLabels','emptyRows','bodyOverflow'] and v}
                        assert not failures, (width,finish,compact,zoom,failures)
                        assert p.locator('#ruleCanvas .root-stack-5[title], #ruleCanvas .paired-product-scale[title]').count() == 0
                        for face in ['front','back']:
                            report['rendering'].append({'preset':'fifths','face':face,'width':width,
                                'finish':finish,'compact':compact,'zoom':zoom,'pageTheme':theme,'passed':True})
                        total += 1
                        if visual and zoom == 1:
                            p.locator('#ruleViewport').screenshot(path=shots/f'{width}_{finish}_{compact}_both.png')
                    print(f'  fifths: {width}px {finish}, compact={compact}',flush=True)
        report['fifthsCombinedViews'] = total
        p.set_viewport_size({'width':1600,'height':1200}); apply(original)
    check('fifths: all magnifications, both number modes/finishes and responsive geometry', matrix)

    def loupe():
        p = select(True); original=state()
        for compact in [False, True]:
            for zoom in [.75,1,2]:
                for face in [0, 1]:
                    apply({**original,'compactScales':compact,'magnification':zoom,'cursor':.4,'slideOffset':.035})
                    if p.locator('#loupeButton').get_attribute('aria-pressed') != 'true': p.locator('#loupeButton').click()
                    row=p.locator('#ruleCanvas [data-scale="PICKETT_FIFTH_ROOT"]').nth(face)
                    row.scroll_into_view_if_needed()
                    point=row.evaluate('''row=>{const r=row.querySelector('.tick-pane').getBoundingClientRect();const v=document.getElementById('ruleViewport').getBoundingClientRect();return {x:Math.min(v.right-20,r.x+r.width*.4),y:r.y+r.height*.55}}''')
                    point['face'] = face
                    p.mouse.move(point['x']+.5,point['y']);p.mouse.move(point['x'],point['y']);settle()
                    assert p.locator('.rule-loupe').is_visible()
                    result=p.evaluate('''point=>{
                        const source=document.querySelectorAll('#ruleCanvas .rule-face-body')[point.face],copy=document.querySelector('.loupe-copy'),sample=[];
                        for(const selector of ['.root-spine','.root-branch','.syncro-tick','.syncro-number','.cursor']){
                            const a=[...source.querySelectorAll(selector)],b=[...copy.querySelectorAll(selector)];
                            if(a.length!==b.length)throw Error('missing loupe parts '+selector);
                            for(let i=0;i<a.length;i+=Math.max(1,Math.floor(a.length/10))){
                                const x=a[i].getBoundingClientRect(),y=b[i].getBoundingClientRect();
                                sample.push([selector,y.x-(point.x+2.5*(x.x-point.x)),y.y-(point.y+2.5*(x.y-point.y)),y.width-2.5*x.width,y.height-2.5*x.height]);
                            }
                        }
                        return {sample,transform:getComputedStyle(copy).transform,spines:copy.querySelectorAll('.root-spine').length};
                    }''',point)
                    assert result['transform'] == 'none' and result['spines'] == (2 if face == 0 else 4)
                    for entry in result['sample']: assert max(abs(x) for x in entry[1:]) < .17, entry
                    report['rendering'].append({'fifthsDirectLoupe':True,'compact':compact,'zoom':zoom,'face':face,'passed':True})
                    if visual and zoom == 1: p.locator('.rule-loupe').screenshot(path=shots/f'loupe_{face}_{compact}.png')
                    p.locator('#loupeButton').click()
        load()
    check('fifths: direct-size loupe keeps spines, branches and reciprocal ticks aligned', loupe)
    load()
