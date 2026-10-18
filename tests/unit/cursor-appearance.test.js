import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PRESETS } from '#catalog/presets.js';
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { CURSOR_SHAPES, CURSOR_COLOURS, cursorAppearanceSide } from '#model/cursor-appearance.js';
import { deepClone, mergeState, normalizeState, exportableState } from '#model/program.js';
import { parseProgramText, validateProgram } from '#model/validation.js';
import { loadProgramme, saveProgramme } from '#model/storage.js';
import { renderCursor } from '#ui/cursor-marks.js';
import { renderReadout } from '#ui/readout.js';
import { memoryStorage, programme } from './helpers.js';

const schema = JSON.parse(readFileSync(new URL('../../schema/program.schema.json', import.meta.url), 'utf8'));
const rails = ['topStator', 'slide', 'bottomStator'];

test('cursor preferences agree with the portable schema and default to each instrument', () => {
    assert.deepEqual(Object.keys(CURSOR_SHAPES), ['instrument', 'minimal']);
    for (const [field, choices] of [['cursorShape', CURSOR_SHAPES], ['cursorColour', CURSOR_COLOURS]]) {
        assert.ok(Object.isFrozen(choices));
        assert.equal(DEFAULT_STATE[field], 'instrument');
        assert.equal(schema.properties[field].type, 'string');
        assert.equal(schema.properties[field].default, 'instrument');
        assert.deepEqual(schema.properties[field].enum, Object.keys(choices));
        for (const value of Object.keys(choices)) {
            const state = { ...programme(), [field]: value };
            validateProgram(state);
            normalizeState(state);
            assert.equal(state[field], value);
        }
    }
});

test('invalid cursor preferences are rejected before import and normalized defensively', () => {
    for (const [field, values] of [
        ['cursorShape', ['wide', 'red', 'Instrument', '', null, 0, false, {}, ['minimal'], 'toString']],
        ['cursorColour', ['purple', 'clear', 'Red', '', null, 0, false, {}, ['red'], 'toString']]
    ]) {
        for (const value of values) {
            const state = { ...programme(), [field]: value };
            assert.throws(() => validateProgram(state), new RegExp(field));
            assert.throws(() => parseProgramText(JSON.stringify(state)), new RegExp(field));
            normalizeState(state);
            assert.equal(state[field], 'instrument');
        }
    }
});

test('retired shape overrides import as Instrument without discarding saved or embedded programmes', () => {
    const calibrated = Object.values(PRESETS).find(preset => Object.values(preset.sides).some(side => side.cursorMarks?.length > 10));
    assert.ok(calibrated, 'retain a fully calibrated second face');
    for (const cursorShape of ['clear', 'ivory', 'metal']) {
        for (const cursorColour of Object.keys(CURSOR_COLOURS)) {
            const saved = exportableState({ ...deepClone(DEFAULT_STATE), cursorShape, cursorColour,
                modelLabel: 'Saved custom instrument', viewMode: 'both', cursor: .3125, slideOffset: -.0625,
                customScales: [{ id: 'custom-linear', type: 'linear', min: 1, max: 10 }],
                sides: { front: { name: 'Custom face', topStator: ['custom-linear'], slide: ['C'], bottomStator: ['D'],
                    cursorFrame: cursorShape, cursorWidth: .16,
                    cursorMarks: [{ id: 'auxiliary', label: 'Auxiliary', offset: .05, scales: ['D'] }],
                    cursorCaptions: [{ id: 'caption', lines: ['Custom'], zone: 'topCap', offset: .05 }] },
                    back: deepClone(Object.values(calibrated.sides)[0]) } });
            // Simulate persisted input, bypassing the canonical current exporter.
            saved.cursorShape = cursorShape;
            const text = JSON.stringify(saved), expected = { ...saved, cursorShape: 'instrument' };
            assert.throws(() => validateProgram(saved), /cursorShape/, 'current schema is strict');
            assert.deepEqual(parseProgramText(text), expected, 'JSON imports are migrated at the boundary');
            assert.deepEqual(exportableState(saved), expected, 'exports never retain a retired shape');
            const normalized = deepClone(saved);
            normalizeState(normalized);
            assert.deepEqual(normalized, expected, 'normalization uses the same canonical shape');
            for (const result of [
                loadProgramme({ key: 'saved-custom', getStorage: () => memoryStorage({ 'saved-custom': text }) }),
                loadProgramme({ seed: text, getStorage: () => memoryStorage() })
            ]) {
                assert.equal(result.recovery, null, 'valid saved data must not enter recovery');
                assert.equal(result.message, '');
                assert.deepEqual(exportableState(result.programme), expected);
                assert.equal(result.programme.sides.front.cursorFrame, cursorShape, 'authored frame is preserved');
                assert.equal(result.programme.cursorColour, cursorColour, 'hairline preference is preserved');
            }
            assert.equal(saved.cursorShape, cursorShape, 'loading does not mutate caller data');
        }
    }
});

