import test from 'node:test';
import assert from 'node:assert/strict';
import { PRESETS } from '#catalog/presets.js';
import { presetMenuGroups } from '#catalog/preset-menu.js';

test('every preset has a usable menu name and section', () => {
    for (const [id, preset] of Object.entries(PRESETS)) {
        assert.equal(typeof preset.name, 'string', `${id}: missing name`);
        assert.ok(preset.name.trim(), `${id}: empty name`);
        assert.equal(typeof preset.group, 'string', `${id}: missing section`);
        assert.ok(preset.group.trim(), `${id}: empty section`);
    }
});

test('instrument sections group manufacturers and order model numbers naturally', () => {
    const groups = new Map(presetMenuGroups(PRESETS));
    const classic = groups.get('Classic instruments').map(([id]) => id);
    for (const expected of [
        ['aristo0971', 'aristo0972'],
        ['faber282n', 'faber283n', 'faber284n'],
        ['graphoplex690a', 'graphoplex691a'],
        ['pickettN3', 'pickettN4', 'pickettN16']
    ]) {
        const start = classic.indexOf(expected[0]);
        assert.ok(start >= 0, `${expected[0]} missing`);
        assert.deepEqual(classic.slice(start, start + expected.length), expected);
    }
    const specialist = groups.get('Specialist instruments').map(([id]) => id);
    assert.deepEqual(specialist, ['pickett14', 'blackbody17', 'thorntonF5100']);
    assert.deepEqual([...groups.keys()], ['Classic instruments', 'Specialist instruments', 'Chemical instruments', 'Mathematical laboratories']);
});

test('menu construction preserves every catalogue entry exactly once and does not mutate it', () => {
    const before = JSON.stringify(PRESETS);
    const entries = presetMenuGroups(PRESETS).flatMap(([, items]) => items);
    assert.deepEqual(entries.map(([id]) => id).sort(), Object.keys(PRESETS).sort());
    assert.equal(JSON.stringify(PRESETS), before);
    const laboratories = entries.filter(([, p]) => p.group === 'Mathematical laboratories');
    assert.deepEqual(laboratories.map(([id]) => id), Object.entries(PRESETS)
        .filter(([, p]) => p.group === 'Mathematical laboratories').map(([id]) => id));
});
