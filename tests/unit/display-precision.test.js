import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { formatUseful, formatValue, formatTickPrecision } from '#core/format.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { generateTicks } from '#core/ticks/index.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { exportableState, normalizeState } from '#model/program.js';
import { validateProgram } from '#model/validation.js';
import { scaleReadings, cursorScaleReadings } from '#ui/readout-values.js';
import { renderReadout } from '#ui/readout.js';
import { renderScaleRow } from '#ui/scale-markup.js';
import { positionText, positionDescription, movedPosition } from '#ui/motion.js';

const scales = BUILTIN_SCALES;

test('ordinary precision keeps four significant digits, including the requested P endpoint', () => {
    for (const [value, expected] of [
        [0, '0'], [-0, '0'], [Math.PI, '3.142'], [-12.34567, '-12.35'],
        [.01234567, '0.01235'], [Math.sqrt(.99), '0.995'], [84.2608295, '84.26'],
        [1.23456e-8, '1.235e-8'], [1.23456e8, '1.235e8']
    ]) assert.equal(formatUseful(value), expected, String(value));
    assert.equal(formatUseful(Math.sqrt(.99), scales.P), '0.995');
    assert.equal(formatUseful(1.0010005, scales.D), '1.001');
});

test('near-unity log-log numbers exclude only the shared leading 1 above unity', () => {
    const cases = [
        [Math.exp(.001), '1.001001'], [Math.exp(.01), '1.01005'],
        [Math.exp(.1), '1.1052'], [Math.exp(-.001), '0.999'],
        [Math.exp(-.01), '0.99'], [Math.exp(-.1), '0.9048'],
        [1.000000012345, '1.00000001234'], [.999999987655, '1'],
        [1, '1'], [Math.E, '2.718'], [Math.exp(-10), '4.54e-5']
    ];
    for (const def of [scales.LL0, scales.LL00, scales.P10LL0, scales.PN3LL0, scales.FC284_LL1])
        for (const [value, expected] of cases)
            assert.equal(formatUseful(value, def), expected, `${def.id}: ${value}`);
});

test('hypotenuse values near unity retain their useful change without changing P policy', () => {
    for (const type of ['hypotenuseLow', 'hypotenuseHigh'])
        assert.equal(formatUseful(Math.sqrt(1.01), { type }), '1.004988');
    assert.equal(formatUseful(Math.sqrt(.99), { type: 'pythagorean' }), '0.995');
    assert.equal(scales.FC284_H.precisionOrigin, 1);
    for (const value of [Math.sqrt(1.01), 1.023456, 1.8])
        assert.equal(formatValue(value, scales.FC284_H), formatValue(value, scales.H1), 'Mathema and ordinary hypotenuse readouts agree');
});

test('all values below unity use the same four-figure budget', () => {
    for (const def of [scales.D, scales.P, scales.LL01, scales.PN3LL0, scales.FC284_H, { unit: 'K' }])
        for (const [value, expected] of [[.9900498337491681, '0.99'], [.999987654, '1'], [.123456789, '0.1235'], [.00123456789, '0.001235']])
            assert.equal(formatUseful(value, def), expected, `${def.id || def.unit}: ${value}`);
});

test('readout formatting switches precision while preserving units and special values', () => {
    assert.equal(formatValue(Math.sqrt(10), scales.D), '3.162');
    assert.equal(formatValue(Math.sqrt(10), scales.D, true), '3.16228');
    assert.equal(formatValue(84.2608295, { type: 'cos' }), '84.26°');
    assert.equal(formatValue(12.34567, { unit: 'gon' }), '12.35 gon');
    assert.equal(formatValue(12.34567, { unit: 'K' }), '12.35 K');
    assert.equal(formatValue(Infinity, {}), '∞');
    assert.equal(formatValue(NaN, {}), '--');
});

