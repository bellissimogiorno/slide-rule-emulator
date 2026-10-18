/** Independent specimen-fidelity checks.
 * These expectations use the photographed instrument's functional equations,
 * not the catalogue's mapping helpers. The visible frame is wider than the
 * engraved Y interval: it must also contain sinh(80 gon) > 1.6.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mathemaScales } from '#catalog/scales/mathema.js';
import { mathemaPresets } from '#catalog/presets/mathema.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { close } from './helpers.js';

const origin = Math.log10(.625);
const span = Math.log10(16.5) - origin;
const position = y => (Math.log10(10 * y) - origin) / span;
const scale = id => mathemaScales[`FC284_${id}`];
const runtime = id => makeRuntimeScale(scale(id));
const atY = (id, y) => runtime(id).value(position(y));
const front = mathemaPresets.faber284n.sides.front;

test('Mathema extensions share one logarithmic coordinate frame', () => {
    for (const y of [.065, .07, .1, .15, .5, 1, 1.5]) {
        close(runtime('Y').pos(y), position(y));
        close(runtime('y').pos(y), position(y));
    }
    close(runtime('Y').pos(.1) - runtime('Y').pos(.01), 1 / span);
    assert.ok(position(.065) > 0, 'engraved Y starts inside the physical frame');
    assert.ok(position(1.5) < 1, 'engraved Y ends inside the physical frame');
    close(scale('Y').min, .065);
    close(scale('Y').max, 1.5);
});

test('extended reciprocal and quadratic rows retain their mathematical relation', () => {
    for (const y of [.07, .09, .1, .125, .2, .8, 1, 1.45]) {
        close(atY('Y', y), y);
        close(atY('I', y), 1 / y);
        close(atY('A', y), y * y);
        close(atY('B', y), y * y);
        close(atY('BI', y), 1 / (y * y));
    }
    const slideShift = runtime('Y').pos(.9) - runtime('y').pos(1);
    close(runtime('Y').value(slideShift + runtime('y').pos(1.4)), 1.26);
});

test('photographed circular and Pythagorean end extensions preserve their identities', () => {
    for (const g of [4.2, 10, 25, 50, 60, 62])
        close(runtime('T').pos(g), position(Math.tan(g * Math.PI / 200)));
    for (const g of [4.2, 10, 25, 50, 80, 100])
        close(runtime('S').pos(g), position(Math.sin(g * Math.PI / 200)));
    for (const y of [.07, .1, .5, .8, 1.4])
        close(atY('H', y) ** 2 - y * y, 1);
    for (const y of [.07, .1, .5, .8, .99, 1])
        close(atY('P', y) ** 2 + y * y, 1);
    assert.equal(scale('T').max, 62, 'ten 0.2-gon intervals follow the printed 60');
    assert.equal(scale('S').pairedSum, undefined, 'the specimen has no cosine overprint');
});

test('hyperbolic row endings fit the frame and remain in gon', () => {
    const cases = [
        ['CH', 0, g => .1 * Math.cosh(g * Math.PI / 200)],
        ['CH', 220, g => .1 * Math.cosh(g * Math.PI / 200)],
        ['SH2', 40, g => .1 * Math.sinh(g * Math.PI / 200)],
        ['SH2', 220, g => .1 * Math.sinh(g * Math.PI / 200)],
        ['SH1', 4, g => Math.sinh(g * Math.PI / 200)],
        ['SH1', 80, g => Math.sinh(g * Math.PI / 200)],
        ['TH', 4, g => Math.tanh(g * Math.PI / 200)],
        ['TH', 200, g => Math.tanh(g * Math.PI / 200)]
    ];
    for (const [id, g, f] of cases) {
        close(runtime(id).pos(g), position(f(g)));
        assert.ok(runtime(id).pos(g) >= 0 && runtime(id).pos(g) <= 1, `${id} ${g} remains visible`);
        assert.equal(scale(id).unit, 'gon');
    }
    assert.ok(Math.sinh(.4 * Math.PI) > 1.6, '80 gon requires the extra right margin');
    close(runtime('TH').pMax, position(Math.tanh(Math.PI)));
    assert.ok(runtime('TH').pMax < position(1), 'finite 200 tick precedes the infinite limit');
});

test('all six extended logarithmic rows retain their coefficients and reciprocity', () => {
    for (const y of [.08, .1, .25, .5, 1, 1.4]) {
        for (const [id, coefficient] of [['1', .1], ['2', 1], ['3', 10]]) {
            close(atY(`LL${id}`, y), Math.exp(coefficient * y));
            close(atY(`LL0${id}`, y), Math.exp(-coefficient * y));
            close(atY(`LL${id}`, y) * atY(`LL0${id}`, y), 1);
        }
    }
});

test('linear exponential engravings have the historical main-line calibration', () => {
    for (const y of [.1, .15, .25, .5, 1, 1.4]) {
        close(atY('E', y), Math.log(1000 * y) - 4.4);
        close(atY('EG', y), 200 * Math.log(1000 * y) / Math.PI - 280);
    }
    assert.deepEqual([scale('E').min, scale('E').max], [0, 2.9]);
    assert.deepEqual([scale('EG').min, scale('EG').max], [0, 185]);
    assert.doesNotMatch(scale('E').label, /\*/);
    assert.doesNotMatch(scale('EG').label, /\*/);
});