test('legacy JSON, embedded programmes and saved programmes acquire instrument defaults', () => {
    const legacy = exportableState(deepClone(DEFAULT_STATE));
    delete legacy.cursorShape;
    delete legacy.cursorColour;
    const text = JSON.stringify(legacy);
    const storage = memoryStorage({ legacy: text });
    for (const state of [
        parseProgramText(text),
        mergeState(deepClone(DEFAULT_STATE), parseProgramText(text)),
        loadProgramme({ seed: text, getStorage: () => memoryStorage() }).programme,
        loadProgramme({ key: 'legacy', getStorage: () => storage }).programme
    ]) {
        normalizeState(state);
        assert.equal(state.cursorShape, 'instrument');
        assert.equal(state.cursorColour, 'instrument');
        assert.deepEqual(state.sides, legacy.sides);
    }
});

test('every appearance combination survives JSON, browser storage and standalone seed restoration', () => {
    for (const cursorShape of Object.keys(CURSOR_SHAPES)) {
        for (const cursorColour of Object.keys(CURSOR_COLOURS)) {
            const state = { ...deepClone(DEFAULT_STATE), cursorShape, cursorColour, viewMode: 'both', cursor: .3125, slideOffset: -.0625 };
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
        }
    }
});

test('appearance projection preserves all authored faces, including laboratories and custom layouts', () => {
    const custom = { name: 'Custom', topStator: ['A'], slide: ['C'], bottomStator: ['D'],
        cursorLineTone: 'red', cursorFrame: 'metal', cursorWidth: .18,
        cursorMarks: [{ id: 'area', label: 'Area', offset: -.05, scales: ['A'] }],
        cursorCaptions: [{ id: 'caption', lines: ['Area'], zone: 'topCap', offset: -.05 }] };
    const allSides = [...Object.values(PRESETS).flatMap(preset => Object.values(preset.sides)), custom];
    assert.equal(allSides.length, 51);
    for (const side of allSides) {
        const original = deepClone(side);
        assert.strictEqual(cursorAppearanceSide(side), side);
        for (const cursorShape of Object.keys(CURSOR_SHAPES)) {
            for (const cursorColour of Object.keys(CURSOR_COLOURS)) {
                const projected = cursorAppearanceSide(side, { cursorShape, cursorColour });
                for (const rail of rails) assert.strictEqual(projected[rail], side[rail]);
                assert.equal(projected.name, side.name);
                assert.equal(projected.cursorLineTone, side.cursorLineTone);
                if (cursorShape === 'minimal') {
                    for (const field of ['cursorFrame', 'cursorWidth', 'cursorMarks', 'cursorCaptions'])
                        assert.ok(!Object.hasOwn(projected, field), field);
                } else {
                    for (const field of ['cursorWidth', 'cursorMarks', 'cursorCaptions'])
                        assert.strictEqual(projected[field], side[field]);
                    assert.equal(projected.cursorFrame, side.cursorFrame);
                }
                const originalDefault = renderCursor(side, 'original').includes('has-auxiliary') ? 'black' : 'red';
                const expectedColour = cursorColour !== 'instrument' ? cursorColour
                    : cursorShape !== 'instrument' && side.cursorLineTone === undefined ? originalDefault : undefined;
                assert.equal(projected.cursorColour, expectedColour);
                assert.deepEqual(side, original);
            }
        }
        // No previous projection can erase the original multi-line cursor.
        assert.strictEqual(cursorAppearanceSide(side, { cursorShape: 'instrument', cursorColour: 'instrument' }), side);
    }
});

