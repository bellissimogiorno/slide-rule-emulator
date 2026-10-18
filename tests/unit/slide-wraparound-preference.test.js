import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { deepClone, exportableState, normalizeState } from '#model/program.js';
import { parseProgramText, validateProgram } from '#model/validation.js';
import { loadProgramme, saveProgramme } from '#model/storage.js';
import { memoryStorage, programme } from './helpers.js';

test('slide wraparound is opt-in for new and legacy programmes', () => {
    const schema = JSON.parse(readFileSync(new URL('../../schema/program.schema.json', import.meta.url), 'utf8'));
    assert.equal(DEFAULT_STATE.slideWraparound, false);
    assert.equal(schema.properties.slideWraparound.type, 'boolean');
    assert.equal(schema.properties.slideWraparound.default, false);
    const legacy = exportableState(deepClone(DEFAULT_STATE));
    delete legacy.slideWraparound;
    const text = JSON.stringify(legacy);
    for (const state of [
        parseProgramText(text),
        loadProgramme({ seed: text, getStorage: () => memoryStorage() }).programme,
        loadProgramme({ key: 'legacy', getStorage: () => memoryStorage({ legacy: text }) }).programme
    ]) {
        normalizeState(state);
        assert.equal(state.slideWraparound, false);
        assert.deepEqual(state.sides, legacy.sides);
    }
});

test('both slide wraparound choices survive JSON, storage and configured seed restoration', () => {
    for (const slideWraparound of [false, true]) {
        const state = { ...deepClone(DEFAULT_STATE), slideWraparound,
            cursor: .123456789012345, slideOffset: -.811111111111 };
        const exported = exportableState(state);
        const text = JSON.stringify(exported);
        assert.equal(exported.slideWraparound, slideWraparound);
        assert.deepEqual(parseProgramText(text), exported);
        const storage = memoryStorage();
        saveProgramme({ getStorage: () => storage, programme: exported });
        for (const result of [
            loadProgramme({ getStorage: () => storage }),
            loadProgramme({ seed: text, getStorage: () => memoryStorage() })
        ]) {
            assert.equal(result.recovery, null);
            normalizeState(result.programme);
            assert.deepEqual(exportableState(result.programme), exported);
        }
        assert.equal(exported.cursor, state.cursor);
        assert.equal(exported.slideOffset, state.slideOffset);
    }
});

test('slide wraparound rejects nonboolean values instead of enabling a truthy preference', () => {
    for (const slideWraparound of ['true', 'false', 0, 1, null, {}, []]) {
        const state = { ...programme(), slideWraparound };
        assert.throws(() => validateProgram(state), /slideWraparound/);
        normalizeState(state);
        assert.equal(state.slideWraparound, false);
    }
});
