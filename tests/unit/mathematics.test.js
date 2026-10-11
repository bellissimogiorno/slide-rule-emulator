import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { PRESETS } from '#catalog/presets.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { correctionMetric } from '#core/corrections.js';
import { PHYSICS, STEFAN_CM, RADIATION_C2, planckShape, planckTailFraction, planckLowerFraction, blackbodyCurveValue } from '#core/physics.js';
import { validateProgram } from '#model/validation.js';
import { close, programme } from './helpers.js';
for (const [id, def] of Object.entries(BUILTIN_SCALES)) {
    test(`catalogue ${id}: valid definition, finite mappings and correctly positioned ticks`, () => {
        validateProgram(programme(def));
        if (['composite', 'segmented', 'rootStack'].includes(def.type))
            return;
        const rt = makeRuntimeScale(def);
        for (let i = 0; i <= 128; i++) {
            const p = rt.pMin + (rt.pMax - rt.pMin) * i / 128;
            const value = rt.value(p);
            assert.ok(Number.isFinite(value), `${id} at ${p}`);
            if (def.type === 'bbCurve')
                continue; // two inverse branches: tested independently below
            const delta = Math.abs(rt.pos(value) - p);
            assert.ok((def.type.startsWith('folded') ? Math.min(delta, Math.abs(1 - delta)) : delta) < 2e-6, `${id} inverse at ${p}`);
        }
        const ticks = generateTicks(def, rt, 1600);
        assert.ok(ticks.length > 0, `${id} has graduations`);
        for (const tick of ticks) {
            assert.ok(tick.pos >= rt.pMin - 1e-10 && tick.pos <= rt.pMax + 1e-10);
            if (def.type === 'bbCurve') {
                close(rt.value(tick.pos), tick.value, 4e-8, 1e-25, id + ' branched tick');
            }
            if (def.type !== 'bbCurve') {
                const delta = Math.abs(rt.pos(tick.value) - tick.pos);
                assert.ok((def.type.startsWith('folded') ? Math.min(delta, Math.abs(1 - delta)) : delta) < 1e-7, id + ' tick');
            }
            if (tick.reciprocalValue)
                close(tick.value * tick.reciprocalValue, 1);
        }
    });
}
for (const [id, preset] of Object.entries(PRESETS))
    test(`preset ${id}: all references resolve`, () => validateProgram({ ...preset, customScales: [] }));
