import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRESETS } from '#catalog/presets.js';
import { BUILTIN_SCALES as scales } from '#catalog/scales.js';
import { aristoHyperbolicScales } from '#catalog/scales/aristo-hyperbolic.js';
import { aristoHyperbolicPresets } from '#catalog/presets/aristo-hyperbolic.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { scaleReadings } from '#ui/readout-values.js';
import { validateProgram } from '#model/validation.js';
import { close, programme } from './helpers.js';

const runtime = id => makeRuntimeScale(scales[id] || aristoHyperbolicScales[id]);
const rows = rule => Object.values(rule.sides).flatMap(side => [...side.topStator, ...side.slide, ...side.bottomStator]);

test('Aristo 0971 has the 25-row arrangement recorded for physical specimens', () => {
    const rule = aristoHyperbolicPresets.aristo0971;
    assert.deepEqual(rule.sides.front.topStator, ['ARISTO_TH', 'K', 'A']);
    assert.deepEqual(rule.sides.front.slide, ['B', 'ARISTO_T', 'ARISTO_ST', 'ARISTO_S', 'C']);
    assert.deepEqual(rule.sides.front.bottomStator, ['D', 'DI', 'ARISTO_SH2', 'ARISTO_SH1']);
    assert.deepEqual(rule.sides.back.topStator, ['LL01', 'LL02', 'LL03', 'DF']);
    assert.deepEqual(rule.sides.back.slide, ['CF', 'CIF', 'L', 'CI', 'C']);
    assert.deepEqual(rule.sides.back.bottomStator, ['D', 'LL3', 'LL2', 'LL1']);
    assert.equal(rows(rule).length, 25);
});

test('Aristo 0972 has the 31-row arrangement, with ST above S and movable P', () => {
    const rule = aristoHyperbolicPresets.aristo0972;
    assert.deepEqual(rule.sides.front.topStator, ['ARISTO_H2', 'ARISTO_SH2', 'ARISTO_TH', 'K', 'A']);
    assert.deepEqual(rule.sides.front.slide, ['B', 'ARISTO_T', 'ARISTO_ST', 'ARISTO_S', 'ARISTO_P', 'C']);
    assert.deepEqual(rule.sides.front.bottomStator, ['D', 'DI', 'ARISTO_CH', 'ARISTO_SH1', 'ARISTO_H1']);
    assert.deepEqual(rule.sides.back.topStator, ['LL00', 'LL01', 'LL02', 'LL03', 'DF']);
    assert.deepEqual(rule.sides.back.slide, ['CF', 'CIF', 'L', 'CI', 'C']);
    assert.deepEqual(rule.sides.back.bottomStator, ['D', 'LL3', 'LL2', 'LL1', 'LL0']);
    assert.equal(rows(rule).length, 31);
});

for (const [id, rule] of Object.entries(aristoHyperbolicPresets)) {
    test(`${id}: registered preset and importable both-face example agree`, () => {
        const registered = PRESETS[id];
        // The public preset also includes its separately researched cursor.
        // Every authored scale-layout and top-level field must still match.
        assert.deepEqual({ ...registered, sides: rule.sides }, rule);
        for (const [face, side] of Object.entries(rule.sides))
            for (const [key, value] of Object.entries(side)) assert.deepEqual(registered.sides[face][key], value);
        validateProgram({ ...registered, customScales: [] });
        const example = JSON.parse(readFileSync(new URL(`../../examples/${id}-both.json`, import.meta.url), 'utf8'));
        validateProgram(example);
        assert.equal(example.presetId, id);
        assert.equal(example.viewMode, 'both');
        assert.deepEqual(example.sides, registered.sides);
        assert.equal(example.instrumentNote, rule.instrumentNote);
    });
}

for (const [id, def] of Object.entries(aristoHyperbolicScales)) {
    test(`${id}: valid independent definition and finite conventional/adaptive graduations`, () => {
        validateProgram(programme(def));
        const rt = runtime(id);
        for (const width of [320, 1200]) for (const graduationMode of ['conventional', 'adaptive']) {
            const ticks = generateTicks(def, rt, width, 1.65, { graduationMode });
            assert.ok(ticks.length > 2);
            for (const tick of ticks) {
                assert.ok(Number.isFinite(tick.pos));
                assert.ok(tick.pos >= rt.pMin - 1e-10 && tick.pos <= rt.pMax + 1e-10);
                close(rt.value(tick.pos), tick.value, 2e-10, 1e-12);
            }
        }
    });
}

test('Sh1, Sh2, Ch and Th independently satisfy the exponential definitions at 1001 positions', () => {
    const definitions = [
        ['ARISTO_SH1', 0.1, u => (Math.exp(u) - Math.exp(-u)) / 2],
        ['ARISTO_SH2', 1, u => (Math.exp(u) - Math.exp(-u)) / 2],
        ['ARISTO_CH', 1, u => (Math.exp(u) + Math.exp(-u)) / 2],
        ['ARISTO_TH', 0.1, u => (Math.exp(2 * u) - 1) / (Math.exp(2 * u) + 1)]
    ];
    for (const [id, factor, functionValue] of definitions) {
        const rt = runtime(id);
        for (let i = 0; i <= 1000; i++) {
            const p = rt.pMax * i / 1000, u = rt.value(p);
            close(functionValue(u), factor * 10 ** p);
            close(rt.pos(u), p, 2e-11, 1e-12);
        }
    }
});

