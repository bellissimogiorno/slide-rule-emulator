import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { buildLibrary, exportableState, deepClone, normalizeState } from '#model/program.js';
import { configuredStorageKey, loadProgramme, saveProgramme } from '#model/storage.js';
import { STORAGE_KEY } from '#version.js';
import { programme, memoryStorage } from './helpers.js';
test('export and catalogue snapshots do not mutate or freeze caller data', () => {
    const state = deepClone(DEFAULT_STATE);
    state.cursor = .123456789012345;
    state.slideOffset = -.111111111111;
    state.customScales = [{ id: 'X', type: 'log', min: 1, max: 10, gauges: [{ value: 2, label: 'two' }] }];
    const library = buildLibrary(state);
    assert.ok(Object.isFrozen(library.X.gauges));
    assert.ok(!Object.isFrozen(state.customScales[0].gauges));
    state.customScales[0].gauges[0].label = 'changed';
    assert.equal(library.X.gauges[0].label, 'two');
    const exported = exportableState(state);
    assert.equal(exported.cursor, state.cursor);
    assert.equal(exported.slideOffset, state.slideOffset);
    exported.sides.front.slide.push('D');
    assert.notDeepEqual(state.sides.front.slide, exported.sides.front.slide);
    assert.ok(Object.isFrozen(BUILTIN_SCALES));
});
test('zero position survives normalisation and storage', () => {
    const state = { ...deepClone(DEFAULT_STATE), cursor: 0, slideOffset: 0 };
    normalizeState(state);
    const storage = memoryStorage();
    saveProgramme({ getStorage: () => storage, programme: exportableState(state) });
    const loaded = loadProgramme({ getStorage: () => storage });
    assert.equal(loaded.programme.cursor, 0);
    assert.equal(loaded.programme.slideOffset, 0);
});
test('denied storage loads a usable default with a visible-warning message', () => {
    const loaded = loadProgramme({ getStorage: () => { throw Error('Denied'); } });
    assert.equal(loaded.programme.presetId, 'faber283n');
    assert.match(loaded.message, /unavailable/);
});
test('corrupt storage is retained, not discarded or executed', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: '{"bad":true}' });
    const loaded = loadProgramme({ getStorage: () => storage });
    assert.equal(loaded.recovery, '{"bad":true}');
    assert.match(loaded.message, /rejected/);
    saveProgramme({ getStorage: () => storage, programme: loaded.programme, recovery: loaded.recovery });
    assert.equal(storage.getItem(STORAGE_KEY + '.recovery'), loaded.recovery);
});
test('invalid embedded programme has recoverable original text', () => {
    const loaded = loadProgramme({ seed: 'invalid', getStorage: () => memoryStorage() });
    assert.equal(loaded.recovery, 'invalid');
    assert.match(loaded.message, /embedded programme is invalid/);
});
test('configured copy uses a separate stable storage namespace', () => {
    const p = { ...programme(), cursor: .23456789 };
    const seed = JSON.stringify(p);
    const storage = memoryStorage({ [STORAGE_KEY]: JSON.stringify({ ...p, cursor: .9 }) });
    const loaded = loadProgramme({ seed, getStorage: () => storage });
    assert.equal(loaded.programme.cursor, p.cursor);
    assert.equal(loaded.key, configuredStorageKey(seed));
    saveProgramme({ getStorage: () => storage, key: loaded.key, programme: { ...p, cursor: .12 } });
    assert.equal(loadProgramme({ seed, getStorage: () => storage }).programme.cursor, .12);
});
test('failed recovery backup does not overwrite the original record', () => {
    const storage = memoryStorage({ [STORAGE_KEY]: 'bad' });
    const set = storage.setItem;
    storage.setItem = (k, v) => {
        if (k.endsWith('.recovery'))
            throw Error('Full');
        set(k, v);
    };
    assert.throws(() => saveProgramme({ getStorage: () => storage, programme: DEFAULT_STATE, recovery: 'bad' }));
    assert.equal(storage.getItem(STORAGE_KEY), 'bad');
});
