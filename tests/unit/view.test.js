import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleSideKeys } from '#model/view.js';
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { normalizeState, deepClone, exportableState } from '#model/program.js';
import { validateProgram } from '#model/validation.js';
import { renderReadout } from '#ui/readout.js';
import { loadProgramme, saveProgramme } from '#model/storage.js';
import { rail, memoryStorage } from './helpers.js';

test('view mode and edited face are independent and backwards compatible', () => {
    const state = deepClone(DEFAULT_STATE);
    delete state.viewMode;
    normalizeState(state);
    assert.equal(state.viewMode, 'single');
    assert.deepEqual(visibleSideKeys(state), ['front']);
    state.viewMode = 'both'; state.activeSide = 'back';
    assert.deepEqual(visibleSideKeys(state), ['front', 'back']);
    assert.equal(exportableState(state).viewMode, 'both');
    assert.equal(exportableState(state).activeSide, 'back');
});
test('a custom face may be called both without conflict', () => {
    const state = {viewMode: 'both', activeSide: 'both', sides: {both: rail(['C']), third: rail(['D'])}};
    validateProgram(state);
    assert.deepEqual(visibleSideKeys(state), ['both', 'third']);
    assert.throws(() => validateProgram({...state, viewMode: 'sidebyside'}), /viewMode/);
});
test('both-view readouts include escaped titles and every face', () => {
    const state = {viewMode: 'both', activeSide: 'front', cursor: .5, slideOffset: .1,
        sides: {front: {...rail(['D']), name: '<front>'}, back: {...rail(['A']), name: 'Back'}}};
    const html = renderReadout(state, BUILTIN_SCALES);
    assert.equal((html.match(/readout-side-heading/g) || []).length, 2);
    assert.match(html, /&lt;front&gt;/);
    assert.match(html, /scale-id">D</);
    assert.match(html, /scale-id">A</);
});
test('both-view setting survives persistence and programmes may omit the view setting', () => {
    const state = {...deepClone(DEFAULT_STATE), viewMode: 'both', activeSide: 'back'};
    const storage = memoryStorage();
    saveProgramme({getStorage: () => storage, programme: exportableState(state)});
    const loaded = loadProgramme({getStorage: () => storage});
    assert.equal(loaded.programme.viewMode, 'both');
    assert.equal(loaded.programme.activeSide, 'back');
    delete state.viewMode;
    validateProgram(state);
});
