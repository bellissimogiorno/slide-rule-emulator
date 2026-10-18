import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mathemaScales } from '#catalog/scales/mathema.js';
import { mathemaPresets } from '#catalog/presets/mathema.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { close } from './helpers.js';

const preset = mathemaPresets.faber284n;
const scale = suffix => makeRuntimeScale(mathemaScales[`FC284_${suffix}`]);
const mark = id => preset.sides.front.cursorMarks.find(item => item.id === id);
const readAt = (suffix, mainPosition, cursorMark) =>
    scale(suffix).value(mainPosition + cursorMark.offset);

test('Mathema exponent banks use five row-specific marks with their middle on the main hairline', () => {
    for (const [prefix, scaleId] of [['e', 'FC284_E'], ['eg', 'FC284_EG']]) {
        const bank = preset.sides.front.cursorMarks.filter(item => item.id.startsWith(`mathema-${prefix}-`));
        assert.equal(bank.length, 5);
        for (const item of bank) assert.deepEqual(item.scales, [scaleId]);
        close(bank[2].offset, 0);
        assert.ok(bank[0].offset < bank[1].offset && bank[1].offset < 0);
        assert.ok(bank[3].offset > 0 && bank[4].offset > bank[3].offset);
    }
    assert.equal(preset.sides.front.cursorMarks.length, 13);
    assert.equal(preset.sides.back.cursorMarks.length, 2);
    assert.ok(mark('mathema-eg-4').offset > mark('mathema-e-4').offset,
        '140 gon is not exactly 2.2 radians');
});

test('physical exponential calibration agrees with the photographed main-hairline alignment', () => {
    // The supplied photograph has Y approximately .15 and the main hairline
    // at E approximately .61 / EG approximately 39. Exact values follow from
    // the aligned 4.4 / 10³ and 280 / 10³ marks, not a fit to image pixels.
    const p = scale('Y').pos(.15);
    close(scale('E').value(p), Math.log(150) - 4.4);
    close(scale('EG').value(p), 200 * Math.log(150) / Math.PI - 280);
});

test('each radian exponent mark computes the exponential through the main Y hairline', () => {
    // Independently choose a main Y within the physical principal decade.
    // Derive the argument from exp(X)=Y*10^(j+1), then check the engraved
    // residual under the chosen auxiliary hairline in both directions.
    for (let j = 0; j < 5; j++) {
        for (const y of [.1, .15, .3, .6, 1]) {
            const argument = Math.log(y * 10 ** (j + 1));
            const residual = argument - 2.2 * j;
            const p = scale('Y').pos(y);
            close(readAt('E', p, mark(`mathema-e-${j}`)), residual);
            close(scale('Y').value(scale('E').pos(residual) - mark(`mathema-e-${j}`).offset), y);
        }
    }
    const mainPosition = scale('E').pos(.4) - mark('mathema-e-3').offset;
    close(scale('Y').value(mainPosition) * 1e4, Math.exp(7));
    close(scale('I').value(mainPosition) * 1e-4, Math.exp(-7));
});

test('manufacturer gon examples use the designated auxiliary mark and decimal multiplier', () => {
    // Manufacturer instructions, printed page 25: 100 gon using the first
    // mark, and 600 gon using 560 / 10^5 with a residual of 40 gon.
    for (const [argument, j, residual] of [[100, 0, 100], [600, 4, 40]]) {
        const p = scale('EG').pos(residual) - mark(`mathema-eg-${j}`).offset;
        const multiplier = 10 ** (j + 1);
        close(scale('Y').value(p) * multiplier, Math.exp(argument * Math.PI / 200));
        close(scale('I').value(p) / multiplier, Math.exp(-argument * Math.PI / 200));
    }
    for (let j = 0; j < 5; j++) {
        const y = .3;
        const argument = 200 * Math.log(y * 10 ** (j + 1)) / Math.PI;
        close(readAt('EG', scale('Y').pos(y), mark(`mathema-eg-${j}`)), argument - 140 * j);
    }
});