test('extended precision never discards useful near-unity digits', () => {
    for (const def of [scales.LL0, scales.LL00, scales.FC284_LL1, { type: 'hypotenuseLow' }])
        for (const value of [1.000000012345, .999999987655, 1.000000000012345,
            .999999999987655, Math.exp(.001), Math.exp(-.001)]) {
            const reduced = Number(formatValue(value, def));
            const full = Number(formatValue(value, def, true));
            assert.ok(Math.abs(full - value) <= Math.abs(reduced - value), `${def.id || def.type}: ${value}`);
            assert.equal(Math.sign(full - 1), Math.sign(value - 1), 'extended readouts must not collapse a distinct value to unity');
        }
});

test('sexagesimal readings keep their notation with carry-safe precision rounding', () => {
    const def = { ...scales.S, angleNotation: 'sexagesimal', pairedSum: 90 };
    const value = Math.asin(.1) * 180 / Math.PI;
    assert.equal(formatValue(value, def), '5°44′20.4″');
    assert.equal(formatValue(value, def, true), '5°44′21.01″');
    assert.equal(formatValue(59.99999, def), '60°');
    const [tick] = formatTickPrecision([{ pos: 0, value, kind: 'index',
        positiveLabel: '5°44′21.01″', negativeLabel: '84°15′38.99″' }], def);
    assert.equal(tick.positiveLabel, '5°44′20.4″');
    assert.equal(tick.negativeLabel, '84°15′36″');
});

test('numeric tick captions round without altering authored symbolic captions or tick values', () => {
    const ticks = [
        { pos: 0, value: Math.sqrt(.99), label: '0.99499', kind: 'index' },
        { pos: .25, value: Math.PI, label: 'π', kind: 'gauge' },
        { pos: .5, value: 10 / Math.PI, label: '10/π', kind: 'index' },
        { pos: .75, value: 1, label: '10 | 1', kind: 'index' },
        { pos: 1, value: 2, label: 'Cu', kind: 'gauge' },
        { pos: .8, value: 5, label: '0.5', kind: 'major' }
    ];
    const before = structuredClone(ticks);
    const short = formatTickPrecision(ticks, scales.P);
    assert.deepEqual(short.map(t => t.label), ['0.995', 'π', '10/π', '10 | 1', 'Cu', '0.5']);
    assert.deepEqual(short.map(({ pos, value }) => ({ pos, value })),
        before.map(({ pos, value }) => ({ pos, value })));
    assert.deepEqual(ticks, before, 'formatting must not mutate source ticks or a cached engraving');
    assert.equal(formatTickPrecision(ticks, scales.P, true)[0].label, '0.99499');
});

test('Mathema expression log-log captions receive the same useful precision policy', () => {
    const value = Math.exp(.01);
    const tick = { pos: .2, value, label: '1.01005017', kind: 'index' };
    assert.equal(scales.FC284_LL1.type, 'expression');
    assert.equal(formatTickPrecision([tick], scales.FC284_LL1)[0].label, '1.01005');
});

test('paired captions round both members independently from their full values', () => {
    const positive = Math.exp(.01), negative = 1 / positive;
    const tick = { pos: .2, value: positive, reciprocalValue: negative, kind: 'index',
        positiveLabel: '1.01005017', negativeLabel: '0.990049834' };
    const [short] = formatTickPrecision([tick], scales.PN3LL0);
    assert.equal(short.positiveLabel, '1.01005');
    assert.equal(short.negativeLabel, '0.99');
    assert.equal(short.value, positive);
    assert.equal(short.reciprocalValue, negative);
});