test('H1 and H2 return the hypotenuse, with the correct decade of D and continuous join', () => {
    for (let i = 0; i <= 1000; i++) {
        const p = i / 1000, d = 10 ** p;
        const h1 = runtime('ARISTO_H1').value(p), h2 = runtime('ARISTO_H2').value(p);
        close(h1 * h1 - 1, (d / 10) ** 2, 3e-11);
        close(h2 * h2 - 1, d * d);
        close(runtime('ARISTO_H1').pos(h1), p, 3e-11, 1e-12);
        close(runtime('ARISTO_H2').pos(h2), p);
    }
    close(runtime('ARISTO_H1').value(1), runtime('ARISTO_H2').value(0));
    close(runtime('ARISTO_H1').value(Math.log10(7.5)), 1.25);
    close(runtime('ARISTO_H2').value(Math.log10(2.4)), 2.6);
});

test('Th ends at finite argument 3 and reports off scale at the right index', () => {
    const def = aristoHyperbolicScales.ARISTO_TH, rt = runtime(def.id);
    const expectedEnd = Math.log10(10 * (Math.exp(6) - 1) / (Math.exp(6) + 1));
    close(rt.pMin, 0);
    close(rt.pMax, expectedEnd);
    assert.ok(rt.pMax < 1);
    close(rt.value(rt.pMax), 3);
    close(rt.value(0), Math.log(1.1 / .9) / 2);
    assert.equal(scaleReadings(def, rt.pMax, scales).outside, false);
    assert.deepEqual(scaleReadings(def, 1, scales), { outside: true, texts: ['off scale'] });
});

test('paired angular rows use complements; movable P follows the same C position', () => {
    for (const id of ['ARISTO_T', 'ARISTO_S']) {
        const def = aristoHyperbolicScales[id], rt = runtime(id);
        for (let i = 0; i <= 500; i++) {
            const p = i / 500, angle = rt.value(p) * Math.PI / 180;
            const complement = (90 - rt.value(p)) * Math.PI / 180;
            close(id === 'ARISTO_T' ? Math.tan(angle) : Math.sin(angle), 10 ** (p - 1));
            close(id === 'ARISTO_T' ? 1 / Math.tan(complement) : Math.cos(complement), 10 ** (p - 1));
        }
        for (const tick of generateTicks(def, rt).filter(t => t.negativeLabel))
            close(tick.value + Number(tick.negativeLabel), 90, 0, .001);
    }
    assert.equal(aristoHyperbolicScales.ARISTO_P.tone, 'red');
    close(runtime('ARISTO_P').value(Math.log10(8)), .6);
    const shift = .12, cursor = shift + Math.log10(6);
    close(runtime('ARISTO_P').value(cursor - shift), .8);
});

test('Aristo ST follows the manual radian calibration, with complementary red angles', () => {
    const def = aristoHyperbolicScales.ARISTO_ST, rt = runtime(def.id);
    assert.equal(def.pairedSum, 90);
    for (let i = 0; i <= 1000; i++) {
        const p = i / 1000, degrees = rt.value(p), radians = 10 ** (p - 2);
        close(degrees * Math.PI / 180, radians);
        close(rt.pos(degrees), p, 2e-11, 1e-12);
    }
    close(rt.value(0), 180 / (100 * Math.PI));
    close(rt.value(1), 180 / (10 * Math.PI));
    close(10 ** rt.pos(3) / 100, Math.PI / 60);
    assert.ok(Math.abs(rt.value(1) - Math.asin(.1) * 180 / Math.PI) > .009,
        'The radian calibration must not silently become the generic sine calibration');
    for (const graduationMode of ['conventional', 'adaptive']) {
        const ticks = generateTicks(def, rt, 1200, 1.65, { graduationMode });
        assert.ok(ticks.filter(t => t.value < 1).length > 10, 'Opening interval must have intermediate graduations');
        for (const tick of ticks) {
            close(10 ** tick.pos / 100, tick.value * Math.PI / 180);
            if (tick.negativeLabel) close(tick.value + Number(tick.negativeLabel), 90, 0, .001);
        }
    }
    const shift = .12, cursor = shift + rt.pos(3);
    close(rt.value(cursor - shift), 3);
});

test('Aristo log-log ranges match exp(plus/minus kD), including 0972 near-unity rows', () => {
    for (let i = 0; i <= 200; i++) for (let bank = 0; bank <= 3; bank++) {
        const p = i / 200, exponent = 10 ** (bank - 3) * 10 ** p;
        const positive = runtime('LL' + bank).value(p), negative = runtime('LL0' + bank).value(p);
        close(positive, Math.exp(exponent));
        close(negative, Math.exp(-exponent));
        close(positive * negative, 1);
    }
});
