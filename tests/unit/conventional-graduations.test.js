/** Protect the fixed C/D modes while the broader adaptive mode evolves. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_SCALES as S } from '#catalog/scales.js';
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { logRegionProfiles, usesConventionalLog } from '#core/ticks/conventional.js';
import { normalizeState, exportableState } from '#model/program.js';
import { validateProgram } from '#model/validation.js';

const recipes = { pocket: [0.02, 0.05, 0.1], standard: [0.01, 0.02, 0.05], fine: [0.005, 0.01, 0.02] };
for (const [name, steps] of Object.entries(recipes)) {
    test(`fixed ${name} C/D lattice is complete at three widths, including beside named gauges`, () => {
        const expected = [];
        for (const [i, [lo, hi]] of [[1,2], [2,4], [4,10]].entries())
            for (let k=0; k<Math.round((hi-lo)/steps[i]); k++)
                expected.push(Number((lo+k*steps[i]).toPrecision(12)));
        expected.push(10);
        for (const id of ['D','C','DI','CI']) for (const width of [400,1000,3000]) {
            const actual=generateTicks(S[id],makeRuntimeScale(S[id]),width,1.65,{logGraduations:name});
            const values=actual.filter(t=>t.kind!=='gauge').map(t=>t.value).sort((a,b)=>a-b);
            assert.deepEqual(values,expected,`${id} ${width}`);
        }
    });
}
test('all standard tenths are secondary, not dependent on the local minor step', () => {
    const ticks=generateTicks(S.D,makeRuntimeScale(S.D),1000,1.65,{logGraduations:'standard'});
    for(const x of [1.1,2.1,3.7,4.1,9.9]) assert.equal(ticks.find(t=>t.value===x).kind,'submajor');
    assert.equal(ticks.find(t=>t.value===4.05).kind,'micro');
    assert.equal(ticks.find(t=>t.value===1.05).kind,'mid');
});
test('C/D adaptive profile changes complete regions, with a pocket floor', () => {
    assert.deepEqual(logRegionProfiles(1),['pocket','pocket','pocket']);
    assert.deepEqual(logRegionProfiles(100000),['fine','fine','fine']);
    assert.throws(()=>logRegionProfiles(0));
    assert.throws(()=>logRegionProfiles(1000,'constructor'));
    for(const mode of Object.keys(recipes))assert.deepEqual(logRegionProfiles(1000,mode),[mode,mode,mode]);
});
test('fixed C/D policy does not silently claim roots, multiple decades or explicit lists', () => {
    for(const id of ['D','CI','CF','CIF']) assert.ok(usesConventionalLog(S[id]),id);
    for(const id of ['A','K','F5','W1','ST','CHEM_CH_AM']) assert.ok(!usesConventionalLog(S[id]),id);
});
test('every fixed pattern preserves folded endpoints and exact decade-equivalent positions', () => {
    for(const id of ['CF','DF','CIF','DIF','CFM','DFM'])for(const logGraduations of Object.keys(recipes)){
        const rt=makeRuntimeScale(S[id]),ticks=generateTicks(S[id],rt,1000,1.65,{logGraduations});
        assert.ok(ticks.some(t=>t.pos===0),id);assert.ok(ticks.some(t=>t.pos===1),id);
        for(const t of ticks){const r=Math.log10(rt.value(t.pos)/t.value);assert.ok(Math.abs(r-Math.round(r))<1e-10,`${id} ${t.value}`);}
    }
});
test('the remembered C/D selection round-trips independently of the all-scale mode', () => {
    for(const logGraduations of ['adaptive',...Object.keys(recipes)]){
        const state={...structuredClone(DEFAULT_STATE),logGraduations,graduationMode:'adaptive'};
        const copy=exportableState(state);validateProgram(copy);normalizeState(copy);
        assert.equal(copy.logGraduations,logGraduations);assert.equal(copy.graduationMode,'adaptive');
    }
});
