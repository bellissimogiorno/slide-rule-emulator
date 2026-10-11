import test from 'node:test';
import assert from 'node:assert/strict';
import { createScaleHistory, SCALE_HISTORY_LIMIT } from '#model/scale-history.js';
import { adjacentScalePosition, moveScale } from '#model/scale-order.js';
import { railEditorMarkup } from '#ui/rail-editor.js';

const face = () => ({ name: 'Front', topStator: ['A', 'D'], slide: ['C'], bottomStator: ['D', 'K'] });
const state = () => ({ presetId: 'classic', activeSide: 'front', viewMode: 'single',
    sides: { front: face(), back: { ...face(), name: 'Back' } }, cursor: .5, slideOffset: .25, theme: 'faber' });
const at = (rail, index) => ({ rail, index });
for (const [name, from, direction, expected] of [
    ['within top', at('topStator', 1), -1, at('topStator', 0)],
    ['top to slide', at('topStator', 1), 1, at('slide', 0)],
    ['slide to top', at('slide', 0), -1, at('topStator', 2)],
    ['slide to bottom', at('slide', 0), 1, at('bottomStator', 0)],
    ['bottom to slide', at('bottomStator', 0), -1, at('slide', 1)],
    ['first scale', at('topStator', 0), -1, null],
    ['last scale', at('bottomStator', 1), 1, null]
]) test(`adjacent scale destination: ${name}`, () => {
    const side = face(), original = structuredClone(side);
    assert.deepEqual(adjacentScalePosition(side, from, direction), expected);
    assert.deepEqual(side, original);
});
test('vertical arrows enter an empty rail and reject a full one without data loss', () => {
    const side = { ...face(), slide: [] };
    const next = adjacentScalePosition(side, at('topStator', 1), 1);
    assert.deepEqual(next, at('slide', 0));
    assert.deepEqual(moveScale(side, at('topStator', 1), next).slide, ['D']);
    side.slide = Array(40).fill('C');
    assert.throws(() => moveScale(side, at('topStator', 1), next), /40 rows/);
    assert.equal(side.topStator.length, 2);
});
test('vertical arrow stepping rejects invalid direction and source positions', () => {
    for (const [from, direction] of [[at('x', 0), 1], [at('slide', -1), 1], [at('slide', 1), 1], [at('slide', .5), 1], [at('slide', 0), 0]])
        assert.throws(() => adjacentScalePosition(face(), from, direction), /Invalid scale step/);
});
test('scale history undoes multiple edits in order without rewinding view or motion', () => {
    const history = createScaleHistory(); let current = state(); const original = structuredClone(current);
    assert.equal(history.undo(current), null);
    history.remember(current, 'Remove D', at('topStator', 1));
    current.sides.front.topStator.pop(); current.presetId = 'custom';
    history.remember(current, 'Move A', at('topStator', 0));
    current.sides.front = moveScale(current.sides.front, at('topStator', 0), at('slide', 1));
    current.cursor = .7; current.slideOffset = -.3; current.viewMode = 'both'; current.theme = 'pickett-es';
    current = history.undo(current).state;
    assert.deepEqual(current.sides.front.topStator, ['A']);
    assert.equal(history.description, 'Remove D');
    const restored = history.undo(current); current = restored.state;
    assert.deepEqual(current.sides, original.sides);
    assert.equal(current.presetId, 'classic');
    assert.equal(current.cursor, .7); assert.equal(current.slideOffset, -.3);
    assert.equal(current.viewMode, 'both'); assert.equal(current.theme, 'pickett-es');
    assert.deepEqual(restored.focus, at('topStator', 1));
    assert.equal(history.size, 0);
});
test('scale history is shared across faces and restores the edited face only', () => {
    const history = createScaleHistory(); let current = state();
    history.remember(current, 'Remove A', at('topStator', 0));
    current.sides.front.topStator.shift(); current.activeSide = 'back';
    history.remember(current, 'Remove C', at('slide', 0)); current.sides.back.slide = [];
    current = history.undo(current).state;
    assert.equal(current.activeSide, 'back'); assert.deepEqual(current.sides.back.slide, ['C']);
    assert.deepEqual(current.sides.front.topStator, ['D']);
    current = history.undo(current).state;
    assert.equal(current.activeSide, 'front'); assert.deepEqual(current.sides.front.topStator, ['A', 'D']);
});
test('history snapshots and focus positions are isolated from their callers', () => {
    const history = createScaleHistory(); const current = state(), focus = at('slide', 0);
    history.remember(current, 'Remove C', focus); current.sides.front.slide[0] = 'CI'; focus.index = 99;
    const result = history.undo(current);
    assert.deepEqual(result.state.sides.front.slide, ['C']);
    assert.deepEqual(result.focus, at('slide', 0));
    assert.deepEqual(current.sides.front.slide, ['CI']);
});
test('undo history is bounded, has no timer, and can be explicitly cleared', () => {
    assert.equal(SCALE_HISTORY_LIMIT, 100);
    const history = createScaleHistory(2); const current = state();
    for (const name of ['first', 'second', 'third']) history.remember(current, name, at('slide', 0));
    assert.equal(history.size, 2);
    assert.equal(history.undo(current).description, 'third');
    assert.equal(history.undo(current).description, 'second');
    assert.equal(history.undo(current), null);
    history.remember(current, 'fourth', at('slide', 0)); history.clear();
    assert.equal(history.description, ''); assert.equal(history.undo(current), null);
    assert.throws(() => createScaleHistory(0)); assert.throws(() => createScaleHistory(1.5));
});
test('history cannot restore an absent face and does not consume that entry', () => {
    const history = createScaleHistory(), current = state();
    history.remember(current, 'Remove C', at('slide', 0)); delete current.sides.front;
    assert.throws(() => history.undo(current), /no longer exists/);
    assert.equal(history.size, 1);
    assert.throws(() => history.remember(current, 'Invalid', at('slide', 0)), /absent face/);
});
test('compact editor provides paired arrows and shared, initially disabled Undo controls', () => {
    const markup = railEditorMarkup(face(), { A: {}, C: {}, D: {}, K: {} });
    assert.equal((markup.match(/class="scale-row-arrows"/g) || []).length, 5);
    assert.equal((markup.match(/data-action="undo"/g) || []).length, 3);
    assert.match(markup, /aria-controls="railEditors" disabled/);
    assert.match(markup, /aria-hidden="true".*<path/);
});