test('independent elementary identities at 501 positions', () => {
    const rt = Object.fromEntries(['D', 'C', 'A', 'K', 'CI', 'DI', 'P', 'S', 'T1', 'SH1', 'SH2', 'TH'].map(id => [id, makeRuntimeScale(BUILTIN_SCALES[id])]));
    for (let i = 0; i <= 500; i++) {
        const p = i / 500, d = 10 ** p;
        close(rt.D.value(p), d);
        close(rt.C.value(p), d);
        close(rt.A.value(p), d * d);
        close(rt.K.value(p), d * d * d);
        close(rt.CI.value(p) * d, 10);
        close(rt.DI.value(p) * d, 10);
        close(rt.P.value(p) ** 2 + (d / 10) ** 2, 1);
        close(Math.sin(rt.S.value(p) * Math.PI / 180), d / 10);
        close(Math.tan(rt.T1.value(p) * Math.PI / 180), d / 10);
        close(Math.sinh(rt.SH1.value(p)), d / 10);
        close(Math.sinh(rt.SH2.value(p)), d);
        if (p <= rt.TH.pMax)
            close(Math.tanh(rt.TH.value(p)), d / 10);
    }
});
test('root branch arithmetic includes negative decimal exponents and fifth roots', () => {
    for (const order of [2, 3, 5])
        for (let exponent = -11; exponent <= 11; exponent++) {
            for (const mantissa of [1, 1.25, 3.2, 7.9, 9.99]) {
                const branch = ((exponent % order) + order) % order;
                const rt = makeRuntimeScale({ type: 'root', order, branch });
                const result = rt.value(Math.log10(mantissa)) * 10 ** Math.floor(exponent / order);
                close(result, (mantissa * 10 ** exponent) ** (1 / order));
            }
        }
});
test('Pickett paired log-log values use the correct base and reciprocal', () => {
    const defs = Object.values(BUILTIN_SCALES).filter(d => d.type === 'syncroLogLog');
    assert.equal(defs.length, 8);
    for (const def of defs) {
        const base = def.logBase === 'e' ? Math.E : 10;
        const rt = makeRuntimeScale(def);
        for (const p of [0, .1, .25, .5, .75, .9, 1])
            close(rt.value(p), base ** (10 ** (p + def.decade)), 1e-12);
    }
});
test('independent Planck integrals including small complementary tails', async () => {
    const { integrals } = JSON.parse(await readFile(new URL('../fixtures/planck.json', import.meta.url)));
    for (const f of integrals) {
        close(planckTailFraction(f.u, f.order), f.tail, 4e-8, 1e-13, 'tail');
        close(planckLowerFraction(f.u, f.order), f.lower, 4e-8, 1e-25, 'lower');
        close(planckLowerFraction(f.u, f.order) + planckTailFraction(f.u, f.order), 1);
    }
    close(blackbodyCurveValue('energySpectral', 4.965114231744276), 1);
    close(blackbodyCurveValue('photonSpectral', 3.920690394872886), 1);
    assert.ok(planckShape(710, 5) > 0, 'representable spectral tail is not truncated');
    assert.ok(planckLowerFraction(1e-6, 3) > 0, 'lower tail does not cancel to zero');
    assert.throws(() => planckLowerFraction(1, 4));
});
test('SI radiation constants and removable correction singularities', () => {
    close(STEFAN_CM, 5.67037441918443e-12);
    close(RADIATION_C2, 14387.768775039338);
    assert.equal(PHYSICS.h, 6.62607015e-34);
    for (const key of ['sd', 'td', 'isd', 'itd']) {
        close(correctionMetric(key, 0), 1);
        close(correctionMetric(key, -.01), correctionMetric(key, .01));
    }
});
test('runtime cache cannot retain a stale mutable definition', () => {
    const def = { type: 'log', min: 1, max: 10 };
    close(makeRuntimeScale(def).value(1), 10);
    def.max = 100;
    close(makeRuntimeScale(def).value(1), 100);
    Object.freeze(def);
    assert.equal(makeRuntimeScale(def), makeRuntimeScale(def));
    assert.throws(() => makeRuntimeScale({ type: 'misspelled' }), /Unknown/);
});
test('extreme folded coefficients cannot cause a nonterminating mantissa loop', () => {
    for (const type of ['foldedLog', 'foldedInverse'])
        for (const fold of [Number.MIN_VALUE, 1e-300, .1, Math.PI, 10, 1e300, 1e308]) {
            const def = { id: 'X', type, fold };
            validateProgram(programme(def));
            const rt = makeRuntimeScale(def);
            for (const p of [0, .1, .5, .99, 1]) {
                const value = rt.value(p);
                assert.ok(value >= 1 && value <= 10);
                const diff = Math.abs(rt.pos(value) - p);
                assert.ok(Math.min(diff, Math.abs(1 - diff)) < 1e-10);
            }
        }
});
test('Model 17 temperature-slide alignment agrees with independently evaluated Planck ratios', () => {
    const temperature = makeRuntimeScale(BUILTIN_SCALES.BB_T);
    for (const [family, power, peak] of [['E', 5, 4.965114231744276], ['Q', 4, 3.920690394872886]]) {
        for (const branch of [1, 2]) {
            const wavelength = makeRuntimeScale(BUILTIN_SCALES[`BB_LAMBDA${branch}_${family}`]);
            const wavenumber = makeRuntimeScale(BUILTIN_SCALES[`BB_NU${branch}_${family}`]);
            const curve = makeRuntimeScale(BUILTIN_SCALES[`BB_${family === 'E' ? 'H' : 'Q'}_SPEC${branch}`]);
            for (const T of [100, 300, 1000, 2700, 10000]) {
                const offset = temperature.pos(T) - .5;
                for (const fixedPosition of [0, .1, .3, .5, .7, .9, 1]) {
                    const localPosition = fixedPosition - offset;
                    const lambda = wavelength.value(fixedPosition);
                    close(wavenumber.value(fixedPosition) * lambda, 10000);
                    if (localPosition < 0 || localPosition > 1)
                        continue;
                    const u = PHYSICS.h * PHYSICS.c / (PHYSICS.k * T * lambda * 1e-6);
                    const expected = u ** power / Math.expm1(u) / (peak ** power / Math.expm1(peak));
                    close(curve.value(localPosition), expected, 2e-11, 1e-20);
                }
            }
        }
    }
});
test('temperature conversion and Johnson-noise reference values', () => {
    const K = makeRuntimeScale(BUILTIN_SCALES.BB_T);
    const C = makeRuntimeScale(BUILTIN_SCALES.BB_TC);
    const F = makeRuntimeScale(BUILTIN_SCALES.BB_TF);
    const noise = makeRuntimeScale(BUILTIN_SCALES.BB_NOISE);
    for (const T of [100, 273.15, 300, 373.15, 1000, 10000]) {
        const p = K.pos(T);
        close(C.value(p), T - 273.15, 1e-10, 1e-10);
        close(F.value(p), (T - 273.15) * 9 / 5 + 32, 1e-10, 1e-10);
        close(noise.value(p), Math.sqrt(4 * PHYSICS.k * T));
    }
});
