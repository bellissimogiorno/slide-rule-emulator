import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_SCALES as S } from '#catalog/scales.js';
import { PRESETS } from '#catalog/presets.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { formatSexagesimal } from '#core/sexagesimal.js';
import { formatValue } from '#core/format.js';
import { scaleReadings } from '#ui/readout-values.js';
import { validateProgram } from '#model/validation.js';

const rt = id => makeRuntimeScale(S[id]);
const close = (a, b, message = '') => assert.ok(Math.abs(a-b) <= 2e-10 * Math.max(1, Math.abs(a), Math.abs(b)), `${message}: ${a} != ${b}`);
const rows = side => [...side.topStator, ...side.slide, ...side.bottomStator];
test('UltraLog follows all 40 published rows without paired or stacked replacements', () => {
    const p = PRESETS.ultralog;
    assert.deepEqual(rows(p.sides.front), ['LL00','LL01','LL02','LL03','DF','CF','CIF','SH1','SH2','CH','TH','LN','L','CI','C','D','LL3','LL2','LL1','LL0'].map(x => 'UL_'+x));
    assert.deepEqual(rows(p.sides.back), ['CONST','R1','R2','K','A','B','T1','T2','ST','S','P','H1','H2','CI','C','D','DI','Q1','Q2','Q3'].map(x => 'UL_'+x));
    for (const side of Object.values(p.sides)) {
        assert.equal(side.topStator.length, 5); assert.equal(side.slide.length, 10); assert.equal(side.bottomStator.length, 5);
        for (const id of rows(side)) assert.ok(!S[id].layers && S[id].pairedSum === undefined && S[id].pairedProduct === undefined);
    }
});
test('Graphoplex 690A uses the supplied photograph: two 4/5/4-row faces', () => {
    const p = PRESETS.graphoplex690a;
    assert.deepEqual(p.sides.front.topStator, ['GP_LL00','GP_L','GP690_T2','GP_A']);
    assert.deepEqual(p.sides.front.slide, ['GP_B','GP690_T1','GP690_ST','GP690_S','GP_C']);
    assert.deepEqual(p.sides.front.bottomStator, ['GP_D','GP_P','GP_DI','GP_LL0']);
    assert.deepEqual(rows(p.sides.back), ['LL01','LL02','LL03','DF','CF','CIF','K','CI','C','D','LL3','LL2','LL1'].map(x=>'GP_'+x));
});
test('Graphoplex 691A preserves photographed Ch and Sh2-before-Sh1, not the catalogue omissions', () => {
    const p=PRESETS.graphoplex691a;
    assert.deepEqual(p.sides.front.topStator,['GP_L','GP_P','GP_CH','GP_A']);
    assert.deepEqual(p.sides.front.slide,['GP_B','GP691_T1','GP691_ST','GP691_S','GP_C']);
    assert.deepEqual(p.sides.front.bottomStator,['GP_D','GP_TH','GP_SH2','GP_SH1']);
    // The scale arrangement is shared; a sourced housing width for one model
    // is not evidence for imposing that measurement on the other cursor.
    for (const key of ['name', 'topStator', 'slide', 'bottomStator'])
        assert.deepEqual(p.sides.back[key], PRESETS.graphoplex690a.sides.back[key]);
    assert.ok(!rows(p.sides.front).some(x=>['GP_LL0','GP_LL00','GP690_T2','GP_DI'].includes(x)));
});
for (const id of ['ultralog','graphoplex690a','graphoplex691a']) test(`${id}: full programme and independent custom-scale export validate`, () => {
    validateProgram({...PRESETS[id],customScales:[]});
    const keys=new Set(Object.values(PRESETS[id].sides).flatMap(rows));
    const customScales=[...keys].map(key => JSON.parse(JSON.stringify(S[key])));
    validateProgram({...PRESETS[id],customScales});
});
test('UltraLog constants explicitly disclose their supplied status, have exact values and nonchemical readouts', () => {
    const d=S.UL_CONST;
    assert.equal(d.referenceOnly,true); assert.match(d.description,/Emulator-supplied/); assert.match(d.description,/could not be verified/);
    assert.equal(d.ticks.length,8);
    for (const mark of d.ticks) {
        close(mark.value,mark.mass);assert.ok(mark.title.includes('=') && mark.title.length<=240);
        const read=scaleReadings(d,rt('UL_CONST').pos(mark.value),S);
        assert.ok(read.texts[0].includes(mark.label));assert.ok(!read.texts[0].includes('undefined'));
    }
    close(d.ticks.find(x=>x.label==='c').value,Math.sqrt(4/Math.PI));
});
for (const [value, expected] of [[0,'0\u00b0'],[35.5,'35\u00b030\u2032'],[5+50/60,'5\u00b050\u2032'],
    [89+20/60,'89\u00b020\u2032'],[1/120,'0\u00b00\u203230\u2033'],[12+59/60+59.999/3600,'13\u00b0'],
    [-1.25,'\u22121\u00b015\u2032'],[-0,'0\u00b0'],[NaN,'--']]) {
    test(`Sexagesimal captions carry correctly: ${String(value)}`,()=>assert.equal(formatSexagesimal(value),expected));
}
test('Graphoplex degree/minute captions never read decimal minutes as hundredths of a degree', () => {
    for(const id of ['GP690_S','GP690_T1','GP690_T2','GP690_ST']) {
        assert.equal(S[id].angleNotation,'sexagesimal');
        const ticks=generateTicks(S[id],rt(id),1800);
        for(const t of ticks.filter(x=>x.label)) {
            assert.equal(t.positiveLabel, formatSexagesimal(t.value));
            assert.equal(t.negativeLabel, formatSexagesimal(90-t.value));
        }
    }
    const t=generateTicks(S.GP690_ST,rt('GP690_ST'),1800).find(t=>Math.abs(t.value-2/3)<1e-12);
    assert.equal(t.positiveLabel,'0\u00b040\u2032'); assert.equal(t.negativeLabel,'89\u00b020\u2032');
    assert.equal(formatValue(35.5,S.GP690_S),'35\u00b030\u2032');
    assert.equal(formatValue(35.5,S.GP691_S),'35.5\u00b0');
});
test('Sexagesimal metadata validation rejects nonangular and contradictory inputs', () => {
    for (const d of [{...S.GP_C,angleNotation:'sexagesimal'}, {...S.GP690_S,angleNotation:'bogus'}, {...S.GP690_S,unit:'rad'}])
        assert.throws(()=>validateProgram({sides:{front:{topStator:[d.id],slide:[],bottomStator:[]}},customScales:[d]}),/angleNotation/);
});
test('Graphoplex primary trig and complementary captions agree with independent identities at 501 positions', () => {
    for(const id of ['GP690_S','GP690_T1','GP690_T2','GP691_S','GP691_T1']) for(let i=0;i<=500;i++) {
        const p=i/500, a=rt(id).value(p), d=10**p, rad=a*Math.PI/180;
        if(id.endsWith('_S')) close(Math.sin(rad),d/10,id);
        else close(Math.tan(rad),d/(id.endsWith('T2')?1:10),id);
        close(rt(id).pos(a),p,id);close(a+(S[id].pairedSum-a),90,id);
    }
});
test('Graphoplex ST is explicitly a radian approximation, independent of sine and tangent rounding', () => {
    for(const id of ['GP690_ST','GP691_ST']) for(let i=0;i<=100;i++) {
        const p=i/100, a=rt(id).value(p);
        close(a*Math.PI/180,10**p/100,id); close(rt(id).pos(a),p,id);
    }
});
test('Graphoplex manual examples: sin 35, tan 27 and tan 80 degrees 30 minutes', () => {
    close(10**rt('GP690_S').pos(35)/10, Math.sin(35*Math.PI/180));
    close(10**rt('GP690_T1').pos(27)/10, Math.tan(27*Math.PI/180));
    const p=rt('GP690_T2').pos(80.5);
    close(10**p,Math.tan(80.5*Math.PI/180));
    assert.equal(formatValue(rt('GP690_T2').value(p),S.GP690_T2),'80\u00b030\u2032');
});
test('Graphoplex and UltraLog log-log ranges are natural exponentials, not base ten', () => {
    for(const prefix of ['GP_','UL_']) for(let n=0;n<4;n++) for(let i=0;i<=100;i++) {
        const p=i/100, a=rt(prefix+'LL'+n).value(p), b=rt(prefix+'LL0'+(n||'0')).value(p);
        close(Math.log(a),10**(p+n-3));close(a*b,1);
    }
});
test('Graphoplex manual hyperbolic examples and independent 101-position identities', () => {
    for(const prefix of ['GP_','UL_']) for(const [suffix,f,factor] of [['SH1',Math.sinh,.1],['SH2',Math.sinh,1],['CH',Math.cosh,1],['TH',Math.tanh,.1]]) {
        const r=rt(prefix+suffix);
        for(let i=0;i<=100;i++) {const p=r.pMin+(r.pMax-r.pMin)*i/100;close(f(r.value(p)),factor*10**p,prefix+suffix);}
    }
    close(10**rt('GP_CH').pos(.58),Math.cosh(.58));
    close(10**rt('GP_SH1').pos(.18)/10,Math.sinh(.18));
    close(10**rt('GP_TH').pos(.8)/10,Math.tanh(.8));
});
test('UltraLog roots form independent long scales; H and P keep their different radicands', () => {
    for(let i=0;i<=100;i++) {
        const p=i/100,d=10**p;
        for(const [id,n,j] of [['UL_R1',2,0],['UL_R2',2,1],['UL_Q1',3,0],['UL_Q2',3,1],['UL_Q3',3,2]])
            close(rt(id).value(p)**n,d*10**j,id);
        close(rt('UL_H1').value(p)**2,1+(d/10)**2);
        close(rt('UL_H2').value(p)**2,1+d*d);
        close(rt('UL_P').value(p)**2,1-(d/10)**2);
        close(rt('UL_LN').value(p),p*Math.LN10);
    }
});
test('Graphoplex dividers distinguish sexagesimal and centesimal seconds',()=> {
    const g=S.GP_C.gauges;
    close(g.find(x=>x.label==='\u03c1\u2032').value*1000,180*60/Math.PI);
    close(g.find(x=>x.label==='\u03c1\u2033').value*100000,180*3600/Math.PI);
    close(g.find(x=>x.label==='\u03c1cc').value*100000,200*10000/Math.PI);
});
for(const id of ['ultralog','graphoplex690a','graphoplex691a']) for(const mode of ['conventional','adaptive'])
    test(`${id}: ${mode} tick positions stay mathematical and captions preserve complements`,()=> {
        for(const key of new Set(Object.values(PRESETS[id].sides).flatMap(rows))) {
            const d=S[key],r=rt(key),ticks=generateTicks(d,r,1200,1.65,{graduationMode:mode});
            assert.ok(ticks.length>0,key);
            for(const t of ticks) {
                assert.ok(Number.isFinite(t.pos),key);
                const delta=Math.abs(t.pos-r.pos(t.value));
                // Both endpoints of a folded row represent the same index.
                if (['foldedLog','foldedInverse'].includes(d.type)) close(Math.min(delta,Math.abs(1-delta)),0,key);
                else close(delta,0,key);
            }
        }
    });
test('Both Graphoplex ST conventions have intermediate opening marks, not a blank interval to one degree', () => {
    for (const id of ['GP690_ST','GP691_ST']) {
        const ticks=generateTicks(S[id],rt(id),1300);
        assert.ok(ticks.filter(t=>t.value<1).length>20,id);
        const maxGap=Math.max(...ticks.slice(1).map((t,i)=>(t.pos-ticks[i].pos)*1300));
        // Coarsest permitted interval: ten arcminutes from four degrees
        // (or five arcminutes from two). Decimal engraving is finer.
        const bound=1300*Math.log10((4+10/60)/4);
        assert.ok(maxGap<=bound+1e-8, `${id} gap ${maxGap}`);
    }
});
