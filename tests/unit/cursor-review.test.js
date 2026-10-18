/** Catalogue-wide coverage and portable-example checks. Historical formulae
 * have independent worked tests in the three manufacturer cursor suites. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { PRESETS } from '#catalog/presets.js';
import { DEFAULT_STATE } from '#catalog/defaults.js';

const review = JSON.parse(readFileSync(new URL('../../docs/data/cursor-review.json', import.meta.url), 'utf8'));
const presentation = side => Object.fromEntries(Object.entries(side).filter(([key]) => key.startsWith('cursor')));

test('cursor review explicitly covers every preset and every face', () => {
    assert.deepEqual(Object.keys(review).sort(), Object.keys(PRESETS).sort());
    let faces = 0;
    for (const [id, preset] of Object.entries(PRESETS)) {
        const item = review[id];
        assert.deepEqual(Object.keys(item.faces).sort(), Object.keys(preset.sides).sort(), id);
        assert.ok(['reconstructed', 'single-hairline', 'partial', 'digital-design'].includes(item.status), id);
        assert.ok(item.basis.length > 20 && item.limits.length > 20, id);
        assert.ok(existsSync(new URL(`../../docs/${item.guide}`, import.meta.url)), id);
        for (const text of Object.values(item.faces)) {
            assert.ok(typeof text === 'string' && text.length > 20, id);
            faces++;
        }
    }
    assert.equal(faces, 50);
});

test('default instrument receives the complete catalogue cursor', () => {
    assert.deepEqual(DEFAULT_STATE.sides, PRESETS.faber283n.sides);
});

test('every named preset example carries the current cursor on each face', () => {
    const directory = new URL('../../examples/', import.meta.url);
    let checked = 0;
    for (const name of readdirSync(directory).filter(name => name.endsWith('.json'))) {
        const example = JSON.parse(readFileSync(new URL(name, directory), 'utf8'));
        const preset = PRESETS[example.presetId];
        if (!preset) continue;
        for (const [face, side] of Object.entries(example.sides)) {
            assert.deepEqual(presentation(side), presentation(preset.sides[face]), `${name}: ${face}`);
            checked++;
        }
    }
    assert.ok(checked >= 20, 'named examples must actually be checked');
});

test('mathematical laboratories keep their plain digital cursor', () => {
    for (const [id, preset] of Object.entries(PRESETS)) {
        if (preset.group !== 'Mathematical laboratories') continue;
        assert.equal(review[id].status, 'digital-design', id);
        for (const side of Object.values(preset.sides)) assert.deepEqual(presentation(side), {}, id);
    }
});
