"""Regressions for draft ownership, retained readouts and the 2/82N preset.

Use --suite reaudit for just the targeted continuation checks. Native and DOM
modes are explicit in the parent runner; neither implies the other was tested.
"""
import json


def run_reaudit(get_page, state, apply, settle, check, load, download,
                visual, output, report, geometry_source):
    load()
    shots = output / 'reaudit'
    shots.mkdir(parents=True, exist_ok=True)

    def retained_readouts():
        p = get_page()
        p.evaluate("window.originalCard=document.querySelector('.readout-card'); window.originalTick=document.querySelector('.tick')")
        p.locator('#cursorRange').focus()
        for _ in range(5): p.keyboard.press('ArrowRight')
        settle()
        assert p.evaluate("originalCard===document.querySelector('.readout-card')"), 'motion replaced readout cards'
        assert p.evaluate("originalTick===document.querySelector('.tick')"), 'motion replaced ticks'
        comparisons = p.evaluate("""async()=>{
            const {createReadoutView}=await import('#ui/readout-view.js');
            const {renderReadout}=await import('#ui/readout.js');
            const {BUILTIN_SCALES}=await import('#catalog/scales.js');
            const {PRESETS}=await import('#catalog/presets.js');
            const actual=document.createElement('div'), expected=document.createElement('div');
            const view=createReadoutView(actual);
            const norm=e=>[e.textContent,[...e.querySelectorAll('.readout-card')].map(c=>[c.dataset.readoutScale,[...c.classList].sort()])];
            let count=0;
            for(const preset of Object.values(PRESETS)) for(const cursor of [.001,.45,.999]) for(const slideOffset of [-.2,0,.35]){
                const s={...preset,viewMode:'both',activeSide:'front',cursor,slideOffset};
                view.update(s,BUILTIN_SCALES); expected.innerHTML=renderReadout(s,BUILTIN_SCALES);
                if(JSON.stringify(norm(actual))!==JSON.stringify(norm(expected)))throw Error('Readout mismatch: '+preset.name);
                count++;
            }
            return count;
        }""")
        preset_count = p.evaluate("async()=>Object.keys((await import('#catalog/presets.js')).PRESETS).length")
        assert comparisons == preset_count * 3 * 3
        report['retainedReadoutComparisons'] = comparisons
    check('motion retains readout and graduation nodes; incremental values match fresh rendering', retained_readouts)

    def interrupted_drag():
        p = get_page()
        p.locator('#ruleCanvas').scroll_into_view_if_needed()
        box = p.locator('.slide-rail .tick-pane').first.bounding_box()
        x,y = box['x']+.2*box['width'], box['y']+.5*box['height']
        p.mouse.move(x,y); p.mouse.down(); p.mouse.move(x+30,y); settle()
        before=state()['slideOffset']
        p.evaluate("window.dispatchEvent(new Event('blur'))")
        p.mouse.move(x+110,y); p.mouse.up(); settle()
        assert state()['slideOffset'] == before, 'drag continued after blur'
        assert not p.locator('#ruleCanvas').evaluate("e=>e.classList.contains('is-dragging')")
        p.locator('#ruleCanvas').focus(); p.keyboard.press('ArrowRight'); settle()
        assert state()['slideOffset'] > before, 'stale drag still blocks keyboard'
    check('window focus loss ends captured dragging and restores keyboard control', interrupted_drag)

    def delayed_imports():
        load(); p=get_page(); baseline=state()
        p.evaluate("""()=>{window.NativeFileReader=window.FileReader;window.requests=[];
            window.FileReader=class {readyState=0;readAsText(file){this.readyState=1;requests.push(this);}
                abort(){this.readyState=2;this.aborted=true;}
                finish(text){this.readyState=2;this.result=text;this.onload?.();}};
        }""")
        def start():
            p.locator('#importJsonFile').set_input_files({'name':'delayed.json','mimeType':'application/json','buffer':b'{}'})
        def finish(index, data): p.evaluate('([i,s])=>requests[i].finish(s)',[index,json.dumps(data)])
        imported={**baseline,'modelLabel':'delayed import'}
        start()
        draft=json.dumps({**baseline,'modelLabel':'newer draft'})
        p.locator('#jsonEditor').fill(draft)
        finish(0,imported); settle()
        assert p.locator('#jsonEditor').input_value()==draft
        assert state()==baseline
        assert 'discarded' in p.locator('#jsonStatus').inner_text()
        apply(baseline)
        start(); start()
        assert p.evaluate('requests[1].aborted')
        finish(1, imported); settle(); assert state()==baseline
        finish(2,{**baseline,'modelLabel':'newest import'}); settle()
        assert state()['modelLabel']=='newest import'
        start()
        p.locator('#bothSidesButton').click(); settle(); newest=state()
        finish(3,imported); settle(); assert state()==newest
        start()
        p.evaluate("async()=>(await import('#main.js')).application.destroy()")
        finish(4,imported); settle(); assert state()==newest
        p.evaluate('() => { window.FileReader=NativeFileReader; }'); load()
    check('delayed imports cannot overwrite a newer draft, import, programme or destroyed application', delayed_imports)

    def faber_preset():
        p=get_page()
        p.set_viewport_size({'width':1600,'height':1100})
        p.locator('#presetSelect').select_option('faber282n')
        p.locator('#loadPresetButton').click(); settle()
        p.locator('#bothSidesButton').click(); settle()
        assert state()['presetId']=='faber282n'
        assert p.locator('.scale-row').count()==27
        for id in ['FC282_T1','FC282_T2','FC282_S','FC282_SP']:
            row=p.locator(f'.scale-row[data-scale="{id}"]')
            assert row.locator('.syncro-baseline').count()==1
            assert row.locator('.syncro-number.negative').count()>4
        text=download('#saveHtmlButton'); expected=state(); load(text)
        assert state()==expected
        assert get_page().locator('.scale-row').count()==27
    check('Faber-Castell 2/82N loads its 27-row N-model arrangement and survives standalone export', faber_preset)

    def faber_matrix():
        p=get_page(); baseline=state()
        for width in [390,1100,1600]:
            p.set_viewport_size({'width':width,'height':1100})
            for theme in ['light','dark','solarised']:
                p.locator(f'#pageThemes [data-page-theme="{theme}"]').click(); settle()
                for compact in [True,False]:
                    apply({**baseline,'compactScales':compact})
                    g=p.evaluate(geometry_source)
                    failures={k:g[k] for k in ['collisions','tickCrossings','clipped','smallLabels','emptyRows','bodyOverflow'] if g[k]}
                    report['rendering'].append({'preset':'faber282n','width':width,'theme':theme,'compact':compact,'view':'both','passed':not failures,'failures':failures})
                    assert not failures,failures
                    if visual:
                        p.locator('#ruleViewport').screenshot(path=shots/f'faber282n_{width}_{theme}_{compact}.png')
        p.set_viewport_size({'width':1600,'height':1100})
    check('2/82N both faces in all page themes, numbering modes and three widths', faber_matrix)
    load()
