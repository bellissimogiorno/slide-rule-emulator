import test from 'node:test';
import assert from 'node:assert/strict';
import { faberAristoCursors } from '#catalog/cursors/faber-aristo.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { PRESETS } from '#catalog/presets.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { cursorMarkSegments, marksForScale } from '#ui/cursor-marks.js';
import { close } from './helpers.js';

const rt = id => makeRuntimeScale(BUILTIN_SCALES[id]);
const cursorMark = (preset, side, id) => faberAristoCursors[preset][side].cursorMarks.find(mark => mark.id === id);

for (const preset of ['faber283n', 'aristo0971', 'aristo0972']) {
    test(`${preset}: circle area follows the diameter squared, not the C/D pitch`, () => {
        const area = cursorMark(preset, 'front', preset === 'faber283n' ? 'faber283-area' : 'aristo-area');
        for (const diameter of [1.25, 2, 3.2, 4.8, 7.5, 9]) {
            const position = rt('D').pos(diameter);
            for (const row of ['A', 'B']) {
                close(rt(row).value(position + area.offset), Math.PI * diameter ** 2 / 4);
                close(rt('D').value(rt(row).pos(Math.PI * diameter ** 2 / 4) - area.offset), diameter);
            }
        }
        // The manufacturer's rounded 4.8 cm -> 18.1 cm² example.
        assert.equal(rt('A').value(rt('D').pos(4.8) + area.offset).toFixed(1), '18.1');
    });
}

for (const preset of ['aristo0971', 'aristo0972']) {
    test(`${preset}: the lower diameter mark reverses the area conversion`, () => {
        const diameter = cursorMark(preset, 'front', 'aristo-diameter');
        for (const area of [2, 8.04, 18.1, 36, 60]) {
            const position = rt('A').pos(area);
            for (const row of ['C', 'D'])
                close(rt(row).value(position + diameter.offset), Math.sqrt(4 * area / Math.PI));
        }
    });
    test(`${preset}: PS/kW uses quadratic scales and metric horsepower`, () => {
        const ps = cursorMark(preset, 'front', 'aristo-ps');
        const psInKw = .73549875;
        for (const kw of [1.5, 5.15, 20, 45, 70]) {
            for (const row of ['A', 'B']) {
                close(rt(row).value(rt(row).pos(kw) + ps.offset), kw / psInKw);
                close(rt(row).value(rt(row).pos(kw / psInKw) - ps.offset), kw);
            }
        }
        assert.equal(rt('A').value(rt('A').pos(20) + ps.offset).toFixed(1), '27.2');
        assert.equal(rt('A').value(rt('A').pos(7) - ps.offset).toFixed(2), '5.15');
        assert.deepEqual(ps.scales, ['A', 'B']);
    });
}

for (const [preset, side, id] of [
    ['faber283n', 'front', 'faber283-360'],
    ['aristo0971', 'back', 'aristo-36'],
    ['aristo0972', 'back', 'aristo-36']
]) {
    test(`${preset}: folded cursor converts 150 km/h to 41.666… m/s`, () => {
        const mark = cursorMark(preset, side, id);
        const position = rt('DF').pos(1.5) - mark.offset;
        close(rt('D').value(position) * 10, 150 / 3.6);
        // Test the mantissa relationship across the folded scale discontinuity.
        for (const x of [1.2, 2, 2.9, 4, 7, 8.5]) {
            const read = rt('DF').value(rt('D').pos(x) + mark.offset);
            const ratio = 3.6 * x / read;
            close(Math.log10(ratio), Math.round(Math.log10(ratio)));
        }
    });
}

test('auxiliary strokes are limited to their documented row pairs', () => {
    for (const [preset, sides] of Object.entries(faberAristoCursors)) {
        for (const [key, metadata] of Object.entries(sides)) {
            const side = { ...PRESETS[preset].sides[key], ...metadata };
            const available = new Set([...side.topStator, ...side.slide, ...side.bottomStator]);
            for (const mark of metadata.cursorMarks || []) {
                assert.ok(mark.scales.every(id => available.has(id)), `${preset}/${key}/${mark.id}`);
                assert.equal(mark.showLabel, false);
            }
            assert.equal(marksForScale(side, 'LL3').length, 0);
            assert.equal(marksForScale(side, 'K').length, 0);
        }
    }
    const faber = { ...PRESETS.faber283n.sides.front, ...faberAristoCursors.faber283n.front };
    const segments = cursorMarkSegments(faber);
    assert.equal(segments.filter(({ mark }) => mark.id === 'faber283-area').length, 2,
        'A and B are interrupted by folded DF/CF rows on this instrument');
    assert.equal(segments.filter(({ mark }) => mark.id === 'faber283-360').length, 1);
    const aristo = { ...PRESETS.aristo0972.sides.front, ...faberAristoCursors.aristo0972.front };
    assert.equal(cursorMarkSegments(aristo).length, 3, 'each selected pair is adjacent');
});

test('uncertain extra marks are omitted without claiming the originals were single-line', () => {
    assert.deepEqual(Object.keys(faberAristoCursors), ['faber282n', 'faber283n', 'aristo0971', 'aristo0972']);
    assert.equal(faberAristoCursors.faber282n.front.cursorMarks, undefined);
    assert.equal(faberAristoCursors.faber282n.back.cursorMarks, undefined);
    assert.equal(faberAristoCursors.faber283n.back.cursorMarks, undefined);
    assert.equal(faberAristoCursors.aristo0972.back.cursorMarks.length, 1);
    assert.notEqual(faberAristoCursors.aristo0971.front.cursorMarks,
        faberAristoCursors.aristo0972.front.cursorMarks, 'no cross-preset mutation alias');
    for (const sides of Object.values(faberAristoCursors)) for (const side of Object.values(sides)) {
        assert.equal(side.cursorFrame, 'clear');
        assert.equal(side.cursorLineTone, 'neutral');
    }
});

test('specimen housing widths stay proportional to the 250 mm graduated track', () => {
    for (const [id, millimetres] of [['faber282n', 47], ['faber283n', 47], ['aristo0971', 38], ['aristo0972', 60]]) {
        for (const side of Object.values(faberAristoCursors[id]))
            close(side.cursorWidth * 250, millimetres);
    }
});