test('pi gauges preserve their distinct quadratic and principal-scale factors', () => {
    const p = scale('Y').pos(.2);
    const left = mark('mathema-left'), right = mark('mathema-right');
    const pi4 = mark('mathema-pi4');
    assert.deepEqual(pi4.scales, ['FC284_A', 'FC284_B']);
    for (const labelledGauge of [left, right, pi4]) assert.equal(labelledGauge.labelTone, 'red');
    const ordinaryScales = ['FC284_T', 'FC284_H', 'FC284_A', 'FC284_B', 'FC284_BI',
        'FC284_I', 'FC284_y', 'FC284_Y', 'FC284_P', 'FC284_S'];
    assert.deepEqual(left.scales, ordinaryScales);
    assert.deepEqual(right.scales, ordinaryScales);
    for (const suffix of ['A', 'B']) {
        close(readAt(suffix, p, pi4) / scale(suffix).value(p), Math.PI / 4);
        close(readAt(suffix, p, right) / scale(suffix).value(p), Math.PI / 2);
    }
    for (const suffix of ['Y', 'y']) {
        close(readAt(suffix, p, right) / readAt(suffix, p, left), Math.PI / 2);
    }
    for (const [i, front] of [left, right].entries()) {
        close(preset.sides.back.cursorMarks[i].offset, front.offset);
        assert.equal(preset.sides.back.cursorMarks[i].labelTone, undefined);
        assert.equal(preset.sides.back.cursorMarks[i].scales, undefined);
    }
});

test('photographed cap inscriptions are independent of the calibrated hairline geometry', () => {
    const { front, back } = preset.sides;
    assert.equal(front.cursorLineTone, 'red');
    assert.equal(back.cursorLineTone, undefined);
    assert.equal(back.cursorCaptions, undefined);
    assert.equal(front.cursorCaptions.length, 17);
    assert.equal(new Set(front.cursorCaptions.map(caption => caption.id)).size, 17);
    assert.ok(front.cursorMarks.every(item => item.showLabel === false));
    assert.ok(front.cursorCaptions.every(caption => caption.tone === 'red'));

    // Each cap has five aligned numerical inscriptions, with the operator
    // between its first two marks. The lower inscription faces outward.
    const upper = front.cursorCaptions.filter(caption => caption.zone === 'topCap');
    const lower = front.cursorCaptions.filter(caption => caption.zone === 'bottomCap');
    assert.deepEqual(upper.map(caption => caption.lines), [
        ['10', 'X'], ['10²', '140'], ['10³', '280'], ['10⁴', '420'], ['10⁵', '560'], ['y', '+']
    ]);
    assert.deepEqual(lower.map(caption => caption.lines), [
        ['X', '10'], ['2.2', '10²'], ['4.4', '10³'], ['6.6', '10⁴'], ['8.8', '10⁵'], ['+', 'y']
    ]);
    for (let j = 0; j < 5; j++) {
        close(upper[j].offset, mark(`mathema-eg-${j}`).offset);
        close(lower[j].offset, mark(`mathema-e-${j}`).offset);
    }
    close(upper[5].offset, (upper[0].offset + upper[1].offset) / 2);
    close(lower[5].offset, (lower[0].offset + lower[1].offset) / 2);

    // There is still one implicit main hairline. Its extra printed '1' is a
    // caption, not a new mark; only the two scoped exponent marks share zero.
    assert.deepEqual(front.cursorMarks.filter(item => item.offset === 0).map(item => item.id),
        ['mathema-eg-2', 'mathema-e-2']);
});

test('photographed pi captions identify the correct row and reference hairline once', () => {
    const gauges = preset.sides.front.cursorCaptions.filter(caption => caption.zone === 'row');
    assert.deepEqual(gauges.map(({ lines, scale, edge, align, fraction = false }) =>
        ({ lines, scale, edge, align, fraction })), [
        { lines: ['π', '4'], scale: 'FC284_A', edge: 'top', align: 'center', fraction: true },
        { lines: ['1'], scale: 'FC284_A', edge: 'top', align: 'end', fraction: false },
        { lines: ['π', '2'], scale: 'FC284_A', edge: 'top', align: 'end', fraction: true },
        { lines: ['1'], scale: 'FC284_Y', edge: 'bottom', align: 'start', fraction: false },
        { lines: ['π', '2'], scale: 'FC284_Y', edge: 'bottom', align: 'end', fraction: true }
    ]);
    close(gauges[0].offset, mark('mathema-pi4').offset);
    close(gauges[1].offset, 0);
    close(gauges[2].offset, mark('mathema-right').offset);
    close(gauges[3].offset, mark('mathema-left').offset);
    close(gauges[4].offset, mark('mathema-right').offset);
});

test('the Mathema example preserves the complete calibrated cursor configuration', () => {
    const example = JSON.parse(readFileSync(new URL('../../examples/faber284n-both.json', import.meta.url), 'utf8'));
    assert.deepEqual(example.sides, preset.sides);
    assert.equal(example.instrumentNote, preset.instrumentNote);
});
