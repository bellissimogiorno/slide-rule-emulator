import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '#catalog/presets.js';
import { BUILTIN_SCALES as scales } from '#catalog/scales.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { validateProgram } from '#model/validation.js';
import { close, programme } from './helpers.js';
const rule = PRESETS.faber282n;
const runtime = id => makeRuntimeScale(scales[id]);

test('2/82N follows the 1962 manual rather than the later 2/82 order', () => {
    assert.deepEqual(rule.sides.front.topStator, ['FC282_T1', 'FC282_T2', 'L', 'A']);
    assert.deepEqual(rule.sides.front.slide, ['B', 'BI', 'CI', 'FC282_SP', 'C']);
    assert.deepEqual(rule.sides.front.bottomStator, ['D', 'FC282_S', 'ST', 'FC282_P']);
    assert.deepEqual(rule.sides.back.topStator, ['LL03', 'LL02', 'LL01', 'K', 'DF']);
    assert.deepEqual(rule.sides.back.slide, ['CF', 'FC282_KP', 'CIF', 'CI', 'C']);
    assert.deepEqual(rule.sides.back.bottomStator, ['D', 'LL1', 'LL2', 'LL3']);
    assert.equal(Object.values(rule.sides).flatMap(s => [...s.topStator, ...s.slide, ...s.bottomStator]).length, 27);
});
for (const id of ['FC282_T1', 'FC282_T2', 'FC282_S', 'FC282_SP']) {
    test(`${id}: independent sine/tangent and complementary-angle identities`, () => {
        const def = scales[id], rt = runtime(id);
        validateProgram(programme(def));
        for (let i = 0; i <= 500; i++) {
            const p = i / 500, degrees = rt.value(p), radians = degrees * Math.PI / 180;
            close(def.type === 'sin' ? Math.sin(radians) : Math.tan(radians), 10 ** (p - (def.type === 'tan2' ? 0 : 1)));
            close(rt.pos(degrees), p);
        }
        for (const tick of generateTicks(def, rt).filter(t => t.negativeLabel))
            close(tick.value + Number(tick.negativeLabel), 90, 0, .001);
        assert.equal(def.tone, 'neutral');
    });
}
test('S/S-prime reproduces the manual sine-product example', () => {
    const shift = runtime('FC282_S').pos(41) - 1;
    const p = shift + runtime('FC282_SP').pos(23);
    close(runtime('D').value(p) / 10, Math.sin(41 * Math.PI / 180) * Math.sin(23 * Math.PI / 180));
});
test('K/K-prime supports multiplication of cube-scale numbers', () => {
    const shift = runtime('K').pos(8);
    const p = shift + runtime('FC282_KP').pos(27);
    close(runtime('K').value(p), 216);
    close(runtime('D').value(p), 6);
});
test('N-model P is red and gives the 0.8/0.6 triangle relationship', () => {
    assert.equal(scales.FC282_P.tone, 'red');
    close(runtime('FC282_P').value(runtime('D').pos(8)), .6);
});
test('N-model aliases do not change existing S, T2, P or K scales', () => {
    assert.equal(scales.S.pairedSum, undefined);
    assert.equal(scales.T2.tone, 'red');
    assert.equal(scales.P.tone, undefined);
    assert.equal(scales.K.label, 'K');
});
