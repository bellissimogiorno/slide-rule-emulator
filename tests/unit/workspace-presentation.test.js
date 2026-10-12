import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { MAGNIFICATIONS } from '#model/view.js';
import { DEFAULT_STATE } from '#catalog/defaults.js';
import { BUILTIN_SCALES } from '#catalog/scales.js';
import { normalizeState, deepClone, exportableState } from '#model/program.js';
import { validateProgram, parseProgramText } from '#model/validation.js';
import { saveProgramme, loadProgramme } from '#model/storage.js';
import { renderReadout } from '#ui/readout.js';
import { memoryStorage } from './helpers.js';

const template = await readFile(new URL('../../src/index.html', import.meta.url), 'utf8');
const schema = JSON.parse(await readFile(new URL('../../schema/program.schema.json', import.meta.url), 'utf8'));

test('magnification menu, schema, normalisation and validation share all five exact choices', () => {
    assert.deepEqual(MAGNIFICATIONS, [.75, 1, 1.25, 1.5, 2]);
    assert.ok(Object.isFrozen(MAGNIFICATIONS));
    assert.deepEqual(schema.properties.magnification.enum, MAGNIFICATIONS);
    const menu = template.match(/id="magnificationSelect"[^>]*>([\s\S]*?)<\/select>/)[1];
    assert.deepEqual([...menu.matchAll(/value="([\d.]+)"/g)].map(m => Number(m[1])), MAGNIFICATIONS);
    for (const magnification of MAGNIFICATIONS) {
        const state = {...deepClone(DEFAULT_STATE), magnification};
        validateProgram(state); normalizeState(state);
        assert.equal(state.magnification, magnification);
    }
});
test('75 percent magnification survives export, parse and persistent storage without changing the instrument', () => {
    const state = {...deepClone(DEFAULT_STATE), magnification: .75, viewMode: 'both', cursor: .31, slideOffset: .127};
    const exported = exportableState(state);
    assert.deepEqual(parseProgramText(JSON.stringify(exported)), exported);
    const storage = memoryStorage();
    saveProgramme({getStorage: () => storage, programme: exported});
    const loaded = loadProgramme({getStorage: () => storage});
    assert.equal(loaded.recovery, null);
    assert.deepEqual(exportableState(loaded.programme), exported);
    assert.equal(renderReadout(state, BUILTIN_SCALES), renderReadout({...state, magnification: 1}, BUILTIN_SCALES));
});
for (const invalid of [.5, .74, .76, 0, 2.1, '0.75', null, NaN, Infinity]) {
    test(`magnification still rejects unsupported choice ${String(invalid)} (${typeof invalid})`, () => {
        assert.throws(() => validateProgram({...deepClone(DEFAULT_STATE), magnification: invalid}), /magnification|finite/);
        const state = {...deepClone(DEFAULT_STATE), magnification: invalid};
        normalizeState(state); assert.equal(state.magnification, 1);
    });
}
test('one labelled preset chooser precedes motion controls and has a non-loading description toggle', () => {
    assert.equal((template.match(/id="presetSelect"/g) || []).length, 1);
    assert.equal((template.match(/id="loadPresetButton"/g) || []).length, 1);
    assert.ok(template.indexOf('id="workbench"') < template.indexOf('id="presetPicker"'));
    assert.ok(template.indexOf('id="presetSelect"') < template.indexOf('class="toolbar"'));
    assert.match(template, /<label[^>]+for="presetSelect"/);
    assert.match(template, /id="loadPresetButton"[^>]+class="primary"/);
    assert.match(template, /id="presetDetailsButton"[^>]+aria-expanded="false"[^>]+aria-controls="presetDescription"/);
    assert.match(template, /id="presetDescription"[^>]+hidden/);
    assert.match(template, /href="#presetPicker"/);
});
test('compact precision keeps four complete accessible names plus a selected-setting heading', () => {
    assert.match(template, /class="step-value"[^>]+aria-hidden="true">2 Normal</);
    for (const [i, name, value] of [[1,'Faster','.005'],[2,'Normal','.001'],[3,'Fine','.0005'],[4,'Very fine','.0001']]) {
        assert.ok(template.includes(`data-step-name="${name}"`));
        assert.ok(template.includes(`<kbd>${i}</kbd> ${name}: </span><small>0${value}</small>`));
    }
    const step = template.slice(template.indexOf('id="motionStep"'), template.indexOf('id="motionHelp"'));
    assert.ok(!step.includes('id="motionTarget"'), 'status must not make the step card taller');
});
