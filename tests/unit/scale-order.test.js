import test from 'node:test';
import assert from 'node:assert/strict';
import { moveScale } from '#model/scale-order.js';
import { railEditorMarkup } from '#ui/rail-editor.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { PRESETS } from '#catalog/presets.js';
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { validateProgram } from '#model/validation.js';
const source = () => ({ name: 'Face', topStator: ['A', 'D', 'K', 'D'], slide: ['C'], bottomStator: [] });
const at = (rail, index) => ({ rail, index });

test('scale reorder uses final indices and leaves the input untouched', () => {
    const side = source(), frozen = JSON.stringify(side);
    assert.deepEqual(moveScale(side, at('topStator', 0), at('topStator', 3)).topStator, ['D', 'K', 'D', 'A']);
    assert.deepEqual(moveScale(side, at('topStator', 3), at('topStator', 0)).topStator, ['D', 'A', 'D', 'K']);
    assert.equal(JSON.stringify(side), frozen);
});
test('duplicate scale occurrences remain distinct and a no-op preserves identity', () => {
    const side = source();
    assert.deepEqual(moveScale(side, at('topStator', 1), at('topStator', 3)).topStator, ['A', 'K', 'D', 'D']);
    assert.equal(moveScale(side, at('topStator', 1), at('topStator', 1)), side);
});
test('cross-rail move can populate an empty rail without changing the total', () => {
    const side = source();
    const next = moveScale(side, at('slide', 0), at('bottomStator', 0));
    assert.deepEqual(next.slide, []); assert.deepEqual(next.bottomStator, ['C']);
    assert.equal(next.name, side.name); assert.equal(next.topStator, side.topStator);
    assert.deepEqual(side.slide, ['C']);
});
for (const [name, from, to] of [
    ['unknown source', at('other', 0), at('slide', 0)],
    ['unknown target', at('slide', 0), at('other', 0)],
    ['negative source', at('slide', -1), at('topStator', 0)],
    ['past source', at('slide', 1), at('topStator', 0)],
    ['fractional target', at('slide', 0), at('topStator', .5)],
    ['negative target', at('slide', 0), at('topStator', -1)],
    ['past target', at('slide', 0), at('topStator', 5)],
    ['old rather than final same-rail bound', at('topStator', 0), at('topStator', 4)],
]) test(`scale reorder rejects ${name} atomically`, () => {
    const side = source(), before = JSON.stringify(side);
    assert.throws(() => moveScale(side, from, to));
    assert.equal(JSON.stringify(side), before);
});
test('full rail rejects transfers but permits its own reorder', () => {
    const side = { ...source(), topStator: Array(40).fill('D') };
    assert.throws(() => moveScale(side, at('slide', 0), at('topStator', 0)), /40 rows/);
    assert.equal(moveScale(side, at('topStator', 0), at('topStator', 39)).topStator.length, 40);
});
test('moving an entire root bank or other catalogue row keeps every preset valid', () => {
    for (const preset of Object.values(PRESETS)) {
        for (const [key, side] of Object.entries(preset.sides)) {
            for (const rail of ['topStator', 'slide', 'bottomStator']) {
                if (!side[rail].length) continue;
                const next = moveScale(side, at(rail, 0), at(rail, side[rail].length - 1));
                const programme = { ...structuredClone(DEFAULT_STATE), sides: { ...preset.sides, [key]: next } };
                assert.doesNotThrow(() => validateProgram(programme));
            }
        }
    }
});
test('editor has grips, bold decorative arrows, empty targets and safe custom options', () => {
    const library = { ...BUILTIN_SCALES, evil: { description: '<img src=x>', label: '<&"' } };
    const html = railEditorMarkup(source(), library);
    assert.equal((html.match(/class="scale-grip"/g) || []).length, 5);
    assert.equal((html.match(/class="rail-row-list"/g) || []).length, 3);
    assert.equal((html.match(/data-action="up"/g) || []).length, 5);
    assert.match(html, /<svg.*aria-hidden="true"/);
    assert.doesNotMatch(html, />Up<|>Down<|<img/);
    assert.match(html, /&lt;img src=x&gt;/);
});
