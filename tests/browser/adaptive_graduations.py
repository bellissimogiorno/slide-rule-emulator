#!/usr/bin/env python3
"""Graduation and interaction verification. Native mode is the default.

Use --mode dom explicitly where navigation is restricted. That mode uses an
opaque-origin document and a storage substitute; it is not native persistence.
Screenshots record actual engraving, never an illustrative redraw.
"""
import argparse
import functools
import http.server
import importlib.metadata
import json
from pathlib import Path
import threading
import time
import traceback
from playwright.sync_api import sync_playwright
from run import STORAGE_SHIM, QuietHandler

ROOT = Path(__file__).resolve().parents[2]
GEOMETRY = (Path(__file__).with_name('geometry.js')).read_text()

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--mode', choices=['native','dom'], default='native')
    parser.add_argument('--executable')
    parser.add_argument('--presets',nargs='*')
    parser.add_argument('--functional',action='store_true')
    parser.add_argument('--zoom-matrix',action='store_true')
    parser.add_argument('--output',type=Path,default=ROOT/'qa/adaptive')
    args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    report={'mode':args.mode,'playwright':importlib.metadata.version('playwright'), 'functional':[], 'rendering':[], 'errors':[]}
    server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(QuietHandler,directory=str(ROOT/'dist')))
    threading.Thread(target=server.serve_forever,daemon=True).start()
    try:
        with sync_playwright() as p:
            browser=p.chromium.launch(executable_path=args.executable,args=['--no-sandbox'])
            report['browser']=browser.version
            context=browser.new_context(viewport={'width':1600,'height':1200},accept_downloads=True)
            page=None
            def fresh():
                nonlocal page
                if page:page.close()
                page=context.new_page();page.set_default_timeout(12000)
                page.on('pageerror', lambda e:report['errors'].append(str(e)))
                if args.mode=='dom':
                    text=(ROOT/'dist/index.html').read_text()
                    page.set_content(text.replace('<head>','<head><script>'+STORAGE_SHIM+'</script>',1))
                else:page.goto(f'http://127.0.0.1:{server.server_port}/index.html')
                page.wait_for_function('document.documentElement.dataset.appReady==="true"')
                settle()
            def settle():
                page.evaluate('async()=>{await document.fonts.ready; await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(r))));}')
            def state():return page.evaluate("async()=>(await import('#main.js')).application.getProgram()")
            def apply(data):
                page.locator('#jsonEditor').fill(json.dumps(data));page.locator('#applyJsonButton').click();settle()
                assert page.locator('#jsonStatus').inner_text()=='JSON applied.'
            def preset(key,width=1600,zoom=1,compact=True,mode='adaptive',detail='balanced'):
                page.set_viewport_size({'width':width,'height':1200})
                data=page.evaluate("async k=>{const {PRESETS}=await import('#catalog/presets.js');const {DEFAULT_STATE}=await import('#catalog/defaults.js');return {...DEFAULT_STATE,...PRESETS[k],presetId:k,customScales:[]};}",key)
                data.update(viewMode='both',activeSide='front',magnification=zoom,compactScales=compact,graduationMode=mode,adaptiveSpacing=detail)
                apply(data)
            def check(name,fn):
                t=time.monotonic();print(name,flush=True);fn()
                report['functional'].append({'name':name,'passed':True,'seconds':round(time.monotonic()-t,3)})
                (args.output/'results.json').write_text(json.dumps(report,indent=2)+'\n')
            fresh()
            if args.functional:
                def selection():
                    assert state()['graduationMode']=='conventional'
                    page.select_option('#graduationModeSelect','adaptive');settle()
                    assert state()['graduationMode']=='adaptive'
                    assert page.locator('#logGraduationsSelect').is_disabled()
                    assert page.locator('#logGraduationsSelect').is_hidden()
                    assert page.locator('#adaptiveSpacingSelect').is_visible()
                    assert page.locator('#adaptiveSpacingSelect').is_enabled()
                    page.select_option('#adaptiveSpacingSelect','clear');settle()
                    assert state()['adaptiveSpacing']=='clear'
                    page.select_option('#presetSelect','pickettN3');page.click('#loadPresetButton');settle()
                    assert state()['graduationMode']=='adaptive' and state()['adaptiveSpacing']=='clear'
                    page.select_option('#graduationModeSelect','conventional');settle()
                    assert page.locator('#adaptiveSpacingSelect').is_disabled()
                    assert page.locator('#adaptiveSpacingSelect').is_hidden()
                    assert page.locator('#logGraduationsSelect').is_visible()
                    assert not page.locator('#logGraduationsSelect').is_disabled()
                check('mode, detail and conventional controls are explicit and persist across presets',selection)
                def zoom_and_motion():
                    preset('faber283n')
                    page.evaluate('window.originalTick=document.querySelector(".tick")')
                    page.locator('#ruleCanvas').focus();page.keyboard.press('ArrowRight');page.keyboard.press('Shift+ArrowRight');settle()
                    assert page.evaluate('window.originalTick===document.querySelector(".tick")')
                    assert abs(state()['cursor']-.501)<1e-12 and abs(state()['slideOffset']-.001)<1e-12
                    page.select_option('#magnificationSelect','2');settle()
                    assert page.evaluate('window.originalTick!==document.querySelector(".tick")'), 'zoom failed to regraduate'
                    page.evaluate('window.zoomTick=document.querySelector(".tick")')
                    page.evaluate('document.querySelector("#ruleViewport").scrollLeft=200');settle()
                    assert page.evaluate('window.zoomTick===document.querySelector(".tick")'), 'scroll regraduated'
                    page.locator('#ruleCanvas').focus();page.keyboard.press('ArrowRight');settle()
                    assert page.evaluate('window.zoomTick===document.querySelector(".tick")')
                check('zoom regraduates; slide, cursor and scrolling do not rebuild or flicker',zoom_and_motion)
                def endpoint_help_and_loupe():
                    preset('faber283n')
                    assert page.locator('.scale-row[title]').count()==0
                    row=page.locator('[data-scale="W1"]');assert row.locator('.scale-name[title]').count()==1
                    source=row.locator('.tick').count()
                    page.locator('#loupeButton').click()
                    page.locator('.rule-face-body').last.scroll_into_view_if_needed()
                    r=row.locator('.tick-pane').bounding_box();page.mouse.move(r['x']+.35*r['width'],r['y']+.5*r['height']);settle()
                    assert page.locator('.rule-loupe').is_visible()
                    copied=page.locator('.rule-loupe [data-scale="W1"] .tick').count()
                    assert copied==source,(copied,source)
                    page.keyboard.press('Escape');settle()
                check('scale-end help remains local; direct loupe preserves the chosen graduation set',endpoint_help_and_loupe)
                def exports():
                    preset('pickettN3',detail='fine')
                    with page.expect_download() as downloaded:page.click('#exportJsonButton')
                    data=json.loads(Path(downloaded.value.path()).read_text());assert data['graduationMode']=='adaptive';assert data['adaptiveSpacing']=='fine'
                    page.locator('#jsonEditor').fill('{bad draft');page.select_option('#adaptiveSpacingSelect','clear');settle()
                    assert page.locator('#jsonEditor').input_value()=='{bad draft'
                    with page.expect_download() as downloaded:page.click('#saveHtmlButton')
                    html=Path(downloaded.value.path()).read_text()
                    if args.mode=='dom':
                        page.close();fresh()
                        # Fresh document avoids changing a registered import map.
                        copy=context.new_page();copy.set_content(html.replace('<head>','<head><script>'+STORAGE_SHIM+'</script>',1));copy.wait_for_function('document.documentElement.dataset.appReady==="true"')
                        saved=copy.evaluate("async()=>(await import('#main.js')).application.getProgram()")
                        assert saved['graduationMode']=='adaptive' and saved['adaptiveSpacing']=='clear'
                        copy.close()
                check('JSON and standalone exports retain choices without overwriting drafts',exports)
                def measure_density():
                    counts=[]
                    for density in ['clear','balanced','fine']:
                        preset('faber283n',detail=density)
                        counts.append(page.locator('.scale-row[data-scale="P"] .tick').count())
                    assert counts==sorted(counts) and len(set(counts))>1,counts
                    # The explicit 10-inch choice preserves historical W even at 75%.
                    preset('faber283n',mode='conventional',zoom=.75)
                    page.select_option('#logGraduationsSelect','standard');settle()
                    for value in [1.005,1.115,2.01]:
                        found=page.locator('[data-scale="W1"] .tick').evaluate_all('(els,x)=>els.some(e=>Math.abs(Number(e.dataset.pos)-2*Math.log10(x))<1e-6)',value)
                        assert found,value
                check('detail settings change density; documented W fine marks remain in conventional mode',measure_density)
                def appearance_controls():
                    for width in [390, 1600]:
                        for theme in ['light', 'dark', 'solarised']:
                            preset('faber283n', width=width)
                            page.locator(f'button[data-page-theme="{theme}"]').click();settle()
                            grid=page.locator('.appearance-grid')
                            grid.scroll_into_view_if_needed();settle()
                            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
                            for selector in ['#graduationModeSelect','#adaptiveSpacingSelect']:
                                box=page.locator(selector).bounding_box()
                                assert box['width']>90 and box['height']>=24,box
                                assert box['x']>=0 and box['x']+box['width']<=width+1,box
                            grid.screenshot(path=args.output/f'controls_{width}_{theme}.png')
                    page.locator('button[data-page-theme="light"]').click();settle()
                check('adaptive controls stay readable and within the page in all three themes',appearance_controls)
            keys=args.presets if args.presets is not None else page.evaluate("async()=>Object.keys((await import('#catalog/presets.js')).PRESETS)")
            for key in keys:
                fresh()
                for width in [390,1100,1800]:
                    for compact in [True,False]:
                        print(key,width,compact,flush=True)
                        preset(key,width=width,compact=compact)
                        # Ensure geometry is fully settled after style/width changes.
                        g=page.evaluate(GEOMETRY)
                        assert not any(g[k] for k in ['collisions','tickCrossings','clipped','emptyRows']),g
                        assert g['bodyOverflow']<=1,g
                        report['rendering'].append({'preset':key,'width':width,'compact':compact,'passed':True,'labels':g['labels'],'ticks':g['ticks']})
                        (args.output/'results.json').write_text(json.dumps(report,indent=2)+'\n')
                        if width==1800 or (key in ['faber283n','pickettN3','thorntonAA010'] and width==390):
                            page.locator('#ruleCanvas').screenshot(path=args.output/f'{key}_{width}_{"compact" if compact else "normal"}.png')
                # All five magnifications plus all detail choices are verified
                # for a representative continuous/nonlinear/expanded layout.
                if key=='faber283n' and args.zoom_matrix:
                    for zoom in [.75,1,1.25,1.5,2]:
                        for detail in ['clear','balanced','fine']:
                            print('zoom',zoom,detail,flush=True)
                            preset(key,zoom=zoom,detail=detail)
                            g=page.evaluate(GEOMETRY)
                            assert not any(g[k] for k in ['collisions','tickCrossings','clipped','emptyRows']),g
                            report['rendering'].append({'preset':key,'zoom':zoom,'detail':detail,'passed':True,'ticks':g['ticks']})
                            (args.output/'results.json').write_text(json.dumps(report,indent=2)+'\n')
            assert not report['errors'],report['errors']
            browser.close()
    except Exception as exc:
        report['failure']=str(exc);report['traceback']=traceback.format_exc()
        print(report['traceback'],flush=True)
    finally:
        server.shutdown();server.server_close()
        (args.output/'results.json').write_text(json.dumps(report,indent=2)+'\n')
    if report.get('failure'):raise SystemExit(1)
    print('Passed:',len(report['functional']),'functional;',len(report['rendering']),'rendering',flush=True)

if __name__=='__main__':main()