test('each exponential auxiliary line solves independent positive and negative examples', () => {
    for (const [id, prefix, step, argumentFactor] of [
        ['E', 'e', 2.2, 1], ['EG', 'eg', 140, Math.PI / 200]
    ]) {
        for (let j = 0; j < 5; j++) {
            const mark = front.cursorMarks.find(m => m.id === `mathema-${prefix}-${j}`);
            assert.ok(mark, `${prefix} line ${j}`);
            assert.deepEqual(mark.scales, [`FC284_${id}`]);
            const z = id === 'E' ? .5 : 50;
            const mainPosition = runtime(id).pos(z) - mark.offset;
            const y = runtime('Y').value(mainPosition);
            const exponent = (z + j * step) * argumentFactor;
            close(y * 10 ** (j + 1), Math.exp(exponent));
            close(runtime('I').value(mainPosition) / 10 ** (j + 1), Math.exp(-exponent));
        }
    }
});

test('pi cursor factors use the quadratic rows and the two outer main-scale lines', () => {
    const left = front.cursorMarks.find(m => m.id === 'mathema-left');
    const right = front.cursorMarks.find(m => m.id === 'mathema-right');
    const pi4 = front.cursorMarks.find(m => m.id === 'mathema-pi4');
    assert.deepEqual(pi4.scales, ['FC284_A', 'FC284_B']);
    const p = position(.5);
    close(runtime('A').value(p + pi4.offset) / runtime('A').value(p), Math.PI / 4);
    close(runtime('A').value(p + right.offset) / runtime('A').value(p), Math.PI / 2);
    close(runtime('Y').value(p + right.offset) / runtime('Y').value(p + left.offset), Math.PI / 2);
});

test('every photographed row clips to its own finite engraved bounds', () => {
    for (const def of Object.values(mathemaScales)) {
        const rt = makeRuntimeScale(def);
        const ends = [rt.pos(def.min), rt.pos(def.max)].sort((a, b) => a - b);
        close(rt.pMin, ends[0], 1e-9, 1e-11, `${def.id} left boundary`);
        close(rt.pMax, ends[1], 1e-9, 1e-11, `${def.id} right boundary`);
        assert.ok(rt.pMin >= 0 && rt.pMax <= 1, `${def.id} must fit the visible spine`);
        for (const graduationMode of ['conventional', 'adaptive']) {
            const ticks = generateTicks(def, rt, 1200, 1.65, { graduationMode });
            for (const tick of ticks) {
                close(tick.pos, rt.pos(tick.value), 1e-9, 1e-11, `${def.id} tick position`);
                assert.ok(tick.pos >= rt.pMin - 1e-10 && tick.pos <= rt.pMax + 1e-10, `${def.id} tick clipping`);
            }
        }
    }
});