test('precision switching preserves every catalogue graduation in both graduation modes', () => {
    const geometry = ticks => ticks.map(({ pos, value, reciprocalValue, kind }) => ({ pos, value, reciprocalValue, kind }));
    let checked = 0;
    for (const def of Object.values(scales)) {
        if (['composite', 'segmented', 'rootStack'].includes(def.type)) continue;
        const rt = makeRuntimeScale(def);
        for (const graduationMode of ['conventional', 'adaptive']) {
            const options = { graduationMode };
            const legacy = generateTicks(def, rt, 1600, 1.65, options);
            const full = generateTicks(def, rt, 1600, 1.65, { ...options, fullPrecision: true });
            const short = generateTicks(def, rt, 1600, 1.65, { ...options, fullPrecision: false });
            assert.deepEqual(geometry(short), geometry(legacy), `${def.id}, ${graduationMode}, reduced`);
            assert.deepEqual(geometry(full), geometry(legacy), `${def.id}, ${graduationMode}, extended`);
            for (let i = 0; i < legacy.length; i++) {
                const tick = legacy[i];
                if (tick.kind === 'gauge') continue; // Numeric gauge inscriptions may denote other units or decades.
                for (const key of ['label', 'positiveLabel', 'negativeLabel']) {
                    const before = Number(tick[key]), reduced = Number(short[i][key]), extended = Number(full[i][key]);
                    if (!tick[key] || ![before, reduced, extended].every(Number.isFinite)) continue;
                    const value = key === 'negativeLabel'
                        ? def.pairedSum !== undefined ? def.pairedSum - tick.value : (def.pairedProduct ?? 1) / tick.value
                        : tick.value;
                    // An inscription in different units or a normalised decade is not a direct reading.
                    if (!Number.isFinite(value) || Math.abs(before - value) > Math.abs(value) * .01) continue;
                    const tolerance = Math.max(Math.abs(value), Number.MIN_VALUE) * Number.EPSILON * 8;
                    assert.ok(Math.abs(extended - value) <= Math.abs(reduced - value) + tolerance,
                        `${def.id}, ${graduationMode}, ${key}: extended ${extended} is less accurate than reduced ${reduced} for ${value}`);
                }
            }
        }
        checked++;
    }
    assert.ok(checked >= 300, 'Audit the complete renderable catalogue, not a hand-picked sample');
});

test('reciprocal LL endpoints and readouts agree across aliases and graduation modes', () => {
    for (const id of ['LL01', 'UL_LL01', 'GP_LL01']) {
        const def = scales[id], rt = makeRuntimeScale(def);
        assert.ok(Math.abs(rt.value(0) - Math.exp(-.01)) < 1e-14, `${id} raw left value`);
        assert.deepEqual(scaleReadings(def, 0, scales).texts, ['0.99'], `${id} readout`);
        for (const graduationMode of ['conventional', 'adaptive']) {
            const ticks = generateTicks(def, rt, 1600, 1.65, { graduationMode, fullPrecision: false });
            assert.equal(ticks.find(t => Math.abs(t.pos) < 1e-12).label, '0.99', `${id}, ${graduationMode}, left`);
            assert.equal(ticks.find(t => Math.abs(t.pos - 1) < 1e-12).label, '0.9048', `${id}, ${graduationMode}, right`);
        }
    }
    for (const [id, expected] of [['P', '0.995'], ['LL0', '1.001001'], ['LL00', '0.999']]) {
        const def = scales[id];
        for (const graduationMode of ['conventional', 'adaptive']) {
            const ticks = generateTicks(def, makeRuntimeScale(def), 1600, 1.65, { graduationMode, fullPrecision: false });
            assert.equal(ticks.find(t => Math.abs(t.pos) < 1e-12).label, expected, `${id}, ${graduationMode}`);
        }
    }
});

test('numeric captions round raw values once, including manually listed paired angles', () => {
    // Recover the actual value even when a legacy endpoint has only five figures.
    const raw = Math.exp(-.01);
    assert.equal(formatTickPrecision([{ pos: 0, value: raw, label: '0.99005' }], scales.LL01)[0].label, '0.99');
    const def = scales.P14_T_MIL, rt = makeRuntimeScale(def);
    const ticks = generateTicks(def, rt, 1600, 1.65, { fullPrecision: false });
    const left = ticks.find(t => Math.abs(t.pos - rt.pMin) < 1e-12);
    assert.equal(left.positiveLabel, '101.5');
    assert.equal(left.negativeLabel, '1498'); // 1600 - atan(.1)*3200/pi = 1498.478...
    assert.deepEqual(scaleReadings(def, rt.pMin, scales).texts, ['Black: 101.5 mil', 'Red: 1498 mil']);
});

