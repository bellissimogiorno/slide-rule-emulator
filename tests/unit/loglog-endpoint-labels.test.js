import test from 'node:test';
import assert from 'node:assert/strict';
import { makeLogLogScale, makePickettLogLogScale, makeSyncroLogLogScale } from '#catalog/factories.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';

// Near unity, a small numeric rounding error can move the engraved value onto
// another stroke. Assess captions in the physical coordinate, independently of
// the runtime's inverse mapping or the formatter's significant-figure policy.
const widths = [300, 1000, 2400, 8000];
const positionTolerance = 0.1 / Math.max(...widths);
for (const decade of [-8, -7, -6, -5, -4, -3, -2, -1]) {
    test(`log-log endpoint captions stay within 0.1px at 8000px, decade ${decade}`, () => {
        for (const base of [Math.E, 10]) {
            const makeScale = base === Math.E ? makeLogLogScale : makePickettLogLogScale;
            const definitions = [
                makeScale('positive', '', decade, 1, ''),
                makeScale('negative', '', decade, -1, ''),
                makeSyncroLogLogScale('paired', '', decade, base === Math.E ? 'e' : '10', '')
            ];
            for (const def of definitions) for (const graduationMode of ['conventional', 'adaptive']) {
                const rt = makeRuntimeScale(def);
                for (const width of widths) {
                    const ticks = generateTicks(def, rt, width, 1.65, { graduationMode });
                    for (const [endpoint, tick] of [[0, ticks[0]], [1, ticks.at(-1)]]) {
                        const context = `${def.id}, base ${base}, ${graduationMode}, ${width}px, endpoint ${endpoint}`;
                        assert.ok(tick && Math.abs(tick.pos - endpoint) < positionTolerance, context);
                        const labels = def.type === 'syncroLogLog'
                            ? [tick.positiveLabel, tick.negativeLabel] : [tick.label];
                        for (const label of labels) {
                            assert.ok(label && Number.isFinite(Number(label)), `${context}: missing numeric caption`);
                            const captionPosition = Math.log10(Math.abs(Math.log(Number(label)) / Math.log(base))) - decade;
                            assert.ok(Math.abs(captionPosition - endpoint) < positionTolerance,
                                `${context}: ${label} displaced by ${(captionPosition - endpoint) * width}px`);
                        }
                    }
                }
            }
        }
    });
}

test('deep near-unity log-log interior captions never collapse to unity', () => {
    for (const decade of [-8, -7, -6, -5, -4]) for (const base of [Math.E, 10]) {
        const makeScale = base === Math.E ? makeLogLogScale : makePickettLogLogScale;
        for (const def of [makeScale('positive', '', decade, 1, ''), makeScale('negative', '', decade, -1, ''),
            makeSyncroLogLogScale('paired', '', decade, base === Math.E ? 'e' : '10', '')]) {
            const rt = makeRuntimeScale(def);
            for (const graduationMode of ['conventional', 'adaptive']) {
                const ticks = generateTicks(def, rt, 1000, 1.65, { graduationMode });
                let captions = 0;
                for (const tick of ticks.filter(t => t.pos > 0.01 && t.pos < 0.99)) {
                    const readings = def.type === 'syncroLogLog'
                        ? [[tick.positiveLabel, tick.value], [tick.negativeLabel, tick.reciprocalValue]]
                        : [[tick.label, tick.value]];
                    for (const [label, value] of readings) if (label) {
                        captions++;
                        assert.equal(Math.sign(Number(label) - 1), Math.sign(value - 1),
                            `${def.id}, base ${base}, decade ${decade}, ${graduationMode}: ${value} labelled ${label}`);
                    }
                }
                assert.ok(captions > 0, 'the test must inspect labelled interior strokes');
            }
        }
    }
});
