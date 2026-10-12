import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BUILTIN_SCALES as S } from '#catalog/scales.js';
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { adaptiveTicks, usesAdaptiveGraduations, spaceAdaptiveLabels, GRADUATION_MODES, ADAPTIVE_SPACING } from '#core/ticks/adaptive.js';
import { LOG_GRADUATIONS } from '#core/ticks/conventional.js';
import { generateTicks } from '#core/ticks/index.js';
import { validateProgram } from '#model/validation.js';
import { normalizeState, exportableState } from '#model/program.js';

const opts = { graduationMode: 'adaptive' };
const ticks = (id, width=1000, options=opts) => generateTicks(S[id], makeRuntimeScale(S[id]), width, 1.65, options);
const has = (ts, x) => ts.some(t => Math.abs(t.value-x) < 1e-12 * Math.max(Math.abs(x),Number.MIN_VALUE));
const near = (a,b,tolerance=1e-9) => assert.ok(Math.abs(a-b) <= tolerance*Math.max(1,Math.abs(a),Math.abs(b)), `${a} != ${b}`);

test('W documented cells survive zoom and retain exact fine marks, without 0.025 shortcuts', () => {
    for (const width of [300,1000,2400]) for (const displayScale of [.75,1,2]) {
        const lower=ticks('W1',width,{displayScale,logGraduations:'standard'}),
            upper=ticks('W2',width,{displayScale,logGraduations:'standard'});
        for(const x of [1.005,1.015,1.995,2.01,3.01]) assert.ok(has(lower,x),String(x));
        for(const x of [3.17,4.01,4.99,5.02,6.02,9.98]) assert.ok(has(upper,x),String(x));
        for(const x of [2.005,3.005]) assert.ok(!has(lower,x));
        for(const x of [4.005,5.01,6.025]) assert.ok(!has(upper,x));
        assert.equal(lower.find(t=>t.value===1.1).kind,'submajor');
        assert.equal(lower.find(t=>t.value===1.11).kind,'minor');
        assert.equal(lower.find(t=>t.value===1.115).kind,'micro');
        assert.equal(lower.find(t=>t.value===2.1).label,'');
        assert.equal(lower.find(t=>t.value===2.5).label,'2.5');
    }
});
test('W prime and unprimed have identical graduation plans', () => {
    for (const options of [{},opts]) {
        assert.deepEqual(ticks('W1',1000,options), ticks('W1P',1000,options));
        assert.deepEqual(ticks('W2',1000,options), ticks('W2P',1000,options));
    }
});
for (const order of [2,3,5]) test(`all order-${order} roots are cuts of a common long scale`, () => {
    const virtual={pMin:0,pMax:1,pos:Math.log10,value:p=>10**p};
    const long=adaptiveTicks({type:'log'},virtual,order*1000);
    for(let j=0;j<order;j++) {
        const id=order===2?`R${j+1}`:order===3?`Q${j+1}`:`5R${j+1}`;
        const actual=ticks(id), expected=long.filter(t=>order*t.pos-j>=-1e-10 && order*t.pos-j<=1+1e-10);
        for(const t of expected) assert.ok(has(actual,t.value),`${id}: missing ${t.value}`);
        for(const t of actual.filter(t=>t.kind!=='index')) {
            assert.ok(has(long,t.value),`${id}: branch invented ${t.value}`);
            near(t.pos,order*Math.log10(t.value)-j);
        }
    }
});
test('length per decade controls powers as well as expanded roots', () => {
    const d=ticks('D',1000).filter(t=>t.kind!=='gauge');
    const a=ticks('A',2000).filter(t=>t.value<=10*(1+1e-12));
    for(const t of d) assert.ok(has(a,t.value));
    for(const t of a) assert.ok(has(d,t.value));
    assert.ok(ticks('F5',1000).filter(t=>t.value<=10).length < d.length/2);
    assert.ok(ticks('5R1',1000).length > d.filter(t=>t.value<=10**.2).length*2);
});
test('adaptive density is ordered, deterministic, and independent of cached output mutation', () => {
    for(const id of ['D','A','P','ST','S','SH1','LL3','W1','5R5']) {
        const counts=['clear','balanced','fine'].map(adaptiveSpacing=>ticks(id,1000,{...opts,adaptiveSpacing}).length);
        assert.ok(counts[0]<=counts[1] && counts[1]<=counts[2],id+': '+counts);
        const first=ticks(id), exact=structuredClone(first);
        first[0].label='mutated';first.push({pos:9});
        assert.deepEqual(ticks(id),exact,id);
    }
});
test('display magnification adapts actual spacing, including stacked root branches', () => {
    for(const id of ['A','D','W1','PICKETT_Q2','PICKETT_5R4','P','ST'])
        assert.deepEqual(ticks(id,1000,{...opts,displayScale:2}),ticks(id,2000));
});
test('linear captions favour meaningful major and half-major intervals', () => {
    for(const id of ['L','LN','DB']) {
        const def=S[id];
        for(const t of ticks(id).filter(t=>t.label && t.kind!=='index'))
            near(t.value/(def.majorStep/2),Math.round(t.value/(def.majorStep/2)));
    }
});
test('reference rows and custom manual ticks do not invent intermediate substances or values', () => {
    for(const id of ['CHEM_CH_AM','CHEM_CH_NZ']) {
        const def=S[id],ts=ticks(id);
        for(const t of ts) assert.ok(has(def.ticks,t.value));
    }
    const d={id:'CUSTOM',type:'log',min:1,max:10,ticks:[{value:1,label:'one'},{value:3,label:'three'},{value:10,label:'ten'}]};
    assert.deepEqual(generateTicks(d,makeRuntimeScale(d),1000,1.65,opts).map(t=>t.value),[1,3,10]);
    d.adaptiveTicks=true;
    assert.ok(generateTicks(d,makeRuntimeScale(d),1000,1.65,opts).length>50);
    d.referenceOnly=true;
    assert.deepEqual(generateTicks(d,makeRuntimeScale(d),1000,1.65,opts).map(t=>t.value),[1,3,10]);
});
test('adaptive scale opt-out and malformed metadata are handled explicitly', () => {
    const def={id:'A',type:'log',min:1,max:100,adaptiveTicks:false};
    const rt=makeRuntimeScale(def);
    assert.deepEqual(generateTicks(def,rt,1000,1.65,opts),generateTicks(def,rt));
    for(const patch of [{graduationMode:'guess'},{adaptiveSpacing:2},{adaptiveSpacing:'constructor'}])
        assert.throws(()=>validateProgram({...DEFAULT_STATE,...patch}));
    for(const patch of [{adaptiveTicks:'yes'},{graduationProfile:'something'},{graduationProfile:'faber-w'}])
        assert.throws(()=>validateProgram({...DEFAULT_STATE,customScales:[{...def,...patch}]}));
});
test('new choices round trip; old programmes retain conventional mode', () => {
    const old=structuredClone(DEFAULT_STATE);delete old.graduationMode;delete old.adaptiveSpacing;
    normalizeState(old);assert.equal(old.graduationMode,'conventional');assert.equal(old.adaptiveSpacing,'balanced');
    const state={...old,graduationMode:'adaptive',adaptiveSpacing:'clear'};
    const snapshot=exportableState(state);validateProgram(snapshot);normalizeState(snapshot);
    assert.equal(snapshot.graduationMode,'adaptive');assert.equal(snapshot.adaptiveSpacing,'clear');
});
test('schema and all three graduation menus agree with runtime enums', async () => {
    const schema=JSON.parse(await readFile(new URL('../../schema/program.schema.json',import.meta.url)));
    assert.deepEqual(schema.properties.graduationMode.enum,GRADUATION_MODES);
    assert.deepEqual(schema.properties.adaptiveSpacing.enum,Object.keys(ADAPTIVE_SPACING));
    assert.deepEqual(schema.properties.logGraduations.enum,LOG_GRADUATIONS);
    const html=await readFile(new URL('../../src/index.html',import.meta.url),'utf8');
    for(const [id,choices] of [['graduationModeSelect',GRADUATION_MODES],['adaptiveSpacingSelect',Object.keys(ADAPTIVE_SPACING)]]) {
        const menu=html.match(new RegExp(`<select id="${id}"[^>]*>([\\s\\S]*?)</select>`))[1];
        assert.deepEqual([...menu.matchAll(/value="([^"]+)"/g)].map(x=>x[1]),choices);
    }
});
for (const id of ['D','A','B','K','F5','S','COS','T1','T2','ST','P','SH1','SH2','TH','H1','H2','CH','LL0','LL1','LL2','LL3','LL4','LL00','LL01','LL02','LL03','LL04']) {
    test(`${id}: complete adaptive coverage at four widths, inverse identity and unchanged strokes after label spacing`, () => {
        const def=S[id],rt=makeRuntimeScale(def);
        for(const width of [500,1000,1600,2400]) {
            const ts=ticks(id,width), gaps=ts.slice(1).map((t,i)=>(t.pos-ts[i].pos)*width);
            assert.ok(ts.length>=10 && ts.length<5000,id+': '+ts.length);
            assert.ok(Math.max(...gaps)<30,id+': gap '+Math.max(...gaps));
            for(const t of ts) {assert.ok(Number.isFinite(t.pos));assert.ok(Number.isFinite(t.value));near(rt.value(t.pos),t.value,1e-8);}
            const spaced=spaceAdaptiveLabels(ts,width);
            assert.deepEqual(spaced.map(t=>[t.value,t.pos,t.kind]),ts.map(t=>[t.value,t.pos,t.kind]));
        }
    });
}
for (const [id,def] of Object.entries(S).filter(([,d])=>!Array.isArray(d.layers))) {
    test(`adaptive catalogue ${id}: both densities produce bounded, sorted, in-domain marks`,()=>{
        const rt=makeRuntimeScale(def);
        for(const adaptiveSpacing of ['clear','fine']) {
            const ts=ticks(id,900,{...opts,adaptiveSpacing});
            assert.ok(ts.length && ts.length<6000,id);
            ts.forEach((t,i)=>{
                assert.ok(Number.isFinite(t.value),id);
                assert.ok(t.pos>=rt.pMin-1e-9 && t.pos<=rt.pMax+1e-9,id);
                if(i)assert.ok(t.pos>=ts[i-1].pos,id);
                // Folded endpoints represent the same decimal index on both ends.
                if (def.type.startsWith('folded')) {
                    const logRatio=Math.log10(rt.value(t.pos)/t.value);
                    near(logRatio,Math.round(logRatio),1e-9);
                } else if (def.type!=='bbCurve') near(rt.value(t.pos),t.value,1e-6);
            });
        }
    });
}
test('spectral branches preserve both sides and a single physical maximum',()=>{
    const id='BB_H_SPEC1',ts=ticks(id),rt=makeRuntimeScale(S[id]);
    assert.equal(ts.filter(t=>Math.abs(t.value-1)<1e-14).length,1);
    const mid=ts.filter(t=>Math.abs(t.value-.5)<1e-12);
    assert.equal(mid.length,2);
    for(const t of ts)near(rt.value(t.pos),t.value,1e-8);
});
test('invalid width/detail fails fast; very short and extreme numeric scales terminate',()=>{
    for(const width of [0,-1,NaN,Infinity])assert.throws(()=>adaptiveTicks({type:'log'},makeRuntimeScale(S.D),width));
    assert.throws(()=>adaptiveTicks({type:'log'},makeRuntimeScale(S.D),1000,'toString'));
    for(const [min,max] of [[1e-300,1e-290],[1e100,1e110],[-20,40]]) {
        const d={type:min<0?'linear':'log',min,max};
        const ts=adaptiveTicks(d,makeRuntimeScale(d),10);
        assert.ok(ts.length>0 && ts.length<200);
    }
});

// Built-in manual lists supply conventional engraving; custom lists remain
// authoritative unless their author explicitly opts in.
test('fully adaptive includes every continuous built-in, including numeric specialist lists', () => {
    for (const def of Object.values(S).filter(d => !d.layers && !d.referenceOnly))
        assert.equal(usesAdaptiveGraduations(def, opts), true, def.id);
    for (const id of ['P14_S', 'CHEM_TC', 'CHEM_P_VAC', 'CHEM_XW']) {
        assert.notDeepEqual(ticks(id, 800), ticks(id, 1600));
        const rt=makeRuntimeScale(S[id]);
        for (const t of ticks(id)) near(rt.value(t.pos),t.value,1e-8);
    }
});

test('disabled adaptive detail does not influence conventional root banks', () => {
    for (const id of ['W1','R1','Q2','5R4'])
        assert.deepEqual(ticks(id,1000,{adaptiveSpacing:'clear'}),ticks(id,1000,{adaptiveSpacing:'fine'}));
});

test('decimal half-cells are refinable rather than leaving avoidable wide gaps', () => {
    // A 0.05-wide parent must try 0.025 before rejecting 0.01 as too dense.
    // Starting at floor(log10(span)) would incorrectly skip the useful half.
    assert.ok(has(ticks('W2'),4.025));
    for (const id of ['W1','W2','D','A','P','SH1']) {
        const ts=ticks(id);
        const gaps=ts.slice(1).map((t,i)=>(t.pos-ts[i].pos)*1000);
        assert.ok(Math.max(...gaps)<9,`${id}: ${Math.max(...gaps)}`);
    }
});

test('root opt-outs use the conventional long plan; manual opt-ins use the adaptive long plan', () => {
    for (const id of ['W1','R1','Q1','5R4']) {
        const def={...S[id],adaptiveTicks:false},rt=makeRuntimeScale(def);
        const fixed=generateTicks(def,rt,1000,1.65,{});
        assert.deepEqual(generateTicks(def,rt,1000,1.65,{...opts,adaptiveSpacing:'fine'}),fixed);
        if(id==='W1')assert.deepEqual(fixed,ticks('W1',1000,{}));
        const authored={...S[id],adaptiveTicks:true,ticks:[{value:S[id].min,label:'start'}]};
        const automatic=generateTicks(authored,makeRuntimeScale(authored),1000,1.65,opts);
        assert.deepEqual(automatic,ticks(id));
    }
});
