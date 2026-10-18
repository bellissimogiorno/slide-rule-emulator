import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { deepClone, exportableState, normalizeState } from '#model/program.js';
import { parseProgramText, validateProgram } from '#model/validation.js';
import { loadProgramme, saveProgramme } from '#model/storage.js';
import { memoryStorage, programme } from './helpers.js';

test('new and legacy programmes default to useful decimal precision', () => {
    const schema = JSON.parse(readFileSync(new URL('../../schema/program.schema.json', import.meta.url), 'utf8'));
    assert.equal(DEFAULT_STATE.fullPrecision, false);
    assert.equal(schema.properties.fullPrecision.type, 'boolean');
    assert.equal(schema.properties.fullPrecision.default, false);
    const legacy = exportableState(deepClone(DEFAULT_STATE));
    delete legacy.fullPrecision;
    const text = JSON.stringify(legacy);
    for (const state of [
        parseProgramText(text),
        loadProgramme({ seed: text, getStorage: () => memoryStorage() }).programme,
        loadProgramme({ key: 'legacy', getStorage: () => memoryStorage({ legacy: text }) }).programme
    ]) {
        normalizeState(state);
        assert.equal(state.fullPrecision, false);
        assert.deepEqual(state.sides, legacy.sides);
    }
});

test('both precision choices survive export, storage and standalone restoration without rounding positions', () => {
    for (const fullPrecision of [false, true]) {
        const state = { ...deepClone(DEFAULT_STATE), fullPrecision, cursor: .123456789012345, slideOffset: -.111111111111 };
        const exported = exportableState(state);
        const text = JSON.stringify(exported);
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

test('precision preference requires a boolean at the import boundary', () => {
    for (const fullPrecision of ['true', 'false', 0, 1, null, {}, []]) {
        const state = { ...programme(), fullPrecision };
        assert.throws(() => validateProgram(state), /fullPrecision/);
        normalizeState(state);
        assert.equal(state.fullPrecision, false);
    }
});