test('changing shape preserves Instrument colour even when only an implicit original tone exists', () => {
    const plain = { name: 'Custom', topStator: ['A'], slide: ['C'], bottomStator: ['D'] };
    for (const [detail, colour] of [
        [{}, 'red'],
        [{ cursorMarks: [{ id: 'removed', label: 'Removed row', offset: .1, scales: ['K'] }] }, 'red'],
        [{ cursorCaptions: [{ id: 'removed', offset: 0, lines: ['Removed row'], zone: 'row', scale: 'K', edge: 'top' }] }, 'red'],
        [{ cursorFrame: 'clear' }, 'black'],
        [{ cursorWidth: .1 }, 'black'],
        [{ cursorMarks: [{ id: 'long', label: 'Long mark', offset: .1 }] }, 'black'],
        [{ cursorMarks: [{ id: 'visible', label: 'Visible row', offset: .1, scales: ['A'] }] }, 'black'],
        [{ cursorCaptions: [{ id: 'cap', offset: 0, lines: ['Cap'], zone: 'topCap' }] }, 'black'],
        [{ cursorCaptions: [{ id: 'visible', offset: 0, lines: ['Visible row'], zone: 'row', scale: 'A', edge: 'top' }] }, 'black']
    ]) {
        const side = { ...plain, ...detail };
        const before = deepClone(side);
        // The expectation is independently checked against the actual original
        // renderer path, including details whose referenced rows are absent.
        assert.equal(renderCursor(side, 'original').includes('has-auxiliary'), colour === 'black');
        const projected = cursorAppearanceSide(side, { cursorShape: 'minimal', cursorColour: 'instrument' });
        assert.equal(projected.cursorColour, colour);
        assert.equal(projected.cursorLineTone, undefined);
        assert.match(renderCursor(projected, 'changed'), new RegExp(`cursor-colour-${colour}`));
        assert.deepEqual(side, before);
        assert.strictEqual(cursorAppearanceSide(side, { cursorShape: 'instrument', cursorColour: 'instrument' }), side);
    }
});

test('plain laboratories keep their original red hairline and readings in Minimal', () => {
    for (const preset of Object.values(PRESETS).filter(preset => preset.group === 'Mathematical laboratories')) {
        const state = { ...deepClone(DEFAULT_STATE), sides: preset.sides, viewMode: 'both', cursor: .4 };
        const before = renderReadout(state, BUILTIN_SCALES);
        const changed = { ...state, cursorShape: 'minimal' };
        assert.equal(renderReadout(changed, BUILTIN_SCALES), before);
        for (const side of Object.values(preset.sides)) {
            assert.equal(cursorAppearanceSide(side, changed).cursorColour, 'red');
            assert.equal(side.cursorLineTone, undefined);
            assert.ok(!Object.hasOwn(side, 'cursorColour'));
        }
    }
});

test('an untoned custom frame retains its neutral hairline and main readings in Minimal', () => {
    const state = { ...deepClone(DEFAULT_STATE), sides: {
        front: { name: 'Custom', topStator: ['A'], slide: ['C'], bottomStator: ['D'], cursorFrame: 'metal' }
    } };
    const changed = { ...state, cursorShape: 'minimal' };
    assert.equal(cursorAppearanceSide(state.sides.front, changed).cursorColour, 'black');
    assert.equal(renderReadout(changed, BUILTIN_SCALES), renderReadout(state, BUILTIN_SCALES));
    assert.equal(state.sides.front.cursorLineTone, undefined);
    assert.ok(!Object.hasOwn(state.sides.front, 'cursorColour'));
});

test('using Minimal then restoring Instrument retains calibrated metadata through persistence', () => {
    const preset = Object.values(PRESETS).find(preset => Object.values(preset.sides).some(side => side.cursorMarks?.length > 10));
    assert.ok(preset, 'exercise a rich, calibrated cursor');
    const state = { ...deepClone(DEFAULT_STATE), sides: deepClone(preset.sides), cursorShape: 'minimal', cursorColour: 'red' };
    for (const side of Object.values(state.sides)) {
        const minimal = cursorAppearanceSide(side, state);
        assert.equal(minimal.cursorMarks, undefined);
        assert.equal(minimal.cursorColour, 'red');
    }
    const restored = parseProgramText(JSON.stringify(exportableState(state)));
    assert.deepEqual(restored.sides, preset.sides);
    restored.cursorShape = 'instrument';
    restored.cursorColour = 'instrument';
    for (const [face, side] of Object.entries(restored.sides)) {
        assert.deepEqual(cursorAppearanceSide(side, restored), preset.sides[face]);
        assert.ok(!Object.hasOwn(side, 'cursorColour'), 'rendering hints must not leak into saved sides');
    }
});
