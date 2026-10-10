/** Reference identities are independent of the catalogue's mapping factories. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_SCALES as scales } from '#catalog/scales.js';
import { PRESETS } from '#catalog/presets.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { deepClone } from '#core/objects.js';
import { buildLibrary, exportableState, mergeState, normalizeState } from '#model/program.js';
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { validateProgram } from '#model/validation.js';
import { close, programme } from './helpers.js';

const runtime = id => makeRuntimeScale(scales[id]);
const rows = face => ['topStator', 'slide', 'bottomStator'].flatMap(rail => face[rail]);
const fish = PRESETS.flyingFish1017;

test('Flying Fish is a distinct 12-row chemical / 13-row scientific preset', () => {
    assert.equal(rows(fish.sides.front).length, 12);
    assert.equal(rows(fish.sides.back).length, 13);
    assert.deepEqual(fish.sides.front.topStator, ['FF_LNI_M2', 'CHEM_CH_AM', 'CHEM_CH_NZ', 'FF_MZ_XZ']);
    assert.deepEqual(fish.sides.front.slide, ['FF_M_X', 'CHEM_TF', 'CHEM_TC', 'CHEM_F']);
    assert.deepEqual(fish.sides.front.bottomStator, ['FF_P_KG', 'CHEM_P_MMHG_ATM', 'CHEM_TW', 'FF_LN_M2']);
    assert.deepEqual(fish.sides.back.slide, ['FF_LG', 'FF_T_COT', 'S_COS', 'CI', 'C']);
    assert.notDeepEqual(fish.sides, PRESETS.hemmi257.sides);
    assert.ok(!rows(fish.sides.back).includes('DF'));
    assert.ok(!rows(fish.sides.front).includes('CHEM_TK'));
});

for (const [suffix, factor] of [['M2', .001], ['M1', .01], ['0', .1], ['1', 1]]) {
    test(`Flying Fish Ln/LnI ${suffix} use natural exponential factor ${factor}`, () => {
        const positive = runtime('FF_LN_' + suffix), negative = runtime('FF_LNI_' + suffix);
        for (const d of [1, 1.5, 2, Math.E, 5, 8, 10]) {
            const p = Math.log10(d);
            close(positive.value(p), Math.exp(d * factor));
            close(negative.value(p), Math.exp(-d * factor));
            close(positive.value(p) * negative.value(p), 1);
        }
    });
}

test('Flying Fish A1 is a two-decade square and lg is a linear log, not an Ln alias', () => {
    for (const d of [1, 2, 3, 5, 10]) {
        const p = Math.log10(d);
        close(runtime('FF_A1').value(p), d * d);
        close(runtime('FF_LG').value(p), Math.log10(d));
    }
    assert.equal(scales.FF_LG.type, 'linear');
});

test('Flying Fish red cotangent reads the complementary angle, not the upper tangent decade', () => {
    const cot = runtime('FF_COT'), tan = runtime('T1');
    for (const angle of [Math.atan(.1) * 180 / Math.PI, 6, 10, 15, 30, 45]) {
        close(cot.pos(90 - angle), Math.log10(10 * Math.tan(angle * Math.PI / 180)));
        close(cot.value(tan.pos(angle)), 90 - angle);
    }
    close(cot.value(0), 84.2894068625, 1e-12);
    close(cot.value(1), 45);
    assert.equal(scales.FF_COT.tone, 'red');
});

test('Flying Fish Mz/M settings yield binary mole fraction with unchanged shared pitch', () => {
    for (const [a, b, w] of [[13.21, 1.8, .2], [46.07, 18.015, .4], [2, 90, .75], [90, 2, .1]]) {
        const offset = runtime('FF_MZ').pos(a) - runtime('FF_M').pos(b);
        const x = runtime('CHEM_X').value(runtime('FF_XZ').pos(w) - offset);
        close(x, (w / a) / (w / a + (1 - w) / b));
    }
    assert.deepEqual(scales.FF_MZ_XZ.layers, ['FF_MZ', 'FF_XZ']);
    assert.deepEqual(scales.FF_M_X.layers, ['FF_M', 'CHEM_X']);
    close(runtime('FF_MZ').pMax, .25);
});

test('Flying Fish pressure alias uses the same physical units and water alignment', () => {
    for (const pressure of [.001, .01, .1, 1, 10, 100, 1000]) {
        close(runtime('FF_P_KG').pos(pressure), (Math.log10(pressure) + 3) / 6);
    }
    close(runtime('FF_P_KG').value(runtime('CHEM_TW').pos(100)), 101417.99 / 98066.5, 3e-7);
});

test('all Flying Fish entries can be independently selected, validated and exported', () => {
    const ids = Object.keys(scales).filter(id => id.startsWith('FF_'));
    assert.equal(ids.length, 18);
    for (const id of ids) {
        validateProgram(programme(deepClone(scales[id])));
        assert.ok(Object.isFrozen(scales[id]));
    }
    const state = mergeState(deepClone(DEFAULT_STATE), { ...fish, presetId: 'flyingFish1017', viewMode: 'both' });
    normalizeState(state);
    const exported = exportableState(state);
    validateProgram(exported);
    const library = buildLibrary(exported);
    for (const side of Object.values(exported.sides)) {
        for (const id of rows(side)) assert.ok(library[id], id);
    }
    assert.equal(exported.theme, 'flying-fish');
    assert.equal(exported.viewMode, 'both');
});

test('new alias objects do not mutate the Hemmi definitions', () => {
    assert.equal(scales.CHEM_M1.label, 'M1');
    assert.deepEqual(scales.CHEM_M1_XW.layers, ['CHEM_M1', 'CHEM_XW']);
    assert.equal(PRESETS.hemmi257.theme, 'ke');
    assert.notEqual(scales.CHEM_M1_XW, scales.FF_MZ_XZ);
});

test('Flying Fish cot and near-unity graduations have no accidental wide gaps', () => {
    for (const id of ['FF_COT', 'FF_LN_M2', 'FF_LNI_M2']) {
        for (const width of [800, 1400, 2200, 3000]) {
            const rt = runtime(id), ticks = generateTicks(scales[id], rt, width);
            const positions = [rt.pMin, ...ticks.map(t => t.pos), rt.pMax].sort((a, b) => a - b);
            const maxGap = Math.max(...positions.slice(1).map((p, i) => (p - positions[i]) * width));
            assert.ok(maxGap < 16, `${id} at ${width}px has ${maxGap}px gap`);
        }
    }
});