test('wide log-log endpoint captions recover useful digits from full numeric values', () => {
    for (const graduationMode of ['conventional', 'adaptive']) {
        const def = scales.LL4, rt = makeRuntimeScale(def);
        const short = generateTicks(def, rt, 1600, 1.65, { graduationMode, fullPrecision: false });
        assert.equal(short.find(t => Math.abs(t.pos) < 1e-12).label, '22030');
        assert.equal(short.find(t => Math.abs(t.pos - 1) < 1e-12).label, '2.688e43');
        const full = generateTicks(def, rt, 1600, 1.65, { graduationMode, fullPrecision: true });
        for (const pos of [0, 1]) {
            const raw = rt.value(pos);
            const numeric = ticks => Number(ticks.find(t => Math.abs(t.pos - pos) < 1e-12).label);
            assert.ok(Math.abs(numeric(full) - raw) <= Math.abs(numeric(short) - raw));
        }
    }
});

test('paired readouts preserve complement and reciprocal semantics under both precisions', () => {
    const angle = { ...scales.S, pairedSum: 90 };
    assert.deepEqual(scaleReadings(angle, 0, scales).texts, ['Black: 5.739°', 'Red: 84.26°']);
    const product = { ...scales.D, pairedProduct: 1 };
    assert.deepEqual(scaleReadings(product, .5, scales).texts, ['Primary: 3.162', 'Secondary: 0.3162']);
    assert.deepEqual(scaleReadings(product, .5, scales, true).texts, ['Primary: 3.16228', 'Secondary: 0.316228']);
    assert.deepEqual(scaleReadings(scales.PN3LL0, .5, scales).texts, ['+: 1.003167', '−: 0.9968']);
});

test('chemical references retain their symbols while rounding the actual mass readout', () => {
    const reference = { ...scales.D, referenceOnly: true,
        ticks: [{ value: 6.3546, label: 'Cu', mass: 63.546, kind: 'gauge' }] };
    const p = Math.log10(6.3546);
    assert.deepEqual(scaleReadings(reference, p, scales).texts, ['Nearest: Cu = 63.55']);
    assert.deepEqual(scaleReadings(reference, p, scales, true).texts, ['Nearest: Cu = 63.546']);
});

test('cursor auxiliary readings and off-scale states obey the same precision setting', () => {
    const marks = [{ label: 'Auxiliary', offset: .1 }];
    assert.deepEqual(cursorScaleReadings(scales.D, .5, scales, marks, .5).texts,
        ['Main: 3.162', 'Auxiliary: 3.981']);
    assert.deepEqual(cursorScaleReadings(scales.D, .5, scales, marks, .5, true).texts,
        ['Main: 3.16228', 'Auxiliary: 3.98107']);
    assert.equal(cursorScaleReadings(scales.D, .95, scales, marks, .95).texts.at(-1), 'Auxiliary: off scale');
});

test('top stator, translated slide and bottom stator readouts all receive the setting', () => {
    const state = { ...structuredClone(DEFAULT_STATE), cursor: .5, slideOffset: .1,
        activeSide: 'front', viewMode: 'single', fullPrecision: false,
        sides: { front: { topStator: ['D'], slide: ['C'], bottomStator: ['P'] } } };
    const readRails = html => Object.fromEntries([...html.matchAll(/data-readout-rail="([^"]+)"[^>]*>[\s\S]*?<div class="value">([^<]+)<\/div>/g)]
        .map(([, rail, value]) => [rail, value]));
    assert.deepEqual(readRails(renderReadout(state, scales)), { topStator: '3.162', slide: '2.512', bottomStator: '0.9487' });
    state.fullPrecision = true;
    assert.deepEqual(readRails(renderReadout(state, scales)), { topStator: '3.16228', slide: '2.51189', bottomStator: '0.948683' });
});

