/** The fifth-root bank is a mathematical extension, not a historical facsimile.
 * Reference answers use independent integer powers and exponent identities.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILTIN_SCALES as scales } from '#catalog/scales.js';
import { PRESETS } from '#catalog/presets.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { pairedProductTicks } from '#core/paired-products.js';
import { renderScaleRow } from '#ui/scale-markup.js';
import { renderReadout } from '#ui/readout.js';
import { scaleReadings } from '#ui/readout-values.js';
import { validateProgram, parseProgramText } from '#model/validation.js';
import { buildLibrary, exportableState, deepClone } from '#model/program.js';
import { programme, close } from './helpers.js';

const bank = scales.PICKETT_FIFTH_ROOT, pair = scales.F5_PAIR;
const render = (id, sliding = false, library = scales) => renderScaleRow(id, sliding,
    sliding ? 'slide' : 'topStator', 0, 1, { library, width: 1600, minGap: 1.65 });
const branches = bank.layers.map(layer => layer.scale);

for (const [j, id] of branches.entries()) {
    test(`${id}: independent fifth powers, inverses and branch boundaries at 501 positions`, () => {
        const def = scales[id], rt = makeRuntimeScale(def);
        assert.equal(def.type, 'root'); assert.equal(def.order, 5); assert.equal(def.branch, j);
        for (let i = 0; i <= 500; i++) {
            const p = i / 500, root = rt.value(p), radicand = (10 ** p) * (10 ** j);
            close(root ** 5, radicand, 5e-14, 0);
            close(rt.pos(root), p, 0, 2e-15);
        }
        close(rt.value(0), 10 ** (j / 5));
        close(rt.value(1), 10 ** ((j + 1) / 5));
        const ticks = generateTicks(def, rt, 1600);
        assert.ok(ticks.length > 100, 'missing graduations');
        for (const tick of ticks) close(tick.value ** 5, 10 ** tick.pos * 10 ** j, 5e-11, 0);
    });
}

test('fifth-root bank has five complete branches, two spines and no duplicated ruled rows', () => {
    const html = render(bank.id);
    assert.equal((html.match(/class="root-spine"/g) || []).length, 2);
    assert.equal((html.match(/class="root-branch /g) || []).length, 5);
    assert.equal((html.match(/class="baseline"/g) || []).length, 0);
    assert.equal((html.match(/class="tick-mover root-stack-track"/g) || []).length, 1);
    const pane = html.slice(html.indexOf('<div class="tick-pane">'), html.indexOf('<div class="scale-legend'));
    assert.equal((pane.match(/class="root-single"/g) || []).length, 1);
    assert.equal((pane.match(/class="root-pair"/g) || []).length, 2);
    assert.ok(!html.includes('ink-red'), 'increasing branches are not inverse scales');
    for (const id of branches) {
        const section = pane.split(`data-root-scale="${id}">`)[1].split('class="root-branch ')[0];
        const actual = [...section.matchAll(/data-pos="([^"]+)" data-kind=/g)].map(m => Number(m[1]));
        const expected = generateTicks(scales[id], makeRuntimeScale(scales[id]), 1600, 1.65);
        assert.equal(actual.length, expected.length, id);
        actual.forEach((p, i) => close(p, expected[i].pos, 0, 5.01e-8));
    }
    for (const digits of ['1, 6, 11 digits', '2, 7, 12 digits', '3, 8, 13 digits', '4, 9, 14 digits', '5, 10, 15 digits'])
        assert.ok(html.includes(digits), digits);
});

test('complete bank moves as one item and preserves compact opt-outs', () => {
    assert.equal((render(bank.id, true).match(/class="tick-mover slide-mover root-stack-track"/g) || []).length, 1);
    for (const change of [{ ...scales, [bank.id]: { ...bank, compactLabels: false } },
        { ...scales, [branches[4]]: { ...scales[branches[4]], compactLabels: false } }])
        assert.match(render(bank.id, false, change), /no-compact-labels/);
});

test('fifth-root branch selection works for positive and negative decimal exponents', () => {
    for (let k = -16; k <= 16; k++) for (const m of [1, 3.2, 7.59375, 9.999]) {
        const j = ((k % 5) + 5) % 5;
        const result = makeRuntimeScale(scales[branches[j]]).value(Math.log10(m)) * 10 ** Math.floor(k / 5);
        close(result ** 5, m * 10 ** k, 5e-13, 0);
    }
    const p = Math.log10(3.2);
    close(makeRuntimeScale(scales.PICKETT_5R2).value(p), 2);
    close(makeRuntimeScale(scales.PICKETT_5R2).value(p) / 10, .2);
});

test('back-to-back fifth powers read x^5 and the true x^-5 at 501 positions', () => {
    const rt = makeRuntimeScale(pair);
    for (let i = 0; i <= 500; i++) {
        const p = i / 500, x = 10 ** p, value = rt.value(p);
        close(value, x ** 5, 1e-14, 0);
        close(pair.pairedProduct / value, x ** -5, 1e-14, 0);
    }
    assert.deepEqual(scaleReadings(pair, Math.log10(2), scales, true).texts, ['x\u2075: 32', 'x\u207b\u2075: 0.03125']);
    assert.deepEqual(scaleReadings(pair, 0, scales, true).texts, ['x\u2075: 1', 'x\u207b\u2075: 1']);
    assert.deepEqual(scaleReadings(pair, 1, scales, true).texts, ['x\u2075: 1e5', 'x\u207b\u2075: 1e-5']);
});

test('paired powers have one tick per position, reciprocal secondary labels and one shared baseline', () => {
    const ticks = generateTicks(pair, makeRuntimeScale(pair), 1600);
    assert.equal(ticks.length, new Set(ticks.map(t => t.pos)).size);
    for (const t of ticks) if (t.positiveLabel) {
        close(Number(t.positiveLabel), t.value, 5e-5, 0);
        close(Number(t.negativeLabel) * t.value, 1, 5e-5, 0);
    }
    const html = render(pair.id), slideHtml = render(pair.id, true);
    assert.equal((html.match(/class="syncro-baseline"/g) || []).length, 1);
    assert.equal((html.match(/class="syncro-tick /g) || []).length, ticks.length);
    assert.ok(!html.includes('tick-layer'), 'must not use two independent scale rows');
    assert.match(html, /class="syncro-scale-name"><span>x\u2075<\/span><span class="negative">x\u207b\u2075/);
    assert.equal((slideHtml.match(/tick-mover slide-mover syncro-track/g) || []).length, 1);
});

test('secondary captions use the exact underlying value, not a rounded printed caption', () => {
    const ticks = [{ pos: .25, value: 3.141592653589793, label: '3.14', kind: 'major' },
        { pos: .3, value: 4.1, label: '', kind: 'minor' }];
    const result = pairedProductTicks(ticks, pair);
    close(Number(result[0].negativeLabel), 1 / Math.PI, 5e-5, 0);
    assert.notEqual(Number(result[0].negativeLabel), Number((1 / 3.14).toPrecision(5)));
    assert.equal(result[1].negativeLabel, '');
    assert.equal(ticks[0].positiveLabel, undefined);
});

test('both-face readouts retain five branches and both powers at their own local coordinates', () => {
    const state = { ...deepClone(PRESETS.fifths), activeSide: 'front', viewMode: 'both', customScales: [], fullPrecision: true,
        cursor: Math.log10(3.2), slideOffset: Math.log10(3.2) - Math.log10(2) };
    const html = renderReadout(state, scales);
    assert.match(html, /\u2075\u221a\u2082: 2<\/span>/);
    assert.match(html, /x\u2075: 32<\/span>/);
    assert.match(html, /x\u207b\u2075: 0\.03125<\/span>/);
    state.slideOffset = .9;
    assert.equal((renderReadout(state, scales).match(/\u2075\u221a[^<]+: off scale/g) || []).length, 5);
    assert.equal(scaleReadings(pair, -1e-4, scales).outside, true);
    assert.equal(scaleReadings(pair, 1.0001, scales).outside, true);
});

test('new preset and example round-trip without changing legacy inverse-power conventions', () => {
    validateProgram({ ...PRESETS.fifths, customScales: [] });
    const state = { ...deepClone(PRESETS.fifths), activeSide: 'back', viewMode: 'both', customScales: [],
        cursor: .5, slideOffset: 0, magnification: 1 };
    const snapshot = exportableState(state);
    assert.deepEqual(parseProgramText(JSON.stringify(snapshot)), snapshot);
    close(makeRuntimeScale(scales.F5I).value(Math.log10(2)), 100000 / 32);
    assert.equal(scales.F5.pairedProduct, undefined);
    assert.equal(scales.F5I.pairedProduct, undefined);
    for (const key of ['pickettN3', 'pickettN4']) assert.ok(!JSON.stringify(PRESETS[key]).includes('FIFTH'));
    const legacy = programme({ id: '5R1', type: 'log', min: 1, max: 10 });
    validateProgram(legacy);
    assert.equal(buildLibrary(legacy).PICKETT_5R1.order, 5);
});

test('custom fifth-root captions and product captions are escaped, and product constants are configurable', () => {
    const customBank = { id: 'CUSTOM_BANK', type: 'rootStack', layers: branches.map(id => ({ scale: id, caption: '<img>', tone: 'green' })) };
    const data = programme(customBank);
    validateProgram(data);
    assert.ok(!render(customBank.id, false, buildLibrary(data)).includes('<img>'));
    assert.match(render(customBank.id, false, buildLibrary(data)), /&lt;img&gt;/);
    const customPair = { ...pair, id: 'PAIR', pairedProduct: 10, positiveCaption: '<img>', negativeCaption: '&negative' };
    validateProgram(programme(customPair));
    assert.equal(scaleReadings(customPair, 0, scales).texts[1], '&negative: 10');
    assert.match(render(customPair.id, false, { ...scales, PAIR: customPair }), /&lt;img&gt;/);
});

for (const [name, patch] of [
    ['zero product', { pairedProduct: 0 }], ['negative product', { pairedProduct: -1 }],
    ['non-number product', { pairedProduct: '1' }], ['infinite product', { pairedProduct: Infinity }],
    ['incompatible type', { type: 'linear' }], ['mixed pairing', { pairedSum: 90 }],
    ['reference interpretation', { referenceOnly: true }], ['zero minimum', { min: 0 }],
    ['overflowing reciprocal', { min: 1e-310, max: 1e-305 }],
    ['underflowing reciprocal', { min: 1e100, max: 1e105, pairedProduct: 1e-300 }]
]) test(`shared product pair rejects ${name}`, () => {
    assert.throws(() => validateProgram(programme({ ...pair, id: 'CUSTOM_PAIR', ...patch })));
});

for (const [name, layers] of [
    ['only four branches', branches.slice(0, 4)], ['six branches', [...branches, branches[0]]],
    ['reverse order', [...branches].reverse()], ['duplicate branch', [...branches.slice(0, 4), branches[0]]],
    ['mixed orders', ['PICKETT_R1', ...branches.slice(1)]], ['nested pair', ['F5_PAIR', ...branches.slice(1)]]
]) test(`fifth-root bank rejects ${name}`, () => {
    assert.throws(() => validateProgram(programme({ id: 'BAD_BANK', type: 'rootStack', layers })));
});

test('paired product rows cannot hide inside a single-line composite component', () => {
    for (const type of ['composite', 'segmented'])
        assert.throws(() => validateProgram(programme({ id: 'BAD', type, layers: ['F5_PAIR', 'D'] })));
    const state = programme({ id: 'PAIR', type: 'rootStack', layers: branches });
    state.customScales.push({ ...scales.PICKETT_5R5, pMin: .01 });
    assert.throws(() => validateProgram(state));
});

test('shared product metadata also works with a reversed log mapping and manual ticks', () => {
    const def = { id: 'CUSTOM_REVERSE', type: 'inverseLog', min: 1, max: 100,
        pairedProduct: 1, ticks: [{ value: 2, label: 'two', kind: 'major' }] };
    validateProgram(programme(def));
    const rt = makeRuntimeScale(def);
    assert.deepEqual(scaleReadings(def, 0, scales).texts, ['Primary: 100', 'Secondary: 0.01']);
    assert.deepEqual(scaleReadings(def, 1, scales).texts, ['Primary: 1', 'Secondary: 1']);
    const ticks = generateTicks(def, rt);
    assert.equal(ticks.length, 1);
    assert.equal(ticks[0].positiveLabel, 'two');
    assert.equal(ticks[0].negativeLabel, '0.5');
});
