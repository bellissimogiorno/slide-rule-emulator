/** Feature-level tests use published examples and independent relationships,
 * not merely the same mapping run forwards and backwards. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_SCALES as scales } from '#catalog/scales.js';
import { PRESETS } from '#catalog/presets.js';
import { CHEMICAL_ELEMENTS, CHEMICAL_GROUPS } from '#catalog/chemical-data.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { pressurePosition, pressureAtPosition, waterSaturationPressure, iceSublimationPressure,
    gasEntropyChange, GAS_CONSTANT, ATMOSPHERE, PSI, KG_FORCE_CM2 } from '#core/chemistry.js';
import { validateProgram } from '#model/validation.js';
import { renderReadout } from '#ui/readout.js';
import { renderScaleRow } from '#ui/scale-markup.js';
import { close, programme } from './helpers.js';
const rt = id => makeRuntimeScale(scales['CHEM_' + id]);
const rendered = (id, cursor) => renderReadout({ activeSide: 'back', sides: {
    back: { topStator: [id], slide: [], bottomStator: [] } }, cursor, slideOffset: 0 }, scales);

test('Hemmi layout has the documented 11 front and 12 back physical rows', () => {
    const { sides } = PRESETS.hemmi257;
    const count = s => ['topStator', 'slide', 'bottomStator'].reduce((n, rail) => n + s[rail].length, 0);
    assert.equal(count(sides.front), 11);
    assert.equal(count(sides.back), 12);
    assert.deepEqual(sides.front.slide, ['CF', 'CIF', 'CI', 'C']);
    assert.ok(sides.back.slide.includes('CHEM_F'));
});
test('temperature readings share an absolute-kelvin decade and the front C scale', () => {
    for (const celsius of [-173.15, -100, 0, 20, 100, 120, 500, 726.85]) {
        const kelvin = celsius + 273.15, p = Math.log10(kelvin / 100);
        close(rt('TC').pos(celsius), p);
        close(rt('TF').value(p), celsius * 1.8 + 32, 1e-11, 1e-10);
        close(rt('TK').value(p), kelvin);
        close(makeRuntimeScale(scales.C).value(p), kelvin / 100);
    }
});
test('pressure conversions agree, including vacuum and gauge zero', () => {
    close(rt('P_KG').pos(1), 0.5);
    close(rt('P_KG').pos(0.001), 0);
    close(rt('P_KG').pos(1000), 1);
    const zero = pressurePosition(ATMOSPHERE);
    close(rt('P_ATM').pos(1), zero);
    close(rt('P_MMHG').value(zero), 760, 2e-7);
    close(rt('P_VAC').pos(0), zero);
    close(rt('P_PSI').pos(0), zero);
    close(rt('P_PSI').value(zero), 0, 1e-11, 1e-10);
    const psi120 = pressurePosition(ATMOSPHERE + 120 * PSI);
    close(rt('P_PSI').pos(120), psi120);
    close(rt('P_ATM').value(psi120), 1 + 120 * PSI / ATMOSPHERE);
    for (const p of [0, .1, .5, .75, 1]) close(pressurePosition(pressureAtPosition(p)), p);
});
test('Hemmi ammonium-sulphate worked example: 20 mass percent is about 3.3 mole percent', () => {
    const offset = rt('M1').pos(13.21) - rt('M2').pos(1.8);
    const actual = rt('X').value(rt('XW').pos(0.2) - offset);
    const independent = (.2 / 132.1) / (.2 / 132.1 + .8 / 18);
    close(actual, independent);
    assert.ok(Math.abs(actual * 100 - 3.3) < .01);
});
test('mass/mole and additive-volume conversion works in both directions across ratios', () => {
    for (const [a, b] of [[4.605, 1.802], [1.321, .18], [7.94, 9.99], [2, 90], [90, 2]]) {
        // Values in this numerical test may share a decimal rescaling; the
        // actual visible M range remains 1-100.
        const offset = Math.log10(a / b) / 8;
        for (const w of [.01, .1, .2, .5, .9, .99]) {
            const x = w * b / (a * (1 - w) + w * b);
            close(rt('XW').pos(w) - offset, rt('X').pos(x));
        }
    }
});
test('ideal Raoult-law example is the same binary-odds relationship', () => {
    const p1 = 1160, p2 = 470.5;
    const offset = Math.log10(p1 / p2) / 8;
    for (const x of [.2, .4, .6, .8]) {
        const y = x * p1 / (x * p1 + (1 - x) * p2);
        close(rt('XW').value(rt('X').pos(x) + offset), y);
    }
});
test('water equation reproduces IAPWS reference critical point and saturation checks', () => {
    close(waterSaturationPressure(647.096), 22.064e6);
    close(waterSaturationPressure(373.15), 101417.99, 3e-7);
    close(waterSaturationPressure(423.15), 476158.72, 3e-7);
    close(iceSublimationPressure(273.16), 611.657, 2e-10);
    close(iceSublimationPressure(253.15), 103.24, 3e-4);
    assert.ok(Number.isNaN(waterSaturationPressure(250)));
    assert.ok(Number.isNaN(iceSublimationPressure(300)));
    close(rt('TW').pos(100), pressurePosition(waterSaturationPressure(373.15)));
    close(rt('P_KG').value(rt('TW').pos(100)), 101417.99 / KG_FORCE_CM2, 3e-7);
});
function integrateSimpson(fn, lo, hi) {
    const n = 20000, step = (hi - lo) / n;
    let sum = fn(lo) + fn(hi);
    for (let i = 1; i < n; i++) sum += fn(lo + i * step) * (i % 2 ? 4 : 2);
    return sum * step / 3;
}
function cp(t, coefficients) {
    const [a, b, c, d, e] = coefficients, x = t / 1000;
    return a + b * x + c * x * x + d * x ** 3 + e / (x * x);
}
test('gas entropy agrees with independent quadrature of published Cp/T', () => {
    const c = [24.99735, 55.18696, -33.69137, 7.948387, -.136638];
    close(gasEntropyChange('co2', 298.15, 900), integrateSimpson(t => cp(t, c) / t, 298.15, 900), 1e-10);
    const nLow = [28.98641, 1.853978, -9.647459, 16.63537, .000117];
    const nHigh = [19.50583, 19.88705, -8.598535, 1.369784, .527601];
    const oLow = [31.32234, -20.23531, 57.86644, -36.50624, -.007374];
    const oHigh = [30.03235, 8.772972, -3.988133, .788313, -.741599];
    const n = integrateSimpson(t => cp(t, nLow) / t, 200, 500) + integrateSimpson(t => cp(t, nHigh) / t, 500, 1000);
    const o = integrateSimpson(t => cp(t, oLow) / t, 200, 700) + integrateSimpson(t => cp(t, oHigh) / t, 700, 1000);
    close(gasEntropyChange('air', 200, 1000), .79 * n + .21 * o, 1e-10);
    close(gasEntropyChange('air', 1000, 200), -(.79 * n + .21 * o), 1e-10);
    assert.ok(Number.isNaN(gasEntropyChange('co2', 200, 500)));
});
test('F(t) and P give the ideal-gas reversible adiabatic pressure ratio', () => {
    for (const [gas, id, t1, t2] of [['air', 'F_AIR', 35, 270], ['co2', 'F_CO2', 25, 400]]) {
        const scale = rt(id);
        const offset = rt('P_ATM').pos(1) - scale.pos(t1);
        const ratio = rt('P_ATM').value(offset + scale.pos(t2));
        close(Math.log(ratio), gasEntropyChange(gas, t1 + 273.15, t2 + 273.15) / GAS_CONSTANT);
    }
});
test('chemical reference rows have 52 elements and 18 groups with correct decade marks', () => {
    assert.equal(Object.keys(CHEMICAL_ELEMENTS).length, 52);
    assert.equal(Object.keys(CHEMICAL_GROUPS).length, 18);
    const ticks = [...scales.CHEM_CH_AM.ticks, ...scales.CHEM_CH_NZ.ticks];
    assert.equal(ticks.length, 70);
    for (const t of ticks) close(t.value * 10 ** t.decade, t.mass);
    close(CHEMICAL_GROUPS.H2O, 18.015);
    close(CHEMICAL_GROUPS.CO3, 60.008);
    assert.equal(ticks.find(t => t.label === 'H').decade, 0);
    assert.equal(ticks.find(t => t.label === 'C').decade, 1);
    assert.equal(ticks.find(t => t.label === 'Au').decade, 2);
});
test('chemical reference readout identifies marks, not a fictitious continuous mass', () => {
    const au = scales.CHEM_CH_AM.ticks.find(t => t.label === 'Au');
    assert.match(rendered('CHEM_CH_AM', Math.log10(au.value)), /Nearest: Au = 197</);
    assert.match(rendered('CHEM_CH_AM', 1.1), /off scale/);
});
test('segmented readout switches domains instead of extrapolating a child', () => {
    assert.match(rendered('CHEM_M1_XW', .1), /M1:/);
    assert.doesNotMatch(rendered('CHEM_M1_XW', .1), /Xw:/);
    assert.match(rendered('CHEM_M1_XW', .5), /Xw:/);
    assert.doesNotMatch(rendered('CHEM_M1_XW', .5), /M1:/);
    assert.match(rendered('CHEM_F', .49), /off scale/);
});
test('segmented markup has one baseline and no artificial stretch', () => {
    const html = renderScaleRow('CHEM_M1_XW', false, 'topStator', 0, 1, {library: scales, width: 1600, minGap: 1.65});
    assert.equal((html.match(/class="baseline"/g) || []).length, 1);
    assert.match(html, /data-pos="0\.2500000"/);
});
test('tick tooltips are escaped and atomic line decorations survive generation', () => {
    const custom = {...scales.CHEM_CH_AM, id: 'X', ticks: [{value: 2, label: '<X>', title: '" onmouseover="bad', mass: 20, decade: 0}]};
    validateProgram(programme(custom));
    const html = renderScaleRow('X', false, 'topStator', 0, 1, {library: {X: custom}, width: 1000, minGap: 1.65});
    assert.match(html, /mass-underlined/);
    assert.match(html, /&lt;X&gt;/);
    assert.doesNotMatch(html, /title="" onmouseover/);
});
test('segmented validation rejects overlapping or nested domains', () => {
    assert.throws(() => validateProgram(programme({id: 'X', type: 'segmented', layers: ['C', 'D']})), /overlap/);
    assert.throws(() => validateProgram(programme({id: 'X', type: 'segmented', layers: ['CHEM_F']})), /ordinary/);
    assert.throws(() => validateProgram(programme({...scales.CHEM_CH_AM, id: 'X', ticks: []})), /reference-only/);
    assert.throws(() => validateProgram(programme({...scales.CHEM_TW, id: 'X', pMin: 0})), /calibrated/);
});
for (const id of ['TW', 'F_AIR', 'F_CO2', 'P_PSI', 'P_VAC']) {
    test(`chemical graduation coverage ${id}: no unintended large gaps`, () => {
        const scale = scales['CHEM_' + id], runtime = rt(id);
        for (const width of [800, 1600, 3000]) {
            const ticks = generateTicks(scale, runtime, width);
            const gaps = ticks.slice(1).map((t, i) => (t.pos - ticks[i].pos) * width);
            assert.ok(Math.max(...gaps) < 14, `${id}: ${Math.max(...gaps)}`);
        }
    });
}

test('segmented rows honour explicit child ink instead of colouring both segments alike', () => {
    const html = renderScaleRow('CHEM_P_VAC_PSI', false, 'bottomStator', 0, 1,
        {library: scales, width: 1600, minGap: 1.65});
    assert.match(html, /tick-label ink-red/);
    assert.match(html, /tick-label ink-neutral/);
});
test('reference-only readout honours a custom partial position domain', () => {
    const def = {...scales.CHEM_M1, id: 'REF', referenceOnly: true,
        ticks: [{value: 10, label: 'test', mass: 10}]};
    validateProgram(programme(def));
    const html = renderReadout({activeSide: 'front', cursor: .8, slideOffset: 0,
        sides: {front: {topStator: ['REF'], slide: [], bottomStator: []}}}, {REF: def});
    assert.match(html, /off scale/);
});