test('scale rows explicitly default to useful captions while extended mode restores detailed endpoints', () => {
    const context = { library: scales, width: 1600, minGap: 1.65 };
    const shortP = renderScaleRow('P', false, 'topStator', 0, 1, context);
    const fullP = renderScaleRow('P', false, 'topStator', 0, 1, { ...context, fullPrecision: true });
    assert.match(shortP, /data-label-text="0\.995"/);
    assert.doesNotMatch(shortP, /data-label-text="0\.99499"/);
    assert.match(fullP, /data-label-text="0\.99499"/);
    assert.match(renderScaleRow('LL0', false, 'topStator', 0, 1, context), /data-label-text="1\.001001"/);
    assert.match(renderScaleRow('LL0', false, 'topStator', 0, 1, { ...context, fullPrecision: true }), /data-label-text="1\.0010005"/);
});

test('the precision option follows Compact scale numbering and has explanatory help', () => {
    const html = readFileSync(new URL('../../src/index.html', import.meta.url), 'utf8');
    assert.match(html, /id="compactScaleToggle"[^>]*\/>[^<]*<\/label>\s*<label[^>]*><input id="fullPrecisionToggle"[^>]*type="checkbox"/);
    assert.match(html, /id="fullPrecisionToggle"[^>]*aria-describedby="precisionHelp"/);
    assert.match(html, /id="precisionHelp"/);
});

test('motion displays round only presentation; full mode still reveals very fine nudges', () => {
    assert.equal(positionText(.123456789, 'cursor'), '0.1235');
    assert.equal(positionText(.123456789, 'cursor', true), '0.123457');
    assert.equal(positionText(.123456789, 'slideOffset'), '+0.1235');
    assert.equal(positionText(-.123456789, 'slideOffset'), '-0.1235');
    assert.match(positionDescription(.123456789, 'cursor'), /0\.1235 scale lengths from the left index/);
    assert.match(positionDescription(-.123456789, 'slideOffset'), /0\.1235 scale lengths to the left/);
    const exact = movedPosition(.5, 'cursor', { delta: .00001 });
    assert.equal(exact, .50001);
    assert.equal(positionText(.5, 'cursor'), positionText(exact, 'cursor'));
    assert.notEqual(positionText(.5, 'cursor', true), positionText(exact, 'cursor', true));
});

test('precision defaults to useful digits and round-trips without quantising state', () => {
    assert.equal(DEFAULT_STATE.fullPrecision, false);
    const state = { ...structuredClone(DEFAULT_STATE), cursor: .123456789012345, slideOffset: -.012345678901234 };
    delete state.fullPrecision;
    normalizeState(state);
    assert.equal(state.fullPrecision, false);
    for (const fullPrecision of [false, true]) {
        state.fullPrecision = fullPrecision;
        const exported = exportableState(state);
        assert.equal(exported.fullPrecision, fullPrecision);
        assert.equal(exported.cursor, state.cursor);
        assert.equal(exported.slideOffset, state.slideOffset);
        assert.doesNotThrow(() => validateProgram(exported));
        assert.throws(() => validateProgram({ ...exported, fullPrecision: 'yes' }), /fullPrecision must be a boolean/);
    }
});

test('custom near-unity precision metadata accepts only the supported unity origin', () => {
    const programme = structuredClone(DEFAULT_STATE);
    programme.customScales[0].precisionOrigin = 1;
    assert.doesNotThrow(() => validateProgram(programme));
    for (const invalid of [0, 2, '1', true, null]) {
        programme.customScales[0].precisionOrigin = invalid;
        assert.throws(() => validateProgram(programme), /precisionOrigin must be 1/);
    }
});
