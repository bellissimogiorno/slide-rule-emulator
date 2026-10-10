import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { dedupeTicks } from '#core/ticks/common.js';
import { close } from './helpers.js';
for (const id of ['SH1', 'SH2', 'TH', 'P', 'H1', 'H2', 'CH'])
    for (const width of [600, 1000, 1600, 2400]) {
        test(`${id}: graduation coverage at width ${width}`, () => {
            const rt = makeRuntimeScale(BUILTIN_SCALES[id]);
            const ticks = generateTicks(BUILTIN_SCALES[id], rt, width);
            const positions = [rt.pMin, ...ticks.map(t => t.pos), rt.pMax];
            const maxGap = Math.max(...positions.slice(1).map((p, i) => (p - positions[i]) * width));
            assert.ok(maxGap < Math.max(12, width * .006), `largest gap ${maxGap}`);
            assert.ok(ticks.filter(t => t.pos < .2).length >= 10, 'opening fifth is graduated');
        });
    }
test('linear partial opening interval and exact index labels', () => {
    const def = { type: 'linear', min: .05, max: 1.05, majorStep: .2, minorDivisions: 10 };
    const ticks = generateTicks(def, makeRuntimeScale(def), 1600);
    assert.equal(ticks[0].label, '0.05');
    assert.equal(ticks.at(-1).label, '1.05');
    assert.ok(ticks.some(t => Math.abs(t.value - .06) < 1e-12));
    assert.ok(ticks[1].pos < .02);
});
test('adaptive linear indices do not use the rounding of their major interval', () => {
    const def = { type: 'linear', min: .053, max: 1.057 };
    const ticks = generateTicks(def, makeRuntimeScale(def), 1000);
    assert.equal(ticks[0].label, '0.053');
    assert.equal(ticks.at(-1).label, '1.057');
});
test('numeric deduplication does not merge distinct nearby mathematical values', () => {
    assert.equal(dedupeTicks([{ pos: .5, value: 2, kind: 'major' }, { pos: .500001, value: 3, kind: 'major' }]).length, 2);
});
test('manual paired LL ticks retain both captions and exact reciprocal', () => {
    const def = { id: 'M', type: 'syncroLogLog', decade: 0, logBase: '10', ticks: [{ value: 100, positiveLabel: '100', negativeLabel: '.01' }] };
    const ticks = generateTicks(def, makeRuntimeScale(def), 1000);
    assert.equal(ticks[0].positiveLabel, '100');
    assert.equal(ticks[0].negativeLabel, '.01');
    close(ticks[0].reciprocalValue, .01);
});
test('incompatible strategy fails fast rather than entering a nonadvancing loop', () => {
    const def = { type: 'linear', min: -1e20, max: 1e20, tickMode: 'temperature' };
    assert.throws(() => generateTicks(def, makeRuntimeScale(def)), /incompatible|requires|tick/i);
});
test('Thornton Pt aliases use the corrected hypotenuse layers', () => {
    assert.deepEqual(BUILTIN_SCALES.PT.layers.map(layer => layer.scale), ['H1', 'H2']);
});
for (const id of ['LL2', 'LL02', 'PN3LL2', 'P10LL2', 'P10LL02', 'PLL3', 'SD', 'TD', 'ISD', 'ITD', 'BB_TC', 'BB_TF', 'BB_H_BAND1', 'BB_Q_BAND1', 'BB_H_SPEC1', 'BB_Q_SPEC1']) {
    for (const width of [600, 1000, 1600, 2400]) {
        test(`${id}: extended nonlinear graduation coverage at width ${width}`, () => {
            const def = BUILTIN_SCALES[id];
            const runtime = makeRuntimeScale(def);
            const ticks = generateTicks(def, runtime, width);
            const positions = [runtime.pMin, ...ticks.map(tick => tick.pos), runtime.pMax];
            const largestGap = Math.max(...positions.slice(1).map((p, i) => (p - positions[i]) * width));
            const tolerance = def.type === 'bbCurve' ? Math.max(18, width * .012) : Math.max(12, width * .006);
            assert.ok(largestGap < tolerance, `Unmarked interval: ${largestGap}px; limit ${tolerance}px`);
            for (const tick of ticks) {
                if (def.type !== 'bbCurve')
                    close(runtime.pos(tick.value), tick.pos);
            }
        });
    }
}
