import test from 'node:test';
import assert from 'node:assert/strict';
import { MathExpressions } from '#core/expressions.js';
import { smartRound } from '#core/format.js';
import { generateTicks } from '#core/ticks/index.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { buildLibrary } from '#model/program.js';
import { validateProgram } from '#model/validation.js';
import { programme } from './helpers.js';

for (const name of ['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__', 'isPrototypeOf']) {
    test(`expression rejects inherited operator name ${name}`, () => {
        assert.throws(() => MathExpressions.compile(`1 ${name} 2`, 'x'));
    });
}
for (const exponent of [-4, -8, -11, -16, -40, -200, -300]) {
    test(`nonzero logarithmic labels survive at decade ${exponent}`, () => {
        const scale = { id: 'tiny', type: 'log', min: 10 ** exponent, max: 10 ** (exponent + 1) };
        const ticks = generateTicks(scale, makeRuntimeScale(scale));
        const labels = ticks.filter(t => t.label);
        assert.ok(labels.length >= 5);
        for (const tick of labels) {
            assert.notEqual(tick.label, '0');
            assert.ok(Math.abs(Number(tick.label) / tick.value - 1) < 0.0001);
        }
    });
}
test('rounding preserves signed, subnormal and ordinary finite values', () => {
    for (const value of [Number.MIN_VALUE, -Number.MIN_VALUE, 1.25e-30, -1.25e-30, 1.25, 100000000000])
        assert.equal(smartRound(value), value);
    assert.equal(smartRound(0), 0);
});
for (const field of ['ticks', 'gauges']) {
    test(`${field} reject a negative branch of the Pythagorean mapping`, () => {
        const def = { ...BUILTIN_SCALES.P, id: 'bad', [field]: [{ value: -.5, label: 'bad' }] };
        assert.throws(() => validateProgram(programme(def)), /branch/);
    });
    test(`${field} reject the reciprocal branch of a positive log-log scale`, () => {
        const def = { ...BUILTIN_SCALES.LL2, id: 'bad', [field]: [{ value: Math.exp(-.3), label: 'bad' }] };
        assert.throws(() => validateProgram(programme(def)), /branch/);
    });
    test(`${field} reject values beyond the position interval`, () => {
        const def = { id: 'bad', type: 'log', min: 1, max: 10, [field]: [{ value: 20, label: 'bad' }] };
        assert.throws(() => validateProgram(programme(def)), /domain/);
    });
    test(`${field} allow meaningful decimal-equivalent folded marks`, () => {
        const def = { ...BUILTIN_SCALES.CF, id: 'fold', [field]: [{ value: 100 * Math.PI, label: 'pi' }] };
        assert.doesNotThrow(() => validateProgram(programme(def)));
    });
}
test('small wrong-branch ticks do not pass via an absolute tolerance floor', () => {
    const def = { ...BUILTIN_SCALES.P, id: 'bad', ticks: [{ value: -1e-16, label: 'not zero' }] };
    assert.throws(() => validateProgram(programme(def)), /branch/);
});
test('built-in definitions are safely shared but custom definitions are isolated', () => {
    const raw = { ...BUILTIN_SCALES.D, id: 'custom', gauges: [{ value: 2, label: 'two' }] };
    const a = buildLibrary({ customScales: [raw] }), b = buildLibrary({ customScales: [] });
    assert.equal(a.D, BUILTIN_SCALES.D);
    assert.equal(a.D, b.D);
    assert.equal(makeRuntimeScale(a.D), makeRuntimeScale(b.D));
    assert.notEqual(a.custom, raw);
    assert.ok(Object.isFrozen(a.custom.gauges[0]));
    assert.ok(!Object.isFrozen(raw));
    raw.gauges[0].label = 'changed';
    assert.equal(a.custom.gauges[0].label, 'two');
});
test('a custom override cannot mutate the shared built-in definition', () => {
    const lib = buildLibrary({ customScales: [{ ...BUILTIN_SCALES.D, label: 'Override' }] });
    assert.notEqual(lib.D, BUILTIN_SCALES.D);
    assert.equal(BUILTIN_SCALES.D.label, 'D');
    assert.equal(lib.D.label, 'Override');
});
