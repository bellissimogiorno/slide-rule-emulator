import test from 'node:test';
import assert from 'node:assert/strict';
import { otherMakerCursors } from '#catalog/cursors/other-makers.js';
import { historicalPresets } from '#catalog/presets/historical.js';
import { chemicalPresets } from '#catalog/presets/chemical.js';
import { graphoplexPresets } from '#catalog/presets/graphoplex.js';
import { ultralogPresets } from '#catalog/presets/ultralog.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { makeRuntimeScale } from '#core/mappings.js';
import { validateProgram } from '#model/validation.js';
import { cursorMarkSegments, marksForScale, renderCursor } from '#ui/cursor-marks.js';
import { close } from './helpers.js';

const base = { ...historicalPresets, ...chemicalPresets, ...graphoplexPresets, ...ultralogPresets };
const face = (model, side) => ({ ...base[model].sides[side], ...otherMakerCursors[model][side] });
const mark = (model, side, id) => face(model, side).cursorMarks.find(m => m.id === id);
const rt = id => makeRuntimeScale(BUILTIN_SCALES[id]);

for (const model of Object.keys(otherMakerCursors)) {
    test(`${model}: selected cursor metadata validates on its actual row arrangement`, () => {
        validateProgram({ ...base[model], customScales: [], sides: {
            front: face(model, 'front'), back: face(model, 'back')
        } });
    });
}

test('catalogued single-line cursors do not acquire invented auxiliary readings', () => {
    for (const model of ['thorntonAA010', 'hemmi257', 'flyingFish1017', 'thorntonF5100', 'ultralog']) {
        for (const side of ['front', 'back']) {
            assert.deepEqual(cursorMarkSegments(face(model, side)), []);
            assert.deepEqual(face(model, side).cursorCaptions, []);
            assert.equal((renderCursor(face(model, side), 'cursor').match(/cursor-mark-line/g) || []).length, 0);
        }
    }
    assert.equal(otherMakerCursors.hemmi257.front.cursorFrame, 'metal');
    assert.equal(otherMakerCursors.hemmi257.back.cursorFrame, 'metal');
    assert.equal(otherMakerCursors.thorntonF5100.front.cursorFrame, 'clear');
    assert.equal(otherMakerCursors.thorntonF5100.back.cursorFrame, undefined);
    assert.equal(otherMakerCursors.ultralog.front.cursorFrame, undefined);
});

test('recorded cursor widths are relative to engraved length, not overall body length', () => {
    for (const [model, millimetres] of [['hemmi257', 30], ['flyingFish1017', 38], ['graphoplex690a', 39], ['thorntonAA010', 39]]) {
        for (const side of ['front', 'back']) close(otherMakerCursors[model][side].cursorWidth * 250, millimetres);
    }
    for (const model of ['thorntonF5100', 'graphoplex691a', 'ultralog']) {
        assert.equal(otherMakerCursors[model].front.cursorWidth, undefined,
            'do not infer a dimension from a similar model or the body length');
    }
});

for (const model of ['graphoplex690a', 'graphoplex691a']) {
    test(`${model}: manufacturer power conversion works in both directions on C/D`, () => {
        for (const side of ['front', 'back']) {
            const kw = mark(model, side, 'graphoplex-kw').offset;
            const ps = mark(model, side, 'graphoplex-ps').offset;
            for (const power of [0.8, 1.5, 3, 6]) {
                // Numbers below one use the next decimal decade; select a
                // visible D reading without assuming the implementation offset.
                const reading = power < 1 ? power * 10 : power;
                const cursor = rt('GP_D').pos(reading) - kw;
                close(rt('GP_D').value(cursor + ps), reading / .736);
                const reverse = rt('GP_D').pos(reading / .736) - ps;
                close(rt('GP_D').value(reverse + kw), reading);
            }
            close(rt('GP_D').value(rt('GP_D').pos(6) - kw + ps), 8.152173913043478);
        }
    });

    test(`${model}: central-to-right power conversion has the square-scale pitch`, () => {
        const ps = mark(model, 'front', 'graphoplex-ps').offset;
        for (const value of [1.3, 6, 12, 48]) {
            const cursor = rt('GP_A').pos(value);
            close(rt('GP_A').value(cursor + ps), value / .736);
        }
    });

    test(`${model}: circle hairline gives area from diameter and only crosses A/B`, () => {
        const circle = mark(model, 'front', 'graphoplex-circle');
        for (const diameter of [1.3, 2, 3.5, 8]) {
            const cursor = rt('GP_D').pos(diameter);
            close(rt('GP_A').value(cursor + circle.offset), Math.PI * diameter ** 2 / 4);
        }
        const segments = cursorMarkSegments(face(model, 'front')).filter(s => s.mark.id === circle.id);
        assert.equal(segments.length, 1, 'A/B form one continuous stroke across the rail boundary');
        assert.deepEqual([segments[0].rail, segments[0].index, segments[0].endRail, segments[0].endIndex],
            ['topStator', 3, 'slide', 0]);
        assert.equal(marksForScale(face(model, 'front'), 'GP_D').some(m => m.id === circle.id), false);
    });

    test(`${model}: the 3.6 short line reproduces the manual D-to-DF example`, () => {
        const short = mark(model, 'back', 'graphoplex-360');
        const cursor = rt('GP_D').pos(3) - short.offset;
        // The manufacturer example 3×360=1080 needs its decimal restoration;
        // the displayed folded mantissa is 1.08, not 1080 or 10.8.
        close(rt('GP_DF').value(cursor), 1.08);
        const quotientCursor = rt('GP_DF').pos(3);
        close(rt('GP_D').value(quotientCursor + short.offset), 8.333333333333333);
        const segments = cursorMarkSegments(face(model, 'back')).filter(s => s.mark.id === short.id);
        assert.equal(segments.length, 1);
        assert.deepEqual([segments[0].rail, segments[0].index, segments[0].endRail, segments[0].endIndex],
            ['bottomStator', 0, 'bottomStator', 0]);
        assert.equal(marksForScale(face(model, 'back'), 'GP_DF').some(m => m.id === short.id), false);
        assert.equal(marksForScale(face(model, 'back'), 'GP_C').some(m => m.id === short.id), false);
    });
}

test('separate model configurations cannot accidentally mutate one another', () => {
    assert.notEqual(otherMakerCursors.graphoplex690a.front, otherMakerCursors.graphoplex691a.front);
    assert.notEqual(otherMakerCursors.graphoplex690a.front.cursorMarks, otherMakerCursors.graphoplex690a.back.cursorMarks);
    assert.notEqual(otherMakerCursors.hemmi257.front, otherMakerCursors.hemmi257.back);
});
