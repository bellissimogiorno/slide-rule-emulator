import test from 'node:test';
import assert from 'node:assert/strict';
import { pickettKeCursors } from '#catalog/cursors/pickett-ke.js';
import { historicalPresets } from '#catalog/presets/historical.js';
import { pickett14Presets } from '#catalog/presets/pickett14.js';
import { cursorGlassWidth, cursorMarkSegments, marksForScale, renderCursor } from '#ui/cursor-marks.js';
import { validateProgram, parseProgramText } from '#model/validation.js';

const layouts = { ...historicalPresets, ...pickett14Presets };

for (const id of ['pickettN3', 'pickettN4', 'pickettN16', 'pickett14', 'blackbody17', 'keDecilon']) {
    test(`${id}: documented single-hairline cursor adds no numerical auxiliary readings`, () => {
        const preset = structuredClone(layouts[id]);
        for (const face of ['front', 'back']) {
            const side = Object.assign(preset.sides[face], pickettKeCursors[id][face]);
            assert.deepEqual(cursorMarkSegments(side), []);
            for (const scale of [...side.topStator, ...side.slide, ...side.bottomStator])
                assert.deepEqual(marksForScale(side, scale), []);
            assert.equal(side.cursorCaptions, undefined);
            const markup = renderCursor(side, `cursor-${face}`);
            assert.doesNotMatch(markup, /data-cursor-mark=|data-cursor-caption=/);
            assert.match(markup, new RegExp(`cursor-lines-${id === 'keDecilon' ? 'red' : 'neutral'}`));
            assert.match(markup, new RegExp(`cursor-frame-${id === 'keDecilon' ? 'metal' : 'clear'}`));
            assert.equal((markup.match(/class="cursor-cap cursor-/g) || []).length, 2,
                'unlettered physical bars must render without invented numerical marks');
            const width = id === 'keDecilon' ? 0.14 : 0.115;
            assert.match(markup, new RegExp(`data-cursor-width="${width}"`));
            assert.equal(cursorGlassWidth([], 1000, side.cursorWidth), width * 1000,
                'a plain instrument cursor must keep its housing width without auxiliary marks');
        }
        assert.doesNotThrow(() => validateProgram(preset));
        assert.deepEqual(parseProgramText(JSON.stringify(preset)).sides, preset.sides);
    });
}

test('single-hairline profiles retain distinct, independently editable faces', () => {
    const profiles = structuredClone(pickettKeCursors);
    profiles.pickettN3.front.cursorLineTone = 'red';
    assert.equal(profiles.pickettN3.back.cursorLineTone, 'neutral');
    assert.equal(profiles.pickettN4.front.cursorLineTone, 'neutral');
    assert.equal(profiles.keDecilon.front.cursorFrame, 'metal');
    assert.equal(profiles.keDecilon.back.cursorFrame, 'metal');
});
