import test from 'node:test';
import assert from 'node:assert/strict';
import { mathemaScales as scales } from '#catalog/scales/mathema.js';
import { mathemaPresets } from '#catalog/presets/mathema.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { validateProgram } from '#model/validation.js';
import { close, programme } from './helpers.js';

const runtime = id => makeRuntimeScale(scales[`FC284_${id}`]);
const atY = (id, y) => runtime(id).value(Math.log10(y) + 1);

test('Mathema duplex keeps all 24 rows on the documented rails', () => {
    const { front, back } = mathemaPresets.faber284n.sides;
    assert.deepEqual(front.topStator, ['FC284_EG', 'FC284_T', 'FC284_H', 'FC284_A']);
    assert.deepEqual(front.slide, ['FC284_B', 'FC284_BI', 'FC284_I', 'FC284_y']);
    assert.deepEqual(front.bottomStator, ['FC284_Y', 'FC284_P', 'FC284_S', 'FC284_E']);
    assert.deepEqual(back.topStator, ['FC284_LL1', 'FC284_LL2', 'FC284_LL3', 'FC284_Y']);
    assert.deepEqual(back.slide, ['FC284_y', 'FC284_CH', 'FC284_SH2', 'FC284_SH1']);
    assert.deepEqual(back.bottomStator, ['FC284_TH', 'FC284_LL03', 'FC284_LL02', 'FC284_LL01']);
    const rows = [front, back].flatMap(s => [...s.topStator, ...s.slide, ...s.bottomStator]);
    assert.equal(rows.length, 24);
    assert.equal(new Set(rows).size, 22);
    for (const id of rows) assert.ok(Object.hasOwn(scales, id), id);
});

test('principal, reciprocal and parabolic readings retain decimal places', () => {
    for (const y of [.1, .125, .2, .5, .8, 1]) {
        close(atY('Y', y), y);
        close(atY('y', y), y);
        close(atY('I', y), 1 / y);
        close(atY('A', y), y * y);
        close(atY('B', y), y * y);
        close(atY('BI', y), 1 / (y * y));
    }
    const shift = runtime('Y').pos(.6) - runtime('y').pos(1);
    close(runtime('Y').value(shift + runtime('y').pos(.5)), .3, 1e-12);
    const division = runtime('Y').pos(.72) - runtime('y').pos(.9);
    close(runtime('Y').value(division + runtime('y').pos(1)), .8, 1e-12);
});

test('gon trigonometry and Pythagorean rows give independent triangle values', () => {
    close(runtime('Y').value(runtime('S').pos(100 / 3)), .5);
    close(runtime('Y').value(runtime('T').pos(50)), 1);
    close(atY('H', .75), 1.25);
    close(atY('P', .8), .6);
    close(atY('S', .8), Math.asin(.8) * 200 / Math.PI);
    for (let i = 0; i <= 100; i++) {
        const y = .1 + .9 * i / 100;
        close(Math.sin(atY('S', y) * Math.PI / 200), y);
        close(Math.tan(atY('T', y) * Math.PI / 200), y);
        close(atY('H', y) ** 2 - y * y, 1);
        close(atY('P', y) ** 2 + y * y, 1);
    }
    assert.equal(scales.FC284_S.unit, 'gon');
    assert.equal(scales.FC284_S.pairedSum, undefined);
});

test('hyperbolic arguments use gon, including factors of ten and tanh cutoff', () => {
    const g = Math.PI / 200;
    for (const y of [.1, .2, .5, .9]) {
        close(Math.cosh(atY('CH', y) * g) / 10, y);
        close(Math.sinh(atY('SH2', y) * g) / 10, y);
        close(Math.sinh(atY('SH1', y) * g), y);
        close(Math.tanh(atY('TH', y) * g), y);
    }
    close(runtime('y').value(runtime('CH').pos(100)), Math.cosh(Math.PI / 2) / 10);
    close(runtime('y').value(runtime('SH2').pos(100)), Math.sinh(Math.PI / 2) / 10);
    close(runtime('TH').value(runtime('TH').pMax), 200);
    assert.ok(runtime('TH').pMax < 1);
});

test('six logarithmic rows retain their historical multiplier and reciprocal pairing', () => {
    for (const y of [.1, .2, .5, 1]) {
        for (const [suffix, factor] of [['1', .1], ['2', 1], ['3', 10]]) {
            close(atY(`LL${suffix}`, y), Math.exp(factor * y));
            close(atY(`LL0${suffix}`, y), Math.exp(-factor * y));
            close(atY(`LL${suffix}`, y) * atY(`LL0${suffix}`, y), 1);
        }
    }
});

test('starred exponential rows have explicit direct-hairline normalisation', () => {
    close(runtime('Y').value(runtime('E').pos(.5)) * 10, Math.exp(.5));
    close(runtime('Y').value(runtime('EG').pos(100)) * 10, Math.exp(Math.PI / 2));
    for (const y of [.1, .25, .5, 1]) {
        close(atY('E', y), Math.log(10 * y));
        close(atY('EG', y), Math.log(10 * y) * 200 / Math.PI);
    }
    assert.match(scales.FC284_E.label, /\*/);
    assert.match(scales.FC284_EG.label, /\*/);
    assert.match(mathemaPresets.faber284n.instrumentNote, /normalised/);
});

test('each Mathema row validates, inverts and graduates its complete supported interval', () => {
    for (const def of Object.values(scales)) {
        validateProgram(programme(def));
        const rt = makeRuntimeScale(def);
        for (let i = 0; i <= 200; i++) {
            const p = rt.pMin + (rt.pMax - rt.pMin) * i / 200;
            close(rt.pos(rt.value(p)), p, 1e-10, 1e-12, def.id);
        }
        for (const graduationMode of ['conventional', 'adaptive']) {
            const ticks = generateTicks(def, rt, 1000, 1.65, { graduationMode, adaptiveSpacing: 'balanced' });
            assert.ok(ticks.length > 10, `${def.id} ${graduationMode}`);
            for (const tick of ticks) {
                assert.ok(Number.isFinite(tick.value) && Number.isFinite(tick.pos), def.id);
                assert.ok(tick.pos >= rt.pMin - 1e-10 && tick.pos <= rt.pMax + 1e-10, def.id);
            }
        }
    }
});
